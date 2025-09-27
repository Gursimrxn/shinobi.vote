import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting PostAnchor deployment...");
  console.log("=====================================");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("📝 Deploying with account:", deployerAddress);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  if (balance < ethers.parseEther("0.001")) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.");
  }

  console.log("\n⏳ Deploying PostAnchor contract...");
  
  // Deploy the contract
  const PostAnchorFactory = await ethers.getContractFactory("PostAnchor");
  const postAnchor: any = await PostAnchorFactory.deploy();
  
  // Wait for deployment
  await postAnchor.waitForDeployment();
  
  const contractAddress = await postAnchor.getAddress();
  console.log("✅ PostAnchor deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  
  // Verify deployment by calling a function
  console.log("\n🔍 Verifying deployment...");
  try {
    const version = await postAnchor.getVersion();
    console.log("📦 Contract version:", version);
    console.log("✅ Deployment verification successful!");
  } catch (error) {
    console.error("❌ Deployment verification failed:", error);
    return;
  }
  
  // Test gas usage for anchorPost function
  console.log("\n⛽ Estimating gas usage...");
  const testCidHash = ethers.keccak256(ethers.toUtf8Bytes("QmExampleCID123TestHash"));
  const testMetaHash = ethers.keccak256(ethers.toUtf8Bytes('{"tags":["test"],"category":"demo"}'));
  
  try {
    const gasEstimate = await postAnchor.anchorPost.estimateGas(testCidHash, testMetaHash);
    console.log("📊 Estimated gas for anchorPost():", gasEstimate.toString(), "gas");
    
    if (gasEstimate <= 5000n) {
      console.log("✅ Gas usage is optimal (≤ 5,000 gas)");
    } else {
      console.log("⚠️  Gas usage is higher than expected");
    }
  } catch (error) {
    console.error("❌ Gas estimation failed:", error);
  }
  
  // Display deployment summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("Contract Name: PostAnchor");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", deployerAddress);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Block Number:", await ethers.provider.getBlockNumber());
  console.log("=".repeat(50));
  
  // Usage examples
  console.log("\n📖 USAGE EXAMPLES:");
  console.log("===================");
  console.log("1. Anchor a post:");
  console.log(`   postAnchor.anchorPost("0x${testCidHash.slice(2)}", "0x${testMetaHash.slice(2)}")`);
  console.log("\n2. Hash a CID:");
  console.log('   postAnchor.hashCID("QmYourFilecoinCIDHere")');
  console.log("\n3. Hash metadata:");
  console.log('   postAnchor.hashMetadata(\'{"tags":["crypto","defi"],"category":"post"}\')');
  
  console.log("\n🔗 Frontend Integration:");
  console.log("========================");
  console.log("Listen for PostAnchored events:");
  console.log("postAnchor.on('PostAnchored', (author, cidHash, timestamp, metaHash) => {");
  console.log("  console.log('New post anchored by:', author);");
  console.log("  console.log('Content hash:', cidHash);");
  console.log("  console.log('Anchored at:', new Date(timestamp * 1000));");
  console.log("});");
  
  console.log("\n✨ Deployment completed successfully!");
  console.log("🎯 Ready for hackathon demo!");
  
  return postAnchor;
}

// Error handling and execution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error("=====================");
    console.error(error);
    process.exit(1);
  });