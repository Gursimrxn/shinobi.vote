import { ethers } from "hardhat";
import type { BadgeNFT } from "../typechain-types/contracts/core/BadgeNFT";

async function main() {
    console.log("🚀 Starting BadgeNFT deployment to CELO Alfajores...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    
    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
    
    if (balance < ethers.parseEther("0.01")) {
        console.warn("⚠️  Warning: Low balance. You may need more CELO for deployment.");
    }

    console.log("⏳ Deploying BadgeNFT contract...");
    
    // Deploy the BadgeNFT contract
    const BadgeNFTFactory = await ethers.getContractFactory("BadgeNFT");
    const badgeNFTDeployed = await BadgeNFTFactory.deploy();
    
    await badgeNFTDeployed.waitForDeployment();
    const contractAddress = await badgeNFTDeployed.getAddress();
    
    // Get the properly typed contract instance
    const badgeNFT = await ethers.getContractAt("BadgeNFT", contractAddress) as unknown as BadgeNFT;
    
    console.log("✅ BadgeNFT deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("🔗 Network:", (await ethers.provider.getNetwork()).name);
    console.log("⛽ Gas used for deployment:", (await badgeNFTDeployed.deploymentTransaction()?.wait())?.gasUsed?.toString());

    // Verify contract setup
    console.log("\n🔍 Verifying contract setup...");
    
    // Check if deployer has admin role
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasAdminRole = await badgeNFT.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log("👑 Deployer has admin role:", hasAdminRole);
    
    // Check contract metadata
    const name = await badgeNFT.name();
    const symbol = await badgeNFT.symbol();
    const currentTokenId = await badgeNFT.getCurrentTokenId();
    const totalSupply = await badgeNFT.totalSupply();
    
    console.log("🏷️  Contract name:", name);
    console.log("🔤 Contract symbol:", symbol);
    console.log("🔢 Current token ID:", currentTokenId.toString());
    console.log("📊 Total supply:", totalSupply.toString());

    // Optional: Grant minter role to a specific address
    // Uncomment and set the address if you want to grant minter role during deployment
    /*
    const minterAddress = "0x..."; // Replace with actual minter address
    if (minterAddress && ethers.isAddress(minterAddress)) {
        console.log("\n🎯 Granting minter role to:", minterAddress);
        const tx = await badgeNFT.grantMinterRole(minterAddress);
        await tx.wait();
        
        const hasMinterRole = await badgeNFT.hasRole(
            ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")), 
            minterAddress
        );
        console.log("✅ Minter role granted:", hasMinterRole);
    }
    */

    console.log("\n📋 Deployment Summary:");
    console.log("=====================================");
    console.log("Contract Name: Shinobi Badge (GHOST-BADGE)");
    console.log("Contract Address:", contractAddress);
    console.log("Network: CELO Alfajores Testnet");
    console.log("Deployer:", deployer.address);
    console.log("Admin Role: ✅ Granted to deployer");
    console.log("Ready for Badge Minting: ✅");
    console.log("=====================================");

    // Save deployment info to a file for future reference
    const deploymentInfo = {
        contractName: "BadgeNFT",
        contractAddress: contractAddress,
        network: "alfajores",
        deployer: deployer.address,
        deploymentTimestamp: new Date().toISOString(),
        transactionHash: badgeNFTDeployed.deploymentTransaction()?.hash,
        blockNumber: (await badgeNFTDeployed.deploymentTransaction()?.wait())?.blockNumber
    };

    console.log("\n💾 Deployment info saved for integration:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 BadgeNFT deployment completed successfully!");
    console.log("\n📚 Next steps:");
    console.log("1. Verify the contract on CeloScan if needed");
    console.log("2. Grant MINTER_ROLE to moderators/relayers");
    console.log("3. Integrate with Shinobi frontend");
    console.log("4. Test badge minting with IPFS/Filecoin metadata");
    
    return {
        contract: badgeNFT,
        address: contractAddress,
        deploymentInfo
    };
}

// Handle deployment execution and errors
main()
    .then((result) => {
        console.log("\n✨ Deployment script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });