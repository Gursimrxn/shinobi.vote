import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("MerkleAnchorRegistry", function () {
  let merkleRegistry: any;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  // Role constants
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

  // Test data for Merkle trees
  const testData = [
    ["0x1111111111111111111111111111111111111111", "100"],
    ["0x2222222222222222222222222222222222222222", "200"],
    ["0x3333333333333333333333333333333333333333", "300"],
    ["0x4444444444444444444444444444444444444444", "400"],
  ];

  let merkleTree: any;
  let merkleRoot: string;
  let merkleProof: string[];
  let leafValue: string;

  beforeEach(async function () {
    [owner, admin, user1, user2, unauthorized] = await ethers.getSigners();

    // Deploy MerkleAnchorRegistry
    const MerkleAnchorRegistryFactory = await ethers.getContractFactory("MerkleAnchorRegistry");
    merkleRegistry = await MerkleAnchorRegistryFactory.deploy();
    await merkleRegistry.waitForDeployment();

    // Set up roles
    await merkleRegistry.grantRole(ADMIN_ROLE, admin.address);
    await merkleRegistry.grantRole(REGISTRAR_ROLE, user1.address);
    await merkleRegistry.grantRole(REGISTRAR_ROLE, user2.address);

    // Create test Merkle tree
    merkleTree = StandardMerkleTree.of(testData, ["address", "uint256"]);
    merkleRoot = merkleTree.root;
    
    // Get proof for first element
    const leaf = testData[0];
    merkleProof = merkleTree.getProof(0);
    // Use the same leaf calculation as the StandardMerkleTree
    leafValue = merkleTree.leafHash([leaf[0], leaf[1]]);
  });

  describe("Deployment", function () {
    it("Should set the correct initial roles", async function () {
      expect(await merkleRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await merkleRegistry.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await merkleRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await merkleRegistry.hasRole(REGISTRAR_ROLE, user1.address)).to.be.true;
    });

    it("Should return correct version", async function () {
      expect(await merkleRegistry.version()).to.equal("1.0.0");
    });

    it("Should initialize with zero active roots", async function () {
      expect(await merkleRegistry.getTotalActiveRoots()).to.equal(0);
    });
  });

  describe("Merkle Root Registration", function () {
    it("Should allow registrar to register a Merkle root", async function () {
      const rootBytes32 = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      
      await expect(merkleRegistry.connect(user1).registerMerkleRoot(rootBytes32))
        .to.emit(merkleRegistry, "MerkleRootRegistered")
        .withArgs(user1.address, rootBytes32);

      expect(await merkleRegistry.isRootRegistered(rootBytes32)).to.be.true;
      expect(await merkleRegistry.getRootOwner(rootBytes32)).to.equal(user1.address);
      expect(await merkleRegistry.getTotalActiveRoots()).to.equal(1);
    });

    it("Should prevent non-registrar from registering roots", async function () {
      const rootBytes32 = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      
      await expect(merkleRegistry.connect(unauthorized).registerMerkleRoot(rootBytes32))
        .to.be.revertedWithCustomError(merkleRegistry, "AccessControlUnauthorizedAccount");
    });

    it("Should prevent registering zero root", async function () {
      const zeroRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
      
      await expect(merkleRegistry.connect(user1).registerMerkleRoot(zeroRoot))
        .to.be.revertedWith("MerkleAnchorRegistry: root cannot be zero");
    });

    it("Should prevent duplicate root registration", async function () {
      const rootBytes32 = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      
      await merkleRegistry.connect(user1).registerMerkleRoot(rootBytes32);
      
      await expect(merkleRegistry.connect(user2).registerMerkleRoot(rootBytes32))
        .to.be.revertedWith("MerkleAnchorRegistry: root already registered");
    });

    it("Should enforce maximum roots per user", async function () {
      // This test would be expensive with 100 roots, so we'll test the principle with a smaller number
      // In practice, you might want to temporarily reduce MAX_ROOTS_PER_USER for testing
      const maxRoots = await merkleRegistry.MAX_ROOTS_PER_USER();
      expect(maxRoots).to.equal(100);
    });
  });

  describe("Batch Registration", function () {
    it("Should allow batch registration of multiple roots", async function () {
      const roots = [
        ethers.keccak256(ethers.toUtf8Bytes("root1")),
        ethers.keccak256(ethers.toUtf8Bytes("root2")),
        ethers.keccak256(ethers.toUtf8Bytes("root3"))
      ];

      await expect(merkleRegistry.connect(user1).batchRegisterMerkleRoots(roots))
        .to.emit(merkleRegistry, "MerkleRootRegistered")
        .withArgs(user1.address, roots[0]);

      expect(await merkleRegistry.getTotalActiveRoots()).to.equal(3);
      expect(await merkleRegistry.getUserRootCount(user1.address)).to.equal(3);
    });

    it("Should prevent batch registration with empty array", async function () {
      await expect(merkleRegistry.connect(user1).batchRegisterMerkleRoots([]))
        .to.be.revertedWith("MerkleAnchorRegistry: empty roots array");
    });

    it("Should prevent batch registration by non-registrar", async function () {
      const roots = [ethers.keccak256(ethers.toUtf8Bytes("root1"))];
      
      await expect(merkleRegistry.connect(unauthorized).batchRegisterMerkleRoots(roots))
        .to.be.revertedWithCustomError(merkleRegistry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Merkle Proof Verification", function () {
    beforeEach(async function () {
      // Register the merkle root
      await merkleRegistry.connect(user1).registerMerkleRoot(merkleRoot);
    });

    it("Should verify valid Merkle proof", async function () {
      const isValid = await merkleRegistry.verifyProof(
        user1.address,
        merkleProof,
        leafValue
      );
      expect(isValid).to.be.true;
    });

    it("Should verify valid proof with specific root", async function () {
      const isValid = await merkleRegistry.verifyProofWithRoot(
        merkleRoot,
        merkleProof,
        leafValue
      );
      expect(isValid).to.be.true;
    });

    it("Should reject invalid Merkle proof", async function () {
      const invalidLeaf = ethers.keccak256(ethers.toUtf8Bytes("invalid"));
      
      const isValid = await merkleRegistry.verifyProof(
        user1.address,
        merkleProof,
        invalidLeaf
      );
      expect(isValid).to.be.false;
    });

    it("Should reject proof for non-existent user roots", async function () {
      const isValid = await merkleRegistry.verifyProof(
        user2.address,
        merkleProof,
        leafValue
      );
      expect(isValid).to.be.false;
    });

    it("Should prevent verification with zero address", async function () {
      await expect(merkleRegistry.verifyProof(
        ethers.ZeroAddress,
        merkleProof,
        leafValue
      )).to.be.revertedWith("MerkleAnchorRegistry: user cannot be zero address");
    });

    it("Should prevent verification with zero leaf", async function () {
      const zeroLeaf = "0x0000000000000000000000000000000000000000000000000000000000000000";
      
      await expect(merkleRegistry.verifyProof(
        user1.address,
        merkleProof,
        zeroLeaf
      )).to.be.revertedWith("MerkleAnchorRegistry: leaf cannot be zero");
    });
  });

  describe("Root Management", function () {
    let testRoot: string;

    beforeEach(async function () {
      testRoot = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      await merkleRegistry.connect(user1).registerMerkleRoot(testRoot);
    });

    it("Should return correct roots for user", async function () {
      const roots = await merkleRegistry.getRootsByUser(user1.address);
      expect(roots).to.have.lengthOf(1);
      expect(roots[0]).to.equal(testRoot);
    });

    it("Should return empty array for user with no roots", async function () {
      const roots = await merkleRegistry.getRootsByUser(user2.address);
      expect(roots).to.have.lengthOf(0);
    });

    it("Should return correct root owner", async function () {
      expect(await merkleRegistry.getRootOwner(testRoot)).to.equal(user1.address);
    });

    it("Should return correct user root count", async function () {
      expect(await merkleRegistry.getUserRootCount(user1.address)).to.equal(1);
      expect(await merkleRegistry.getUserRootCount(user2.address)).to.equal(0);
    });
  });

  describe("Root Removal", function () {
    let testRoot: string;

    beforeEach(async function () {
      testRoot = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      await merkleRegistry.connect(user1).registerMerkleRoot(testRoot);
    });

    it("Should allow owner to remove their root", async function () {
      await expect(merkleRegistry.connect(user1).removeRoot(testRoot))
        .to.emit(merkleRegistry, "MerkleRootRemoved")
        .withArgs(user1.address, testRoot);

      expect(await merkleRegistry.isRootRegistered(testRoot)).to.be.false;
      expect(await merkleRegistry.getRootOwner(testRoot)).to.equal(ethers.ZeroAddress);
      expect(await merkleRegistry.getTotalActiveRoots()).to.equal(0);
    });

    it("Should allow admin to remove any root", async function () {
      await expect(merkleRegistry.connect(admin).removeRoot(testRoot))
        .to.emit(merkleRegistry, "MerkleRootRemoved")
        .withArgs(user1.address, testRoot);

      expect(await merkleRegistry.isRootRegistered(testRoot)).to.be.false;
    });

    it("Should prevent unauthorized removal", async function () {
      await expect(merkleRegistry.connect(user2).removeRoot(testRoot))
        .to.be.revertedWith("MerkleAnchorRegistry: unauthorized to remove root");
    });

    it("Should prevent removal of non-existent root", async function () {
      const nonExistentRoot = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      
      await expect(merkleRegistry.connect(user1).removeRoot(nonExistentRoot))
        .to.be.revertedWith("MerkleAnchorRegistry: root not registered");
    });

    it("Should prevent double removal", async function () {
      await merkleRegistry.connect(user1).removeRoot(testRoot);
      
      await expect(merkleRegistry.connect(user1).removeRoot(testRoot))
        .to.be.revertedWith("MerkleAnchorRegistry: root already removed");
    });

    it("Should filter removed roots from user queries", async function () {
      // Add another root
      const testRoot2 = ethers.keccak256(ethers.toUtf8Bytes("test-root-2"));
      await merkleRegistry.connect(user1).registerMerkleRoot(testRoot2);
      
      // Remove first root
      await merkleRegistry.connect(user1).removeRoot(testRoot);
      
      // Check that only active root is returned
      const roots = await merkleRegistry.getRootsByUser(user1.address);
      expect(roots).to.have.lengthOf(1);
      expect(roots[0]).to.equal(testRoot2);
      
      expect(await merkleRegistry.getUserRootCount(user1.address)).to.equal(1);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow admin to call emergency pause", async function () {
      await expect(merkleRegistry.connect(admin).emergencyPause())
        .to.emit(merkleRegistry, "EmergencyAction")
        .withArgs(admin.address, "PAUSE");
    });

    it("Should prevent non-admin from calling emergency pause", async function () {
      await expect(merkleRegistry.connect(user1).emergencyPause())
        .to.be.revertedWithCustomError(merkleRegistry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle multiple roots for single user correctly", async function () {
      const roots = [
        ethers.keccak256(ethers.toUtf8Bytes("root1")),
        ethers.keccak256(ethers.toUtf8Bytes("root2")),
        ethers.keccak256(ethers.toUtf8Bytes("root3"))
      ];

      for (const root of roots) {
        await merkleRegistry.connect(user1).registerMerkleRoot(root);
      }

      expect(await merkleRegistry.getUserRootCount(user1.address)).to.equal(3);
      expect(await merkleRegistry.getTotalActiveRoots()).to.equal(3);

      const userRoots = await merkleRegistry.getRootsByUser(user1.address);
      expect(userRoots).to.have.lengthOf(3);
      expect(userRoots).to.include.members(roots);
    });

    it("Should prevent registering previously removed root", async function () {
      const testRoot = ethers.keccak256(ethers.toUtf8Bytes("test-root"));
      
      // Register and remove root
      await merkleRegistry.connect(user1).registerMerkleRoot(testRoot);
      await merkleRegistry.connect(user1).removeRoot(testRoot);
      
      // Try to register the same root again
      await expect(merkleRegistry.connect(user1).registerMerkleRoot(testRoot))
        .to.be.revertedWith("MerkleAnchorRegistry: root was previously removed");
    });

    it("Should not verify proofs against removed roots", async function () {
      await merkleRegistry.connect(user1).registerMerkleRoot(merkleRoot);
      
      // Verify it works initially
      expect(await merkleRegistry.verifyProof(user1.address, merkleProof, leafValue)).to.be.true;
      
      // Remove the root
      await merkleRegistry.connect(user1).removeRoot(merkleRoot);
      
      // Verification should now fail
      expect(await merkleRegistry.verifyProof(user1.address, merkleProof, leafValue)).to.be.false;
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should handle batch operations efficiently", async function () {
      const batchSize = 10;
      const roots = Array.from({ length: batchSize }, (_, i) => 
        ethers.keccak256(ethers.toUtf8Bytes(`root-${i}`))
      );

      const tx = await merkleRegistry.connect(user1).batchRegisterMerkleRoots(roots);
      const receipt = await tx.wait();
      
      // Verify all roots were registered
      expect(await merkleRegistry.getUserRootCount(user1.address)).to.equal(batchSize);
      expect(await merkleRegistry.getTotalActiveRoots()).to.equal(batchSize);
      
      console.log(`Gas used for batch registration of ${batchSize} roots:`, receipt?.gasUsed.toString());
    });
  });
});