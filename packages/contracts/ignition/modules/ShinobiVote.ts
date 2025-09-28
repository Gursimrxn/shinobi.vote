import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { parseEther } from 'viem';

// ERC-4337 EntryPoint v0.7
const ENTRYPOINT_V7 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
const SEMAPHORE_VERIFIER = '0x6C42599435B82121794D835263C846384869502d';
const POSEIDON_T3 = '0xB43122Ecb241DD50062641f089876679fd06599a';

const ShinobiVoteModule = buildModule('ShinobiVoteModule', (m) => {
  // Parameters that can be overridden during deployment
  const entryPoint = m.getParameter('entryPoint', ENTRYPOINT_V7);
  const semaphoreVerifier = m.getParameter('semaphoreVerifier', SEMAPHORE_VERIFIER);

  const poseidonT3 = m.contractAt('PoseidonT3', POSEIDON_T3);

  const owner = m.getParameter('owner', m.getAccount(0));

  // Deploy DAO with membership verifier
  const shinobiDAO = m.contract('DAO', [semaphoreVerifier, owner], {
    libraries: {
      PoseidonT3: poseidonT3,
    },
  });

  // Deploy VotingPaymaster with DAO and verifier references
  const votingPaymaster = m.contract('VotingPaymaster', [
    entryPoint,
    shinobiDAO,
    semaphoreVerifier,
  ]);

  // Add initial deposit to paymaster (0.1 ETH)
  const initialDeposit = parseEther('0.1');
  m.call(votingPaymaster, 'deposit', [], {
    value: initialDeposit,
  });

  return {
    // Deployed contracts (only contract futures are returned to match IgnitionModuleResult<string>)
    shinobiDAO,
    votingPaymaster,
    poseidonT3,
  };
});

export default ShinobiVoteModule;
