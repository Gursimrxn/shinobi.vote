# ModeratorRegistry Contract

The ModeratorRegistry contract manages moderators and task attestations for GhostApp, providing a decentralized system for task management and verification.

## Overview

This contract enables:
- **Moderator Self-Registration**: Users can opt-in/opt-out as moderators
- **Task Management**: Moderators can claim and resolve tasks
- **Attestation Storage**: On-chain storage of attestation hashes linking to off-chain Filecoin manifests
- **Access Control**: Role-based permissions with admin emergency functions
- **Gas Optimization**: Minimal on-chain storage using 32-byte hashes

## Contract Architecture

### Core Components

1. **ModeratorRegistry.sol** - Main contract in `contracts/core/`
2. **IModeratorRegistry.sol** - Interface in `contracts/interfaces/`
3. **Comprehensive tests** - `test/ModeratorRegistry.test.ts`
4. **Deployment scripts** - `scripts/deployModeratorRegistry.ts`

### Key Features

- **OpenZeppelin AccessControl** for secure role management
- **Custom errors** for gas-efficient error handling
- **Event-driven architecture** for off-chain indexing
- **Minimal storage** design for cost optimization

## Contract Details

### Storage Structure

```solidity
// Moderator tracking
mapping(address => bool) public isModerator;

// Task management
struct Task {
    bytes32 id;
    address claimer;
    uint8 status;           // 0=unclaimed, 1=claimed, 2=resolved
    bytes32 attestationHash; // Hash of off-chain Filecoin manifest
}
mapping(bytes32 => Task) public tasks;
```

### Task Status

- `STATUS_UNCLAIMED = 0` - Task is available to claim
- `STATUS_CLAIMED = 1` - Task has been claimed by a moderator
- `STATUS_RESOLVED = 2` - Task has been completed with attestation

### Core Functions

#### Moderator Management

```solidity
function optInModerator() external
function optOutModerator() external
function isModerator(address account) external view returns (bool)
```

#### Task Management

```solidity
function claimTask(bytes32 taskId) external onlyModerator
function resolveTask(bytes32 taskId, bytes32 attestationHash) external onlyModerator
function getTask(bytes32 taskId) external view returns (Task memory)
function taskExists(bytes32 taskId) external view returns (bool)
```

#### Admin Functions

```solidity
function removeModerator(address moderator) external onlyRole(DEFAULT_ADMIN_ROLE)
function resetTask(bytes32 taskId) external onlyRole(DEFAULT_ADMIN_ROLE)
```

### Events

```solidity
event ModeratorOptedIn(address indexed moderator);
event ModeratorOptedOut(address indexed moderator);
event TaskClaimed(bytes32 indexed taskId, address indexed claimer);
event TaskResolved(bytes32 indexed taskId, bytes32 indexed attestationHash);
```

## Usage Workflow

### 1. Moderator Registration

```typescript
// User opts in as moderator
await moderatorRegistry.connect(user).optInModerator();

// Check moderator status
const isMod = await moderatorRegistry.isModerator(userAddress);
```

### 2. Task Management

```typescript
// Create task ID (off-chain)
const taskId = ethers.keccak256(ethers.toUtf8Bytes("unique-task-identifier"));

// Moderator claims task
await moderatorRegistry.connect(moderator).claimTask(taskId);

// Check task status
const task = await moderatorRegistry.getTask(taskId);
console.log("Status:", task.status); // 1 = claimed
```

### 3. Task Resolution

```typescript
// Create attestation hash for Filecoin manifest
const attestationHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmHashOfSignedManifest"));

// Resolve task with attestation
await moderatorRegistry.connect(moderator).resolveTask(taskId, attestationHash);

// Verify resolution
const resolvedTask = await moderatorRegistry.getTask(taskId);
console.log("Status:", resolvedTask.status); // 2 = resolved
console.log("Attestation:", resolvedTask.attestationHash);
```

## Testing

### Run Tests

```bash
npx hardhat test test/ModeratorRegistry.test.ts
```

### Test Coverage

- ✅ Moderator opt-in/opt-out functionality
- ✅ Task claiming and resolution workflow
- ✅ Access control and permissions
- ✅ Error handling and edge cases
- ✅ Event emission verification
- ✅ Admin emergency functions
- ✅ Integration scenarios
- ✅ Gas optimization validation

### Sample Test Output

```
ModeratorRegistry
  ✔ Should set the deployer as default admin
  ✔ Should handle complete moderator and task lifecycle
  ✔ Should allow multiple moderators to work on different tasks
  ✔ Should store minimal data on-chain
  
29 passing (951ms)
```

## Deployment

### Local Development

```bash
# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat run scripts/deployModeratorRegistry.ts

# Run demo
npx hardhat run scripts/demoModeratorRegistry.ts
```

