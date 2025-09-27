import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Deploying IdentityAnchor with account:", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");

  const IdentityAnchor = await ethers.getContractFactory("IdentityAnchor");
  const contract = await IdentityAnchor.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("IdentityAnchor deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
