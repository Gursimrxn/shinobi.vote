# Identity Anchor Contracts

Hardhat workspace for compiling, testing, and deploying the `IdentityAnchor` smart contract on the CELO Alfajores testnet.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Copy `.env.example` to `.env` and provide the required secrets:
   - `CELO_ALFAJORES_RPC_URL` (defaults to the public Forno endpoint if omitted)
   - `CELO_PRIVATE_KEY` (account used for deployment)
   - `CELOSCAN_API_KEY` (optional, only needed for source verification)

2. Install dependencies:
   ```powershell
   npm install
   ```

## Scripts

- `npm run build` — Compile the Solidity contracts.
- `npm run test` — Run the Hardhat test suite.
- `npm run clean` — Clear cache and artifact folders.
- `npm run lint` — Execute Hardhat's built-in static checks (`hardhat check`).

## Deployment Notes

The Hardhat network configuration includes an `alfajores` target. After setting your `.env`, deploy using a dedicated script (for example, `npx hardhat run scripts/deploy.ts --network alfajores`).

Future enhancements will integrate Merkle proof verification, decentralized storage attestations, and ERC-721 badge minting as outlined in the `IdentityAnchor` contract.
