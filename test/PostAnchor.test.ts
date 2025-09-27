import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { Signer } from "ethers";

describe("PostAnchor", function () {
  let postAnchor: any;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  // Sample test data
  const SAMPLE_CID = "QmExampleCIDHashForTesting123";
  const SAMPLE_METADATA = '{"tags":["crypto","defi"],"category":"post","title":"Test Post"}';
  const SAMPLE_CID_HASH = ethers.keccak256(ethers.toUtf8Bytes(SAMPLE_CID));
  const SAMPLE_META_HASH = ethers.keccak256(ethers.toUtf8Bytes(SAMPLE_METADATA));
  const ZERO_HASH = ethers.ZeroHash;

  async function deployPostAnchorFixture() {
    const signers = await ethers.getSigners();
    const [owner, user1, user2] = signers;
    
    const ownerAddress = await owner.getAddress();
    const user1Address = await user1.getAddress();
    const user2Address = await user2.getAddress();

    const PostAnchorFactory = await ethers.getContractFactory("PostAnchor");
    const postAnchor = await PostAnchorFactory.deploy();
    await postAnchor.waitForDeployment();

    return {
      postAnchor,
      owner,
      user1,
      user2,
      ownerAddress,
      user1Address,
      user2Address
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployPostAnchorFixture);
    postAnchor = fixture.postAnchor;
    owner = fixture.owner;
    user1 = fixture.user1;
    user2 = fixture.user2;
    ownerAddress = fixture.ownerAddress;
    user1Address = fixture.user1Address;
    user2Address = fixture.user2Address;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await postAnchor.getAddress()).to.be.a("string");
      expect(await postAnchor.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return correct version", async function () {
      expect(await postAnchor.getVersion()).to.equal("1.0.0");
    });

    it("Should have no storage variables (pure event-based)", async function () {
      // PostAnchor should be a pure event-based contract with no state variables
      // We can't directly test for absence of storage, but we can verify the contract size is minimal
      const contractCode = await ethers.provider.getCode(await postAnchor.getAddress());
      expect(contractCode).to.not.equal("0x");
      
      // The contract should be lightweight (minimal bytecode)
      // This is a rough check - a purely event-based contract should be small
      expect(contractCode.length).to.be.lessThan(5000); // Reasonable size for lightweight contract
    });
  });

  describe("anchorPost Function", function () {
    it("Should emit PostAnchored event with correct parameters", async function () {
      await expect(postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user1Address, SAMPLE_CID_HASH, anyValue, SAMPLE_META_HASH);
    });

    it("Should emit event with correct timestamp", async function () {
      const tx = await postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const events = await postAnchor.queryFilter(
        postAnchor.filters.PostAnchored(user1Address),
        receipt.blockNumber,
        receipt.blockNumber
      );
      
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.timestamp).to.equal(block?.timestamp);
    });

    it("Should allow anchoring with zero metadata hash", async function () {
      await expect(postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, ZERO_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user1Address, SAMPLE_CID_HASH, anyValue, ZERO_HASH);
    });

    it("Should not allow zero CID hash", async function () {
      await expect(
        postAnchor.connect(user1).anchorPost(ZERO_HASH, SAMPLE_META_HASH)
      ).to.be.revertedWith("PostAnchor: CID hash cannot be zero");
    });

    it("Should correctly identify the author as msg.sender", async function () {
      // Test with different users
      await expect(postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user1Address, SAMPLE_CID_HASH, anyValue, SAMPLE_META_HASH);

      const differentCidHash = ethers.keccak256(ethers.toUtf8Bytes("DifferentCID456"));
      await expect(postAnchor.connect(user2).anchorPost(differentCidHash, ZERO_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user2Address, differentCidHash, anyValue, ZERO_HASH);
    });

    it("Should allow multiple posts from the same user", async function () {
      const cidHash1 = ethers.keccak256(ethers.toUtf8Bytes("FirstPost"));
      const cidHash2 = ethers.keccak256(ethers.toUtf8Bytes("SecondPost"));
      
      await expect(postAnchor.connect(user1).anchorPost(cidHash1, SAMPLE_META_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user1Address, cidHash1, anyValue, SAMPLE_META_HASH);

      await expect(postAnchor.connect(user1).anchorPost(cidHash2, ZERO_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user1Address, cidHash2, anyValue, ZERO_HASH);
    });

    it("Should allow duplicate CID hashes from different users", async function () {
      // Same content can be anchored by different users (e.g., sharing/reposting)
      await expect(postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user1Address, SAMPLE_CID_HASH, anyValue, SAMPLE_META_HASH);

      await expect(postAnchor.connect(user2).anchorPost(SAMPLE_CID_HASH, ZERO_HASH))
        .to.emit(postAnchor, "PostAnchored")
        .withArgs(user2Address, SAMPLE_CID_HASH, anyValue, ZERO_HASH);
    });
  });

  describe("Utility Functions", function () {
    describe("hashCID", function () {
      it("Should return correct hash for CID string", async function () {
        const expectedHash = ethers.keccak256(ethers.toUtf8Bytes(SAMPLE_CID));
        const contractHash = await postAnchor.hashCID(SAMPLE_CID);
        expect(contractHash).to.equal(expectedHash);
      });

      it("Should revert for empty CID", async function () {
        await expect(postAnchor.hashCID(""))
          .to.be.revertedWith("PostAnchor: CID cannot be empty");
      });

      it("Should handle different CID formats", async function () {
        const cidV0 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
        const cidV1 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
        
        const hash0 = await postAnchor.hashCID(cidV0);
        const hash1 = await postAnchor.hashCID(cidV1);
        
        expect(hash0).to.not.equal(hash1);
        expect(hash0).to.equal(ethers.keccak256(ethers.toUtf8Bytes(cidV0)));
        expect(hash1).to.equal(ethers.keccak256(ethers.toUtf8Bytes(cidV1)));
      });
    });

    describe("hashMetadata", function () {
      it("Should return correct hash for metadata string", async function () {
        const expectedHash = ethers.keccak256(ethers.toUtf8Bytes(SAMPLE_METADATA));
        const contractHash = await postAnchor.hashMetadata(SAMPLE_METADATA);
        expect(contractHash).to.equal(expectedHash);
      });

      it("Should return zero hash for empty metadata", async function () {
        const contractHash = await postAnchor.hashMetadata("");
        expect(contractHash).to.equal(ZERO_HASH);
      });

      it("Should handle JSON metadata", async function () {
        const jsonMetadata = '{"title":"My Post","tags":["blockchain","web3"],"category":"tech"}';
        const expectedHash = ethers.keccak256(ethers.toUtf8Bytes(jsonMetadata));
        const contractHash = await postAnchor.hashMetadata(jsonMetadata);
        expect(contractHash).to.equal(expectedHash);
      });
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should use reasonable gas for anchorPost function", async function () {
      const gasEstimate = await postAnchor.connect(user1).anchorPost.estimateGas(
        SAMPLE_CID_HASH, 
        SAMPLE_META_HASH
      );
      
      console.log("      Gas used for anchorPost:", gasEstimate.toString());
      
      // Event emission with indexed parameters uses more gas than expected
      // This is still very efficient for an event-only contract
      expect(gasEstimate).to.be.at.least(20000n);
      expect(gasEstimate).to.be.at.most(30000n);
    });

    it("Should use similar gas regardless of metadata", async function () {
      const gasWithMeta = await postAnchor.connect(user1).anchorPost.estimateGas(
        SAMPLE_CID_HASH, 
        SAMPLE_META_HASH
      );
      
      const gasWithoutMeta = await postAnchor.connect(user1).anchorPost.estimateGas(
        SAMPLE_CID_HASH, 
        ZERO_HASH
      );
      
      // Gas usage should be nearly identical (event emission cost is the same)
      const gaseDifference = gasWithMeta > gasWithoutMeta ? 
        gasWithMeta - gasWithoutMeta : gasWithoutMeta - gasWithMeta;
      
      expect(gaseDifference).to.be.lessThan(500n); // Small difference acceptable
    });

    it("Should have no state changes (pure event emission)", async function () {
      // This test ensures no storage operations occur
      const stateBefore = await ethers.provider.getStorage(await postAnchor.getAddress(), 0);
      
      await postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH);
      
      const stateAfter = await ethers.provider.getStorage(await postAnchor.getAddress(), 0);
      
      // Storage should remain unchanged
      expect(stateBefore).to.equal(stateAfter);
    });
  });

  describe("Event Indexing and Filtering", function () {
    it("Should allow filtering events by author", async function () {
      // Create posts from different users
      await postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH);
      await postAnchor.connect(user2).anchorPost(SAMPLE_CID_HASH, ZERO_HASH);
      
      // Filter events by user1
      const user1Events = await postAnchor.queryFilter(
        postAnchor.filters.PostAnchored(user1Address)
      );
      
      expect(user1Events).to.have.lengthOf(1);
      expect(user1Events[0].args.author).to.equal(user1Address);
    });

    it("Should allow filtering events by CID hash", async function () {
      const cidHash1 = ethers.keccak256(ethers.toUtf8Bytes("Content1"));
      const cidHash2 = ethers.keccak256(ethers.toUtf8Bytes("Content2"));
      
      await postAnchor.connect(user1).anchorPost(cidHash1, SAMPLE_META_HASH);
      await postAnchor.connect(user1).anchorPost(cidHash2, SAMPLE_META_HASH);
      
      // Filter events by specific CID hash
      const cidEvents = await postAnchor.queryFilter(
        postAnchor.filters.PostAnchored(null, cidHash1)
      );
      
      expect(cidEvents).to.have.lengthOf(1);
      expect(cidEvents[0].args.cidHash).to.equal(cidHash1);
    });

    it("Should support querying all PostAnchored events", async function () {
      await postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH);
      await postAnchor.connect(user2).anchorPost(SAMPLE_CID_HASH, ZERO_HASH);
      
      const allEvents = await postAnchor.queryFilter(
        postAnchor.filters.PostAnchored()
      );
      
      expect(allEvents).to.have.lengthOf(2);
      expect(allEvents[0].args.author).to.equal(user1Address);
      expect(allEvents[1].args.author).to.equal(user2Address);
    });
  });

  describe("Integration Scenarios", function () {
    it("Should handle high-volume posting scenario", async function () {
      const numPosts = 10;
      const promises = [];
      
      for (let i = 0; i < numPosts; i++) {
        const cidHash = ethers.keccak256(ethers.toUtf8Bytes(`Content${i}`));
        const metaHash = ethers.keccak256(ethers.toUtf8Bytes(`{"postId":${i}}`));
        promises.push(postAnchor.connect(user1).anchorPost(cidHash, metaHash));
      }
      
      // Execute all posts
      await Promise.all(promises);
      
      // Verify all events were emitted
      const events = await postAnchor.queryFilter(
        postAnchor.filters.PostAnchored(user1Address)
      );
      
      expect(events).to.have.lengthOf(numPosts);
    });

    it("Should demonstrate complete workflow", async function () {
      // 1. Hash CID and metadata using utility functions
      const cidHash = await postAnchor.hashCID(SAMPLE_CID);
      const metaHash = await postAnchor.hashMetadata(SAMPLE_METADATA);
      
      // 2. Anchor the post
      const tx = await postAnchor.connect(user1).anchorPost(cidHash, metaHash);
      const receipt = await tx.wait();
      
      // 3. Verify event emission
      expect(receipt.logs).to.have.lengthOf(1);
      
      // 4. Query the event
      const events = await postAnchor.queryFilter(
        postAnchor.filters.PostAnchored(user1Address),
        receipt.blockNumber,
        receipt.blockNumber
      );
      
      expect(events[0].args.cidHash).to.equal(cidHash);
      expect(events[0].args.metaHash).to.equal(metaHash);
      expect(events[0].args.author).to.equal(user1Address);
    });
  });

  describe("Frontend Integration Helpers", function () {
    it("Should provide consistent hashing between contract and off-chain", async function () {
      // Simulate off-chain hashing
      const offChainCidHash = ethers.keccak256(ethers.toUtf8Bytes(SAMPLE_CID));
      const offChainMetaHash = ethers.keccak256(ethers.toUtf8Bytes(SAMPLE_METADATA));
      
      // Contract hashing
      const contractCidHash = await postAnchor.hashCID(SAMPLE_CID);
      const contractMetaHash = await postAnchor.hashMetadata(SAMPLE_METADATA);
      
      // Should match exactly
      expect(contractCidHash).to.equal(offChainCidHash);
      expect(contractMetaHash).to.equal(offChainMetaHash);
    });

    it("Should support event-based real-time updates", async function () {
      // This test simulates a frontend listening for events
      let eventReceived = false;
      let eventData: any = null;
      
      // Set up event listener
      postAnchor.on("PostAnchored", (author: string, cidHash: string, timestamp: number, metaHash: string) => {
        eventReceived = true;
        eventData = { author, cidHash, timestamp, metaHash };
      });
      
      // Anchor a post
      await postAnchor.connect(user1).anchorPost(SAMPLE_CID_HASH, SAMPLE_META_HASH);
      
      // Small delay to allow event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventReceived).to.be.true;
      expect(eventData.author).to.equal(user1Address);
      expect(eventData.cidHash).to.equal(SAMPLE_CID_HASH);
      expect(eventData.metaHash).to.equal(SAMPLE_META_HASH);
      
      // Clean up listener
      postAnchor.removeAllListeners("PostAnchored");
    });
  });
});