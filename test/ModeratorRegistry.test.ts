import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Signer } from "ethers";

describe("ModeratorRegistry", function () {
  let moderatorRegistry: any;
  let owner: Signer;
  let moderator1: Signer;
  let moderator2: Signer;
  let nonModerator: Signer;
  let ownerAddress: string;
  let moderator1Address: string;
  let moderator2Address: string;
  let nonModeratorAddress: string;

  const SAMPLE_TASK_ID = ethers.keccak256(ethers.toUtf8Bytes("task1"));
  const SAMPLE_TASK_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("task2"));
  const SAMPLE_ATTESTATION_HASH = ethers.keccak256(ethers.toUtf8Bytes("attestation1"));
  const SAMPLE_ATTESTATION_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("attestation2"));

  async function deployModeratorRegistryFixture() {
    const signers = await ethers.getSigners();
    const [owner, moderator1, moderator2, nonModerator] = signers;
    
    const ownerAddress = await owner.getAddress();
    const moderator1Address = await moderator1.getAddress();
    const moderator2Address = await moderator2.getAddress();
    const nonModeratorAddress = await nonModerator.getAddress();

    const ModeratorRegistryFactory = await ethers.getContractFactory("ModeratorRegistry");
    const moderatorRegistry = await ModeratorRegistryFactory.deploy();
    await moderatorRegistry.waitForDeployment();

    return {
      moderatorRegistry,
      owner,
      moderator1,
      moderator2,
      nonModerator,
      ownerAddress,
      moderator1Address,
      moderator2Address,
      nonModeratorAddress
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployModeratorRegistryFixture);
    moderatorRegistry = fixture.moderatorRegistry;
    owner = fixture.owner;
    moderator1 = fixture.moderator1;
    moderator2 = fixture.moderator2;
    nonModerator = fixture.nonModerator;
    ownerAddress = fixture.ownerAddress;
    moderator1Address = fixture.moderator1Address;
    moderator2Address = fixture.moderator2Address;
    nonModeratorAddress = fixture.nonModeratorAddress;
  });

  describe("Deployment", function () {
    it("Should set the deployer as default admin", async function () {
      const DEFAULT_ADMIN_ROLE = await moderatorRegistry.DEFAULT_ADMIN_ROLE();
      expect(await moderatorRegistry.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
    });

    it("Should initialize with correct status constants", async function () {
      expect(await moderatorRegistry.STATUS_UNCLAIMED()).to.equal(0);
      expect(await moderatorRegistry.STATUS_CLAIMED()).to.equal(1);
      expect(await moderatorRegistry.STATUS_RESOLVED()).to.equal(2);
    });
  });

  describe("Moderator Management", function () {
    describe("optInModerator", function () {
      it("Should allow a user to opt-in as moderator", async function () {
        await expect(moderatorRegistry.connect(moderator1).optInModerator())
          .to.emit(moderatorRegistry, "ModeratorOptedIn")
          .withArgs(moderator1Address);

        expect(await moderatorRegistry.isModerator(moderator1Address)).to.be.true;
      });

      it("Should allow multiple moderators to opt-in", async function () {
        await moderatorRegistry.connect(moderator1).optInModerator();
        await moderatorRegistry.connect(moderator2).optInModerator();

        expect(await moderatorRegistry.isModerator(moderator1Address)).to.be.true;
        expect(await moderatorRegistry.isModerator(moderator2Address)).to.be.true;
      });
    });

    describe("optOutModerator", function () {
      beforeEach(async function () {
        await moderatorRegistry.connect(moderator1).optInModerator();
      });

      it("Should allow a moderator to opt-out", async function () {
        await expect(moderatorRegistry.connect(moderator1).optOutModerator())
          .to.emit(moderatorRegistry, "ModeratorOptedOut")
          .withArgs(moderator1Address);

        expect(await moderatorRegistry.isModerator(moderator1Address)).to.be.false;
      });

      it("Should allow non-moderator to call opt-out (no-op)", async function () {
        await expect(moderatorRegistry.connect(nonModerator).optOutModerator())
          .to.emit(moderatorRegistry, "ModeratorOptedOut")
          .withArgs(nonModeratorAddress);

        expect(await moderatorRegistry.isModerator(nonModeratorAddress)).to.be.false;
      });
    });
  });

  describe("Task Management", function () {
    beforeEach(async function () {
      await moderatorRegistry.connect(moderator1).optInModerator();
      await moderatorRegistry.connect(moderator2).optInModerator();
    });

    describe("claimTask", function () {
      it("Should allow moderator to claim a new task", async function () {
        await expect(moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID))
          .to.emit(moderatorRegistry, "TaskClaimed")
          .withArgs(SAMPLE_TASK_ID, moderator1Address);

        const task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
        expect(task.id).to.equal(SAMPLE_TASK_ID);
        expect(task.claimer).to.equal(moderator1Address);
        expect(task.status).to.equal(1); // STATUS_CLAIMED
        expect(task.attestationHash).to.equal(ethers.ZeroHash);
      });

      it("Should not allow non-moderator to claim task", async function () {
        await expect(moderatorRegistry.connect(nonModerator).claimTask(SAMPLE_TASK_ID))
          .to.be.revertedWithCustomError(moderatorRegistry, "NotAModerator");
      });

      it("Should not allow claiming already claimed task", async function () {
        await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
        
        await expect(moderatorRegistry.connect(moderator2).claimTask(SAMPLE_TASK_ID))
          .to.be.revertedWithCustomError(moderatorRegistry, "TaskAlreadyClaimed");
      });

      it("Should not allow claiming task with zero ID", async function () {
        await expect(moderatorRegistry.connect(moderator1).claimTask(ethers.ZeroHash))
          .to.be.revertedWithCustomError(moderatorRegistry, "InvalidTaskId");
      });
    });

    describe("resolveTask", function () {
      beforeEach(async function () {
        await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
      });

      it("Should allow claimer to resolve their task", async function () {
        await expect(moderatorRegistry.connect(moderator1).resolveTask(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH))
          .to.emit(moderatorRegistry, "TaskResolved")
          .withArgs(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH);

        const task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
        expect(task.status).to.equal(2); // STATUS_RESOLVED
        expect(task.attestationHash).to.equal(SAMPLE_ATTESTATION_HASH);
      });

      it("Should not allow non-claimer to resolve task", async function () {
        await expect(moderatorRegistry.connect(moderator2).resolveTask(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH))
          .to.be.revertedWithCustomError(moderatorRegistry, "UnauthorizedClaimer");
      });

      it("Should not allow non-moderator to resolve task", async function () {
        await expect(moderatorRegistry.connect(nonModerator).resolveTask(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH))
          .to.be.revertedWithCustomError(moderatorRegistry, "NotAModerator");
      });

      it("Should not allow resolving unclaimed task", async function () {
        await expect(moderatorRegistry.connect(moderator1).resolveTask(SAMPLE_TASK_ID_2, SAMPLE_ATTESTATION_HASH))
          .to.be.revertedWith("ModeratorRegistry: task does not exist");
      });

      it("Should not allow resolving with zero attestation hash", async function () {
        await expect(moderatorRegistry.connect(moderator1).resolveTask(SAMPLE_TASK_ID, ethers.ZeroHash))
          .to.be.revertedWith("ModeratorRegistry: invalid attestation hash");
      });

      it("Should not allow resolving with zero task ID", async function () {
        await expect(moderatorRegistry.connect(moderator1).resolveTask(ethers.ZeroHash, SAMPLE_ATTESTATION_HASH))
          .to.be.revertedWithCustomError(moderatorRegistry, "InvalidTaskId");
      });
    });

    describe("taskExists", function () {
      it("Should return false for non-existent task", async function () {
        expect(await moderatorRegistry.taskExists(SAMPLE_TASK_ID)).to.be.false;
      });

      it("Should return true for existing task", async function () {
        await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
        expect(await moderatorRegistry.taskExists(SAMPLE_TASK_ID)).to.be.true;
      });
    });

    describe("getTask", function () {
      it("Should return empty task for non-existent task", async function () {
        const task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
        expect(task.id).to.equal(ethers.ZeroHash);
        expect(task.claimer).to.equal(ethers.ZeroAddress);
        expect(task.status).to.equal(0);
        expect(task.attestationHash).to.equal(ethers.ZeroHash);
      });

      it("Should return correct task details", async function () {
        await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
        await moderatorRegistry.connect(moderator1).resolveTask(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH);

        const task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
        expect(task.id).to.equal(SAMPLE_TASK_ID);
        expect(task.claimer).to.equal(moderator1Address);
        expect(task.status).to.equal(2); // STATUS_RESOLVED
        expect(task.attestationHash).to.equal(SAMPLE_ATTESTATION_HASH);
      });
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await moderatorRegistry.connect(moderator1).optInModerator();
    });

    describe("removeModerator", function () {
      it("Should allow admin to remove moderator", async function () {
        await expect(moderatorRegistry.connect(owner).removeModerator(moderator1Address))
          .to.emit(moderatorRegistry, "ModeratorOptedOut")
          .withArgs(moderator1Address);

        expect(await moderatorRegistry.isModerator(moderator1Address)).to.be.false;
      });

      it("Should not allow non-admin to remove moderator", async function () {
        await expect(moderatorRegistry.connect(moderator1).removeModerator(moderator1Address))
          .to.be.revertedWithCustomError(moderatorRegistry, "AccessControlUnauthorizedAccount");
      });
    });

    describe("resetTask", function () {
      beforeEach(async function () {
        await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
      });

      it("Should allow admin to reset task", async function () {
        await moderatorRegistry.connect(owner).resetTask(SAMPLE_TASK_ID);

        const task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
        expect(task.claimer).to.equal(ethers.ZeroAddress);
        expect(task.status).to.equal(0); // STATUS_UNCLAIMED
        expect(task.attestationHash).to.equal(ethers.ZeroHash);
      });

      it("Should not allow non-admin to reset task", async function () {
        await expect(moderatorRegistry.connect(moderator1).resetTask(SAMPLE_TASK_ID))
          .to.be.revertedWithCustomError(moderatorRegistry, "AccessControlUnauthorizedAccount");
      });

      it("Should not allow resetting non-existent task", async function () {
        await expect(moderatorRegistry.connect(owner).resetTask(SAMPLE_TASK_ID_2))
          .to.be.revertedWith("ModeratorRegistry: task does not exist");
      });

      it("Should not allow resetting task with zero ID", async function () {
        await expect(moderatorRegistry.connect(owner).resetTask(ethers.ZeroHash))
          .to.be.revertedWithCustomError(moderatorRegistry, "InvalidTaskId");
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete moderator and task lifecycle", async function () {
      // Moderator opts in
      await moderatorRegistry.connect(moderator1).optInModerator();
      expect(await moderatorRegistry.isModerator(moderator1Address)).to.be.true;

      // Moderator claims task
      await expect(moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID))
        .to.emit(moderatorRegistry, "TaskClaimed")
        .withArgs(SAMPLE_TASK_ID, moderator1Address);

      let task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
      expect(task.status).to.equal(1); // STATUS_CLAIMED

      // Moderator resolves task
      await expect(moderatorRegistry.connect(moderator1).resolveTask(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH))
        .to.emit(moderatorRegistry, "TaskResolved")
        .withArgs(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH);

      task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
      expect(task.status).to.equal(2); // STATUS_RESOLVED
      expect(task.attestationHash).to.equal(SAMPLE_ATTESTATION_HASH);

      // Moderator opts out
      await moderatorRegistry.connect(moderator1).optOutModerator();
      expect(await moderatorRegistry.isModerator(moderator1Address)).to.be.false;

      // Ex-moderator cannot claim new tasks
      await expect(moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID_2))
        .to.be.revertedWithCustomError(moderatorRegistry, "NotAModerator");
    });

    it("Should allow multiple moderators to work on different tasks", async function () {
      // Both moderators opt in
      await moderatorRegistry.connect(moderator1).optInModerator();
      await moderatorRegistry.connect(moderator2).optInModerator();

      // Each claims different tasks
      await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
      await moderatorRegistry.connect(moderator2).claimTask(SAMPLE_TASK_ID_2);

      // Each resolves their task
      await moderatorRegistry.connect(moderator1).resolveTask(SAMPLE_TASK_ID, SAMPLE_ATTESTATION_HASH);
      await moderatorRegistry.connect(moderator2).resolveTask(SAMPLE_TASK_ID_2, SAMPLE_ATTESTATION_HASH_2);

      // Verify both tasks are resolved correctly
      const task1 = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
      const task2 = await moderatorRegistry.getTask(SAMPLE_TASK_ID_2);

      expect(task1.claimer).to.equal(moderator1Address);
      expect(task1.status).to.equal(2);
      expect(task1.attestationHash).to.equal(SAMPLE_ATTESTATION_HASH);

      expect(task2.claimer).to.equal(moderator2Address);
      expect(task2.status).to.equal(2);
      expect(task2.attestationHash).to.equal(SAMPLE_ATTESTATION_HASH_2);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should store minimal data on-chain", async function () {
      await moderatorRegistry.connect(moderator1).optInModerator();
      await moderatorRegistry.connect(moderator1).claimTask(SAMPLE_TASK_ID);
      
      // Verify only essential data is stored
      const task = await moderatorRegistry.getTask(SAMPLE_TASK_ID);
      expect(task.id).to.equal(SAMPLE_TASK_ID);
      expect(task.claimer).to.equal(moderator1Address);
      expect(task.status).to.equal(1);
      expect(task.attestationHash).to.equal(ethers.ZeroHash);
    });
  });
});