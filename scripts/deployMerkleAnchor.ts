import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying MerkleAnchorRegistry to CELO Alfajores testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  WARNING: Low balance. You may need more CELO for deployment.");
  }

  try {
    // Deploy MerkleAnchorRegistry
    console.log("\n📦 Deploying MerkleAnchorRegistry contract...");
    const MerkleAnchorRegistryFactory = await ethers.getContractFactory("MerkleAnchorRegistry");
    
    console.log("⛽ Deploying contract...");

    const merkleRegistry = await MerkleAnchorRegistryFactory.deploy();
    await merkleRegistry.waitForDeployment();

    const contractAddress = await merkleRegistry.getAddress();
    console.log("✅ MerkleAnchorRegistry deployed to:", contractAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const version = await merkleRegistry.version();
    console.log("📋 Contract version:", version);

    const totalRoots = await merkleRegistry.getTotalActiveRoots();
    console.log("📊 Initial active roots:", totalRoots.toString());

    // Check roles
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

    const hasDefaultAdmin = await merkleRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasAdminRole = await merkleRegistry.hasRole(ADMIN_ROLE, deployer.address);
    const hasRegistrarRole = await merkleRegistry.hasRole(REGISTRAR_ROLE, deployer.address);

    console.log("🔐 Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdmin);
    console.log("🔐 Deployer has ADMIN_ROLE:", hasAdminRole);
    console.log("🔐 Deployer has REGISTRAR_ROLE:", hasRegistrarRole);

    // Get deployment transaction details
    const deployTx = merkleRegistry.deploymentTransaction();
    if (deployTx) {
      console.log("\n📋 Deployment transaction details:");
      console.log("🆔 Transaction hash:", deployTx.hash);
      console.log("⛽ Gas limit:", deployTx.gasLimit?.toString());
      console.log("💰 Gas price:", deployTx.gasPrice ? ethers.formatUnits(deployTx.gasPrice, "gwei") + " gwei" : "N/A");
    }

    // Optional: Grant REGISTRAR_ROLE to deployer for testing
    if (!hasRegistrarRole) {
      console.log("\n🎯 Granting REGISTRAR_ROLE to deployer for testing...");
      const grantTx = await merkleRegistry.grantRole(REGISTRAR_ROLE, deployer.address);
      await grantTx.wait();
      console.log("✅ REGISTRAR_ROLE granted to deployer");
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📝 Summary:");
    console.log("├── Contract Address:", contractAddress);
    console.log("├── Network: CELO Alfajores");
    console.log("├── Deployer:", deployer.address);
    console.log("├── Version:", version);
    console.log("└── Gas Used:", deployTx?.gasLimit?.toString() || "N/A");

    console.log("\n🔗 Next steps:");
    console.log("1. Verify the contract on CELO Explorer");
    console.log("2. Grant REGISTRAR_ROLE to users who should register Merkle roots");
    console.log("3. Test the contract functionality");
    console.log("4. Integrate with your frontend application");

    // Save deployment info to a file for reference
    const deploymentInfo = {
      contractAddress,
      network: "alfajores",
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      version,
      transactionHash: deployTx?.hash,
      gasUsed: deployTx?.gasLimit?.toString(),
    };

    console.log("\n💾 Deployment info saved for reference:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then((address) => {
      if (address) {
        console.log(`\n✨ MerkleAnchorRegistry successfully deployed at: ${address}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}

export default main;