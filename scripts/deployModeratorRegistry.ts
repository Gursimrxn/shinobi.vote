import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ModeratorRegistry contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.getAddress())).toString());

  // Deploy ModeratorRegistry
  const ModeratorRegistryFactory = await ethers.getContractFactory("ModeratorRegistry");
  const moderatorRegistry = await ModeratorRegistryFactory.deploy();
  
  await moderatorRegistry.waitForDeployment();
  
  const moderatorRegistryAddress = await moderatorRegistry.getAddress();
  console.log("ModeratorRegistry deployed to:", moderatorRegistryAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const STATUS_UNCLAIMED = await moderatorRegistry.STATUS_UNCLAIMED();
  const STATUS_CLAIMED = await moderatorRegistry.STATUS_CLAIMED();
  const STATUS_RESOLVED = await moderatorRegistry.STATUS_RESOLVED();
  
  console.log("STATUS_UNCLAIMED:", STATUS_UNCLAIMED);
  console.log("STATUS_CLAIMED:", STATUS_CLAIMED);
  console.log("STATUS_RESOLVED:", STATUS_RESOLVED);

  // Check deployer has admin role
  const DEFAULT_ADMIN_ROLE = await moderatorRegistry.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await moderatorRegistry.hasRole(DEFAULT_ADMIN_ROLE, await deployer.getAddress());
  console.log("Deployer has admin role:", hasAdminRole);

  console.log("\nDeployment completed successfully!");
  console.log("Contract address:", moderatorRegistryAddress);
  
  // Output deployment information for verification
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Contract: ModeratorRegistry");
  console.log("Address:", moderatorRegistryAddress);
  console.log("Deployer:", await deployer.getAddress());
  console.log("Gas used: Check transaction receipt");
  console.log("========================");

  return moderatorRegistry;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });