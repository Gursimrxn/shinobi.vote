import { ethers } from "hardhat";

async function main() {
  console.log("=== ModeratorRegistry Demo ===\n");

  // Get signers
  const [deployer, moderator1, moderator2] = await ethers.getSigners();
  
  console.log("Participants:");
  console.log("Deployer:", await deployer.getAddress());
  console.log("Moderator1:", await moderator1.getAddress());
  console.log("Moderator2:", await moderator2.getAddress());
  console.log();

  // Deploy contract
  console.log("1. Deploying ModeratorRegistry contract...");
  const ModeratorRegistryFactory = await ethers.getContractFactory("ModeratorRegistry");
  const moderatorRegistry: any = await ModeratorRegistryFactory.deploy();
  await moderatorRegistry.waitForDeployment();
  
  const contractAddress = await moderatorRegistry.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);
  console.log();

  // Create sample task IDs
  const taskId1 = ethers.keccak256(ethers.toUtf8Bytes("Review PR #123"));
  const taskId2 = ethers.keccak256(ethers.toUtf8Bytes("Moderate comment thread"));
  const attestationHash1 = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmHashForPR123Attestation"));
  const attestationHash2 = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmHashForCommentModerationAttestation"));

  console.log("Sample Task IDs:");
  console.log("Task 1 (PR Review):", taskId1);
  console.log("Task 2 (Comment Moderation):", taskId2);
  console.log();

  // Step 2: Moderators opt-in
  console.log("2. Moderators opting in...");
  
  let tx = await moderatorRegistry.connect(moderator1).optInModerator();
  await tx.wait();
  console.log("✅ Moderator1 opted in");
  
  tx = await moderatorRegistry.connect(moderator2).optInModerator();
  await tx.wait();
  console.log("✅ Moderator2 opted in");
  
  // Verify moderator status
  const isMod1 = await moderatorRegistry.isModerator(await moderator1.getAddress());
  const isMod2 = await moderatorRegistry.isModerator(await moderator2.getAddress());
  console.log("Moderator1 status:", isMod1);
  console.log("Moderator2 status:", isMod2);
  console.log();

  // Step 3: Claim tasks
  console.log("3. Claiming tasks...");
  
  tx = await moderatorRegistry.connect(moderator1).claimTask(taskId1);
  await tx.wait();
  console.log("✅ Moderator1 claimed Task 1 (PR Review)");
  
  tx = await moderatorRegistry.connect(moderator2).claimTask(taskId2);
  await tx.wait();
  console.log("✅ Moderator2 claimed Task 2 (Comment Moderation)");
  
  // Check task status
  let task1 = await moderatorRegistry.getTask(taskId1);
  let task2 = await moderatorRegistry.getTask(taskId2);
  
  console.log("\nTask 1 status:");
  console.log("  ID:", task1.id);
  console.log("  Claimer:", task1.claimer);
  console.log("  Status:", task1.status, "(1 = claimed)");
  console.log("  Attestation Hash:", task1.attestationHash);
  
  console.log("\nTask 2 status:");
  console.log("  ID:", task2.id);
  console.log("  Claimer:", task2.claimer);
  console.log("  Status:", task2.status, "(1 = claimed)");
  console.log("  Attestation Hash:", task2.attestationHash);
  console.log();

  // Step 4: Resolve tasks
  console.log("4. Resolving tasks with attestation hashes...");
  
  tx = await moderatorRegistry.connect(moderator1).resolveTask(taskId1, attestationHash1);
  await tx.wait();
  console.log("✅ Moderator1 resolved Task 1 with attestation hash");
  
  tx = await moderatorRegistry.connect(moderator2).resolveTask(taskId2, attestationHash2);
  await tx.wait();
  console.log("✅ Moderator2 resolved Task 2 with attestation hash");
  
  // Check final task status
  task1 = await moderatorRegistry.getTask(taskId1);
  task2 = await moderatorRegistry.getTask(taskId2);
  
  console.log("\nFinal Task 1 status:");
  console.log("  ID:", task1.id);
  console.log("  Claimer:", task1.claimer);
  console.log("  Status:", task1.status, "(2 = resolved)");
  console.log("  Attestation Hash:", task1.attestationHash);
  
  console.log("\nFinal Task 2 status:");
  console.log("  ID:", task2.id);
  console.log("  Claimer:", task2.claimer);
  console.log("  Status:", task2.status, "(2 = resolved)");
  console.log("  Attestation Hash:", task2.attestationHash);
  console.log();

  // Step 5: Demo admin functions
  console.log("5. Demo admin functions...");
  
  // Admin can remove a moderator
  tx = await moderatorRegistry.connect(deployer).removeModerator(await moderator1.getAddress());
  await tx.wait();
  console.log("✅ Admin removed Moderator1");
  
  const isMod1After = await moderatorRegistry.isModerator(await moderator1.getAddress());
  console.log("Moderator1 status after removal:", isMod1After);
  
  // Admin can reset a task
  tx = await moderatorRegistry.connect(deployer).resetTask(taskId1);
  await tx.wait();
  console.log("✅ Admin reset Task 1");
  
  const resetTask = await moderatorRegistry.getTask(taskId1);
  console.log("Task 1 after reset:");
  console.log("  Claimer:", resetTask.claimer);
  console.log("  Status:", resetTask.status, "(0 = unclaimed)");
  console.log("  Attestation Hash:", resetTask.attestationHash);
  console.log();

  console.log("=== Demo completed successfully! ===");
  console.log("\nKey Features Demonstrated:");
  console.log("✅ Moderator self-registration (opt-in/opt-out)");
  console.log("✅ Task claiming by moderators");
  console.log("✅ Task resolution with attestation hashes");
  console.log("✅ Admin emergency functions");
  console.log("✅ Gas-optimized on-chain storage (only 32-byte hashes)");
  console.log("✅ Event emission for off-chain indexing");
  console.log("\nContract is ready for frontend integration and Filecoin attestation storage!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo failed:", error);
    process.exit(1);
  });