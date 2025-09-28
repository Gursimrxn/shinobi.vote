import hre from 'hardhat';
import { parseEther, formatEther, Address, Hex, WalletClient } from 'viem';
import { Identity, Group, generateProof, verifyProof } from '@semaphore-protocol/core';

// ============ CONFIGURATION ============
const CONFIG = {
  // Base Sepolia Semaphore verifier address (using same as prepaid-gas-paymaster)
  SEMAPHORE_VERIFIER: '0x6C42599435B82121794D835263C846384869502d',
  // Base Sepolia PoseidonT3 library address
  POSEIDON_T3: '0xB43122Ecb241DD50062641f089876679fd06599a',
  DELAY_MS: 2000,
  PROPOSAL_DURATION: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

// ============ TYPE DEFINITIONS ============
interface TestState {
  identities: Identity[];
  localGroup: Group;
  daoContract: any;
  proposals: {
    id: number;
    title: string;
    options: string[];
  }[];
}

// ============ UTILITY FUNCTIONS ============
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateTestIdentity(seed: string): Identity {
  return new Identity(seed);
}

// ============ DAO TEST FUNCTIONS ============
async function deployDAO(wallet: WalletClient): Promise<any> {
  console.log('🚀 Deploying DAO contract...');

  const dao = await hre.viem.deployContract(
    'DAO',
    [
      CONFIG.SEMAPHORE_VERIFIER,
      wallet.account.address, // owner
    ],
    {
      libraries: {
        'poseidon-solidity/PoseidonT3.sol:PoseidonT3': CONFIG.POSEIDON_T3,
      },
    }
  );

  console.log(`   ✅ DAO deployed at: ${dao.address}`);
  return dao;
}

async function testMemberJoining(dao: any, testState: TestState): Promise<WalletClient[]> {
  console.log('\n=== Testing Member Joining ===');

  // Get wallet client and create test identity
  const wallets = await hre.viem.getWalletClients();
  const wallet1 = wallets[0];
  const member1 = generateTestIdentity('member-1-seed');

  testState.identities = [member1];
  testState.localGroup = new Group();

  // Member joins DAO
  console.log('👤 Adding member to DAO...');
  await dao.write.joinDAO([member1.commitment], { account: wallet1.account });
  testState.localGroup.addMember(member1.commitment);
  await delay(CONFIG.DELAY_MS);

  const treeSize = await dao.read.currentTreeSize();
  console.log(`   ✅ Member added successfully (Tree size: ${treeSize})`);

  return [wallet1];
}

async function testProposalCreation(
  dao: any,
  wallet: WalletClient,
  testState: TestState
): Promise<void> {
  console.log('\n=== Testing Proposal Creation ===');

  // Create proposal
  const proposal = {
    title: 'Increase Treasury Allocation',
    description: 'Should we increase the treasury allocation for development?',
    options: ['Yes', 'No', 'Abstain'],
    duration: CONFIG.PROPOSAL_DURATION,
  };

  console.log('📝 Creating proposal...');
  await dao.write.createProposal(
    [proposal.title, proposal.description, proposal.options, proposal.duration],
    { account: wallet.account }
  );

  await delay(CONFIG.DELAY_MS);

  // Store proposal for voting
  testState.proposals = [{ id: 0, title: proposal.title, options: proposal.options }];

  const proposalCount = await dao.read.proposalCount();
  console.log(`   ✅ Proposal created successfully (Total: ${proposalCount})`);
}

async function testAnonymousVoting(
  dao: any,
  wallet: WalletClient,
  testState: TestState
): Promise<void> {
  console.log('\n=== Testing Anonymous Voting ===');

  const daoScope = await dao.read.SCOPE();
  const currentRootIndex = await dao.read.currentRootIndex();

  // Cast anonymous vote
  console.log('🗳️ Casting anonymous vote for "Yes"...');
  await castAnonymousVote(
    dao,
    testState.identities[0],
    testState.localGroup,
    0, // proposalId
    0, // optionIndex (Yes)
    daoScope,
    currentRootIndex
  );

  // Display final vote results
  await displayVoteResults(dao, testState);
}

async function castAnonymousVote(
  dao: any,
  voterIdentity: Identity,
  localGroup: Group,
  proposalId: number,
  optionIndex: number,
  daoScope: bigint,
  merkleRootIndex: number
): Promise<void> {
  console.log(`   🔬 Generating ZK proof...`);

  const proofStartTime = Date.now();

  // Generate the Semaphore proof
  const proof = await generateProof(
    voterIdentity,
    localGroup,
    BigInt(optionIndex), // message (the vote choice)
    daoScope // scope (DAO's unique identifier)
  );

  const proofEndTime = Date.now();
  const proofGenerationTime = proofEndTime - proofStartTime;

  console.log(`   ✅ Proof generated (${proofGenerationTime}ms)`);

  // Prepare vote data structure
  const voteData = {
    proof: {
      points: proof.points as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
      merkleTreeRoot: BigInt(proof.merkleTreeRoot),
      nullifier: BigInt(proof.nullifier),
      message: BigInt(proof.message),
      scope: BigInt(proof.scope),
      merkleTreeDepth: BigInt(proof.merkleTreeDepth),
    },
    config: {
      merkleRootIndex: merkleRootIndex,
    },
  };

  // Cast the vote
  const txHash = await dao.write.vote([BigInt(proposalId), BigInt(optionIndex), voteData]);

  console.log(`   ✅ Vote cast successfully!`);
  await delay(CONFIG.DELAY_MS);
}

async function displayVoteResults(dao: any, testState: TestState): Promise<void> {
  console.log('\n=== Vote Results ===');

  for (const proposal of testState.proposals) {
    const votes = await dao.read.getProposalVotes([BigInt(proposal.id)]);

    console.log(`📊 "${proposal.title}"`);
    for (let i = 0; i < proposal.options.length; i++) {
      console.log(`   ${proposal.options[i]}: ${votes[i]} votes`);
    }
  }
}

async function testProposalExecution(dao: any): Promise<void> {
  // Note: In production, proposals can only be executed after voting period ends
  console.log('\n💡 Note: Proposal execution requires voting period to end');
}

// ============ MAIN TEST FUNCTION ============
async function runDAOTests(): Promise<void> {
  console.log('🎯 Shinobi DAO Test - Anonymous Voting with ZK Proofs');
  console.log('====================================================\n');

  // Get wallet client and initialize test state
  const [wallet] = await hre.viem.getWalletClients();
  const testState: TestState = {
    identities: [],
    localGroup: new Group(),
    daoContract: null,
    proposals: [],
  };

  try {
    // Deploy DAO
    testState.daoContract = await deployDAO(wallet);
    await delay(CONFIG.DELAY_MS);

    // Add member to DAO
    const memberWallets = await testMemberJoining(testState.daoContract, testState);

    // Create proposal
    await testProposalCreation(testState.daoContract, memberWallets[0], testState);

    // Cast anonymous vote
    await testAnonymousVoting(testState.daoContract, memberWallets[0], testState);

    // Show execution note
    await testProposalExecution(testState.daoContract);

    console.log('\n🎉 DAO Test Completed Successfully!');
    console.log('\n📈 Summary:');
    console.log(`   ✅ Self-contained Semaphore group created`);
    console.log(`   ✅ Member added with identity commitment`);
    console.log(`   ✅ Proposal created and ready for voting`);
    console.log(`   ✅ Anonymous vote cast with ZK proof verification`);
    console.log(`   ✅ Vote recorded without revealing voter identity`);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// ============ SCRIPT EXECUTION ============
if (require.main === module) {
  runDAOTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { runDAOTests };
