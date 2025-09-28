# Shinobi Vote Indexer

A clean, privacy-focused indexer for the Shinobi Vote anonymous DAO using The Graph Protocol.

## Overview

This indexer tracks anonymous governance activities for the Delhi Infrastructure DAO, focusing solely on core DAO functionality without unnecessary complexity.

## Indexed Events

### Core DAO Events
- **ProposalCreated**: New governance proposals
- **VoteCast**: Anonymous votes using nullifier hashes
- **MemberAdded**: New DAO members with identity commitments  
- **ProposalExecuted**: Completed proposal execution

## Entities

### Core Entities
- `DAOStats`: Global DAO statistics
- `Proposal`: Governance proposals with voting options
- `ProposalOption`: Individual voting choices  
- `Vote`: Anonymous votes (nullifier hash only)
- `Member`: DAO members with identity commitments

### Analytics Entities
- `DailyMetric`: Daily aggregated metrics
- `VotingActivity`: Hourly voting activity tracking

## Privacy Features

✅ **Anonymous Voting**: Only nullifier hashes stored  
✅ **Identity Commitments**: Members identified cryptographically  
✅ **Zero-Knowledge Proofs**: Vote eligibility without identity reveal  
✅ **Aggregated Analytics**: Privacy-preserving statistics  

## Configuration

**Network**: Base Sepolia  
**DAO Contract**: `0xb57095A7CaA0e2af4ec6ad0cB4a54aDC4da8a658`  
**Start Block**: `31619602`  

## Development

```bash
# Generate types
npm run codegen

# Build subgraph  
npm run build

# Deploy to The Graph Studio
npm run deploy

# Run tests
npm run test
```

## Deployment Status

🟢 **Live**: https://api.studio.thegraph.com/query/113435/shinobi-vote/version/latest

## GraphQL Queries

Key query capabilities:
- List proposals with voting results
- Get DAO statistics and member count
- Track voting activity and participation
- Search proposals by content
- Anonymous member analytics

See `queries.graphql` for full query examples.

## Architecture

```
Smart Contract → The Graph Indexer → GraphQL API → Frontend
     ↓                ↓                 ↓            ↓
  ZK Proofs     Nullifier Only    Anonymous     Privacy UI
  Anonymous      No Identity       Queries      Vote Results
```

This indexer is optimized for anonymous governance with minimal attack surface and maximum privacy protection.