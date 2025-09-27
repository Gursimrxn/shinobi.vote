import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import { IdentityAnchor__factory } from "../typechain-types";

const ZERO_COMMITMENT = ethers.ZeroHash;

async function deployIdentityAnchorFixture() {
  const [deployer, user, registrar, otherUser] = await ethers.getSigners();
  const identityAnchor = await new IdentityAnchor__factory(deployer).deploy();
  await identityAnchor.waitForDeployment();

  return { identityAnchor, deployer, user, registrar, otherUser };
}

describe("IdentityAnchor", function () {
  describe("registration", function () {
    it("registers a commitment for the caller", async function () {
      const { identityAnchor, user } = await loadFixture(deployIdentityAnchorFixture);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("user-commitment"));

      await expect(identityAnchor.connect(user).registerIdentity(commitment))
        .to.emit(identityAnchor, "IdentityRegistered")
        .withArgs(user.address, commitment, anyValue);

      expect(await identityAnchor.getIdentity(user.address)).to.equal(commitment);
      expect(await identityAnchor.hasIdentity(user.address)).to.equal(true);
      expect(await identityAnchor.isCommitmentRegistered(commitment)).to.equal(true);
    });

    it("reverts when registering a duplicate commitment", async function () {
      const { identityAnchor, user, otherUser } = await loadFixture(deployIdentityAnchorFixture);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("duplicate"));
      await identityAnchor.connect(user).registerIdentity(commitment);

      await expect(identityAnchor.connect(user).registerIdentity(commitment)).to.be.revertedWith(
        "IdentityAnchor: identity already registered"
      );

      await expect(identityAnchor.connect(otherUser).registerIdentity(commitment)).to.be.revertedWith(
        "IdentityAnchor: commitment already registered"
      );
    });

    it("reverts when commitment is zero", async function () {
      const { identityAnchor, user } = await loadFixture(deployIdentityAnchorFixture);

      await expect(identityAnchor.connect(user).registerIdentity(ZERO_COMMITMENT)).to.be.revertedWith(
        "IdentityAnchor: commitment is zero"
      );
    });
  });

  describe("updates", function () {
    it("allows a user to update to a fresh commitment", async function () {
      const { identityAnchor, user } = await loadFixture(deployIdentityAnchorFixture);
      const initialCommitment = ethers.keccak256(ethers.toUtf8Bytes("initial"));
      const newCommitment = ethers.keccak256(ethers.toUtf8Bytes("updated"));

      await identityAnchor.connect(user).registerIdentity(initialCommitment);

      await expect(identityAnchor.connect(user).updateIdentity(newCommitment))
        .to.emit(identityAnchor, "IdentityUpdated")
        .withArgs(user.address, initialCommitment, newCommitment, anyValue);

      expect(await identityAnchor.getIdentity(user.address)).to.equal(newCommitment);
      expect(await identityAnchor.isCommitmentRegistered(newCommitment)).to.equal(true);
    });

    it("reverts when updating without prior registration", async function () {
      const { identityAnchor, user } = await loadFixture(deployIdentityAnchorFixture);
      const newCommitment = ethers.keccak256(ethers.toUtf8Bytes("update"));

      await expect(identityAnchor.connect(user).updateIdentity(newCommitment)).to.be.revertedWith(
        "IdentityAnchor: identity not registered"
      );
    });
  });

  describe("registrar role", function () {
    it("allows registrar to register on behalf of another address", async function () {
      const { identityAnchor, deployer, registrar, user } = await loadFixture(deployIdentityAnchorFixture);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("delegated"));

      const REGISTRAR_ROLE = await identityAnchor.REGISTRAR_ROLE();
      await identityAnchor.connect(deployer).grantRole(REGISTRAR_ROLE, registrar.address);

      await expect(identityAnchor.connect(registrar).registerIdentityFor(user.address, commitment))
        .to.emit(identityAnchor, "IdentityRegistered")
        .withArgs(user.address, commitment, anyValue);

      expect(await identityAnchor.getIdentity(user.address)).to.equal(commitment);
    });

    it("prevents untrusted accounts from using registerIdentityFor", async function () {
      const { identityAnchor, user } = await loadFixture(deployIdentityAnchorFixture);
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("untrusted"));

      await expect(identityAnchor.connect(user).registerIdentityFor(user.address, commitment)).to.be.revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await identityAnchor.REGISTRAR_ROLE()}`
      );
    });
  });
});
