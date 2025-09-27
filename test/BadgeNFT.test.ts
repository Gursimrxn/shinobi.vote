import { ethers } from "hardhat";
import { expect } from "chai";
import { BadgeNFT } from "../typechain-types/contracts/core/BadgeNFT";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BadgeNFT", function () {
    let badgeNFT: BadgeNFT;
    let owner: SignerWithAddress;
    let minter: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let unauthorized: SignerWithAddress;

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

    const sampleTokenURI1 = "ipfs://QmTestHash1234567890abcdef";
    const sampleTokenURI2 = "ipfs://QmTestHash0987654321fedcba";
    const sampleTokenURI3 = "https://web3.storage/ipfs/QmAnotherTestHash";

    beforeEach(async function () {
        [owner, minter, user1, user2, unauthorized] = await ethers.getSigners();

        const BadgeNFTFactory = await ethers.getContractFactory("BadgeNFT");
        const deployedContract = await BadgeNFTFactory.deploy();
        await deployedContract.waitForDeployment();
        
        // Cast to the proper type using unknown first
        badgeNFT = deployedContract as unknown as BadgeNFT;

        // Grant minter role to the minter account
        await badgeNFT.connect(owner).grantMinterRole(minter.address);
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await badgeNFT.name()).to.equal("Shinobi Badge");
            expect(await badgeNFT.symbol()).to.equal("GHOST-BADGE");
        });

        it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
            expect(await badgeNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
        });

        it("Should start with token counter at 1", async function () {
            expect(await badgeNFT.getCurrentTokenId()).to.equal(1);
        });

        it("Should start with zero total supply", async function () {
            expect(await badgeNFT.totalSupply()).to.equal(0);
        });

        it("Should support required interfaces", async function () {
            // ERC721 interface ID: 0x80ac58cd
            expect(await badgeNFT.supportsInterface("0x80ac58cd")).to.be.true;
            // AccessControl interface ID: 0x7965db0b
            expect(await badgeNFT.supportsInterface("0x7965db0b")).to.be.true;
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to grant minter role", async function () {
            await expect(badgeNFT.connect(owner).grantMinterRole(user1.address))
                .to.not.be.reverted;
            expect(await badgeNFT.hasRole(MINTER_ROLE, user1.address)).to.be.true;
        });

        it("Should allow admin to revoke minter role", async function () {
            await badgeNFT.connect(owner).grantMinterRole(user1.address);
            await badgeNFT.connect(owner).revokeMinterRole(user1.address);
            expect(await badgeNFT.hasRole(MINTER_ROLE, user1.address)).to.be.false;
        });

        it("Should not allow non-admin to grant minter role", async function () {
            await expect(badgeNFT.connect(unauthorized).grantMinterRole(user1.address))
                .to.be.revertedWithCustomError(badgeNFT, "AccessControlUnauthorizedAccount");
        });

        it("Should not allow granting minter role to zero address", async function () {
            await expect(badgeNFT.connect(owner).grantMinterRole(ethers.ZeroAddress))
                .to.be.revertedWith("BadgeNFT: cannot grant role to zero address");
        });
    });

    describe("Minting with Custom Token ID", function () {
        it("Should allow minter to mint badge with custom token ID", async function () {
            const tokenId = 42;
            await expect(badgeNFT.connect(minter).safeMint(user1.address, tokenId, sampleTokenURI1))
                .to.emit(badgeNFT, "BadgeMinted")
                .withArgs(user1.address, tokenId, sampleTokenURI1)
                .and.to.emit(badgeNFT, "Transfer")
                .withArgs(ethers.ZeroAddress, user1.address, tokenId);

            expect(await badgeNFT.ownerOf(tokenId)).to.equal(user1.address);
            expect(await badgeNFT.tokenURI(tokenId)).to.equal(sampleTokenURI1);
            expect(await badgeNFT.exists(tokenId)).to.be.true;
        });

        it("Should not allow non-minter to mint badge", async function () {
            await expect(badgeNFT.connect(unauthorized).safeMint(user1.address, 1, sampleTokenURI1))
                .to.be.revertedWithCustomError(badgeNFT, "AccessControlUnauthorizedAccount");
        });

        it("Should not allow minting to zero address", async function () {
            await expect(badgeNFT.connect(minter).safeMint(ethers.ZeroAddress, 1, sampleTokenURI1))
                .to.be.revertedWith("BadgeNFT: mint to zero address");
        });

        it("Should not allow minting with empty token URI", async function () {
            await expect(badgeNFT.connect(minter).safeMint(user1.address, 1, ""))
                .to.be.revertedWith("BadgeNFT: empty token URI");
        });

        it("Should not allow minting duplicate token ID", async function () {
            const tokenId = 1;
            await badgeNFT.connect(minter).safeMint(user1.address, tokenId, sampleTokenURI1);
            
            await expect(badgeNFT.connect(minter).safeMint(user2.address, tokenId, sampleTokenURI2))
                .to.be.revertedWith("BadgeNFT: token already exists");
        });
    });

    describe("Auto-Increment Minting", function () {
        it("Should mint badge with auto-incremented token ID", async function () {
            const expectedTokenId = 1;
            await expect(badgeNFT.connect(minter).safeMintAuto(user1.address, sampleTokenURI1))
                .to.emit(badgeNFT, "BadgeMinted")
                .withArgs(user1.address, expectedTokenId, sampleTokenURI1);

            expect(await badgeNFT.ownerOf(expectedTokenId)).to.equal(user1.address);
            expect(await badgeNFT.tokenURI(expectedTokenId)).to.equal(sampleTokenURI1);
            expect(await badgeNFT.getCurrentTokenId()).to.equal(2);
            expect(await badgeNFT.totalSupply()).to.equal(1);
        });

        it("Should return correct token ID from safeMintAuto", async function () {
            const tx = await badgeNFT.connect(minter).safeMintAuto(user1.address, sampleTokenURI1);
            const receipt = await tx.wait();
            
            // Find the BadgeMinted event to get the token ID
            const badgeMintedEvent = receipt?.logs.find(
                (log: any) => log.topics[0] === badgeNFT.interface.getEvent("BadgeMinted")?.topicHash
            );
            
            expect(badgeMintedEvent).to.not.be.undefined;
        });

        it("Should increment token IDs correctly for multiple mints", async function () {
            await badgeNFT.connect(minter).safeMintAuto(user1.address, sampleTokenURI1);
            await badgeNFT.connect(minter).safeMintAuto(user2.address, sampleTokenURI2);
            await badgeNFT.connect(minter).safeMintAuto(user1.address, sampleTokenURI3);

            expect(await badgeNFT.ownerOf(1)).to.equal(user1.address);
            expect(await badgeNFT.ownerOf(2)).to.equal(user2.address);
            expect(await badgeNFT.ownerOf(3)).to.equal(user1.address);
            expect(await badgeNFT.getCurrentTokenId()).to.equal(4);
            expect(await badgeNFT.totalSupply()).to.equal(3);
        });

        it("Should not allow auto-minting to zero address", async function () {
            await expect(badgeNFT.connect(minter).safeMintAuto(ethers.ZeroAddress, sampleTokenURI1))
                .to.be.revertedWith("BadgeNFT: mint to zero address");
        });

        it("Should not allow auto-minting with empty token URI", async function () {
            await expect(badgeNFT.connect(minter).safeMintAuto(user1.address, ""))
                .to.be.revertedWith("BadgeNFT: empty token URI");
        });
    });

    describe("Token URI Management", function () {
        beforeEach(async function () {
            await badgeNFT.connect(minter).safeMint(user1.address, 1, sampleTokenURI1);
        });

        it("Should return correct token URI", async function () {
            expect(await badgeNFT.tokenURI(1)).to.equal(sampleTokenURI1);
        });

        it("Should revert when querying URI for non-existent token", async function () {
            await expect(badgeNFT.tokenURI(999))
                .to.be.revertedWithCustomError(badgeNFT, "ERC721NonexistentToken");
        });

        it("Should allow admin to update token URI", async function () {
            const newURI = "ipfs://QmNewUpdatedHash";
            await badgeNFT.connect(owner).updateTokenURI(1, newURI);
            expect(await badgeNFT.tokenURI(1)).to.equal(newURI);
        });

        it("Should not allow non-admin to update token URI", async function () {
            const newURI = "ipfs://QmNewUpdatedHash";
            await expect(badgeNFT.connect(unauthorized).updateTokenURI(1, newURI))
                .to.be.revertedWithCustomError(badgeNFT, "AccessControlUnauthorizedAccount");
        });

        it("Should not allow updating URI with empty string", async function () {
            await expect(badgeNFT.connect(owner).updateTokenURI(1, ""))
                .to.be.revertedWith("BadgeNFT: empty token URI");
        });
    });

    describe("Token Queries", function () {
        beforeEach(async function () {
            await badgeNFT.connect(minter).safeMintAuto(user1.address, sampleTokenURI1);
            await badgeNFT.connect(minter).safeMintAuto(user2.address, sampleTokenURI2);
        });

        it("Should return correct total supply", async function () {
            expect(await badgeNFT.totalSupply()).to.equal(2);
        });

        it("Should return correct current token ID", async function () {
            expect(await badgeNFT.getCurrentTokenId()).to.equal(3);
        });

        it("Should correctly check token existence", async function () {
            expect(await badgeNFT.exists(1)).to.be.true;
            expect(await badgeNFT.exists(2)).to.be.true;
            expect(await badgeNFT.exists(3)).to.be.false;
            expect(await badgeNFT.exists(999)).to.be.false;
        });
    });

    describe("Badge Integration Scenarios", function () {
        it("Should handle verification badge workflow", async function () {
            // Simulate moderator approving verification and minting badge
            const verificationURI = "ipfs://QmVerificationManifest123";
            
            await expect(badgeNFT.connect(minter).safeMintAuto(user1.address, verificationURI))
                .to.emit(badgeNFT, "BadgeMinted")
                .withArgs(user1.address, 1, verificationURI);

            expect(await badgeNFT.balanceOf(user1.address)).to.equal(1);
            expect(await badgeNFT.tokenURI(1)).to.equal(verificationURI);
        });

        it("Should handle demo building visit badge workflow", async function () {
            // Simulate user visiting demo building and receiving badge
            const demoBadgeURI = "ipfs://QmDemoBuildingVisit456";
            
            await badgeNFT.connect(minter).safeMint(user2.address, 100, demoBadgeURI);

            expect(await badgeNFT.ownerOf(100)).to.equal(user2.address);
            expect(await badgeNFT.tokenURI(100)).to.equal(demoBadgeURI);
        });

        it("Should handle multiple badges for same user", async function () {
            const badge1URI = "ipfs://QmFirstBadge";
            const badge2URI = "ipfs://QmSecondBadge";
            
            await badgeNFT.connect(minter).safeMintAuto(user1.address, badge1URI);
            await badgeNFT.connect(minter).safeMintAuto(user1.address, badge2URI);

            expect(await badgeNFT.balanceOf(user1.address)).to.equal(2);
            expect(await badgeNFT.ownerOf(1)).to.equal(user1.address);
            expect(await badgeNFT.ownerOf(2)).to.equal(user1.address);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle very long token URIs", async function () {
            const longURI = "ipfs://Qm" + "a".repeat(1000);
            await expect(badgeNFT.connect(minter).safeMintAuto(user1.address, longURI))
                .to.not.be.reverted;
            
            expect(await badgeNFT.tokenURI(1)).to.equal(longURI);
        });

        it("Should handle different URI formats", async function () {
            const ipfsURI = "ipfs://QmTestIPFS";
            const httpURI = "https://web3.storage/ipfs/QmTestHTTP";
            const filecoinURI = "filecoin://QmTestFilecoin";

            await badgeNFT.connect(minter).safeMint(user1.address, 1, ipfsURI);
            await badgeNFT.connect(minter).safeMint(user1.address, 2, httpURI);
            await badgeNFT.connect(minter).safeMint(user1.address, 3, filecoinURI);

            expect(await badgeNFT.tokenURI(1)).to.equal(ipfsURI);
            expect(await badgeNFT.tokenURI(2)).to.equal(httpURI);
            expect(await badgeNFT.tokenURI(3)).to.equal(filecoinURI);
        });

        it("Should maintain correct state after role changes", async function () {
            // Mint a badge
            await badgeNFT.connect(minter).safeMintAuto(user1.address, sampleTokenURI1);
            
            // Revoke minter role
            await badgeNFT.connect(owner).revokeMinterRole(minter.address);
            
            // Should not be able to mint anymore
            await expect(badgeNFT.connect(minter).safeMintAuto(user2.address, sampleTokenURI2))
                .to.be.revertedWithCustomError(badgeNFT, "AccessControlUnauthorizedAccount");
            
            // But existing token should still work
            expect(await badgeNFT.ownerOf(1)).to.equal(user1.address);
            expect(await badgeNFT.tokenURI(1)).to.equal(sampleTokenURI1);
        });
    });
});