### Testnet Deployment (Celo Alfajores)

```bash
# Deploy to Alfajores testnet
npx hardhat run scripts/deployModeratorRegistry.ts --network alfajores

# Verify on block explorer
npx hardhat verify --network alfajores <CONTRACT_ADDRESS>
```

## Integration Guide

### Frontend Integration

1. **Connect to Contract**
```typescript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(contractAddress, abi, provider);
```

2. **Monitor Events**
```typescript
contract.on("TaskClaimed", (taskId, claimer) => {
  console.log(`Task ${taskId} claimed by ${claimer}`);
});

contract.on("TaskResolved", (taskId, attestationHash) => {
  console.log(`Task ${taskId} resolved with attestation ${attestationHash}`);
});
```

3. **Query Task Status**
```typescript
const task = await contract.getTask(taskId);
const status = ["Unclaimed", "Claimed", "Resolved"][task.status];
```

### Off-chain Workflow

1. **Task Creation** (off-chain)
   - Generate unique task ID
   - Store task metadata in database
   - Present to moderators for claiming

2. **Task Claiming** (on-chain)
   - Moderator calls `claimTask(taskId)`
   - Status updates to "Claimed"
   - Task locked to specific moderator

3. **Task Resolution** (hybrid)
   - Moderator completes work off-chain
   - Creates signed manifest/attestation
   - Uploads manifest to Filecoin/IPFS
   - Calls `resolveTask(taskId, attestationHash)` with IPFS hash

4. **Verification** (off-chain)
   - Frontend retrieves attestation hash from contract
   - Fetches full manifest from Filecoin using hash
   - Verifies signature and validates completion

## Gas Optimization

### Design Principles

- **Minimal Storage**: Only essential data stored on-chain
- **Hash-based References**: 32-byte hashes instead of full data
- **Custom Errors**: More gas-efficient than require strings
- **Event-driven**: Heavy data in events, not storage

### Gas Estimates

| Function | Estimated Gas |
|----------|---------------|
| `optInModerator()` | ~46,000 |
| `claimTask()` | ~70,000 |
| `resolveTask()` | ~55,000 |
| `optOutModerator()` | ~30,000 |

## Security Features

### Access Control

- **Role-based permissions** using OpenZeppelin AccessControl
- **Moderator-only functions** with `onlyModerator` modifier
- **Admin emergency functions** for crisis management

### Validation

- **Input validation** for all function parameters
- **Status checks** to prevent invalid state transitions
- **Ownership verification** for task operations

### Best Practices

- **Reentrancy protection** (not needed for current functions)
- **Integer overflow protection** (Solidity 0.8.20+ built-in)
- **Custom error messages** for clear failure reasons

## Future Enhancements

### Potential Upgrades

1. **Reputation System**
   - Track moderator performance
   - Weight voting by reputation
   - Slashing for malicious behavior

2. **Economic Incentives**
   - Task reward distribution
   - Staking mechanism for moderators
   - Fee collection for platform

3. **Advanced Task Types**
   - Multi-moderator tasks
   - Hierarchical approval workflows
   - Time-bounded tasks with deadlines

4. **Governance Integration**
   - Community voting on task disputes
   - Decentralized parameter updates
   - Moderator election processes

## Troubleshooting

### Common Issues

1. **"Not a moderator" error**
   - Solution: Call `optInModerator()` first

2. **"Task already claimed" error**
   - Solution: Check task status before claiming

3. **"Unauthorized claimer" error**
   - Solution: Only task claimer can resolve their task

4. **"Invalid task ID" error**
   - Solution: Ensure taskId is not zero hash

### Debug Commands

```bash
# Check contract deployment
npx hardhat run scripts/deployModeratorRegistry.ts

# Run full test suite
npx hardhat test

# Deploy and demo functionality
npx hardhat run scripts/demoModeratorRegistry.ts
```

## Contract Addresses

### Testnet Deployments

- **Celo Alfajores**: `TBD` (Deploy using provided scripts)
- **Local Hardhat**: Dynamic (Deploy for development)

### Verification

After deployment, verify the contract source code on the respective block explorers for transparency and interaction.

---

## Summary

The ModeratorRegistry contract provides a robust, gas-efficient system for decentralized task management in GhostApp. With comprehensive testing, clear documentation, and production-ready code, it's designed for seamless integration with frontend applications and off-chain attestation systems like Filecoin.

**Key Benefits:**
- ✅ **Decentralized**: No central authority required
- ✅ **Transparent**: All actions recorded on-chain
- ✅ **Efficient**: Minimal gas usage with hash-based storage
- ✅ **Secure**: Role-based access control and validation
- ✅ **Extensible**: Clean architecture for future enhancements