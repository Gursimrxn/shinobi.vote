import { getSelfFrontendConfig } from './self';

export interface ContractsConfig {
  rpcUrl: string;
  relayerKey: string;
  identityAnchorAddress: string;
  badgeNftAddress?: string;
  postAnchorAddress?: string;
  merkleAnchorAddress?: string;
  badgeMetadataUri?: string;
  scope: string;
  endpoint: string;
  devMode: boolean;
}

function ensureServerEnvironment() {
  if (typeof window !== 'undefined') {
    throw new Error('Contract configuration must only be accessed on the server.');
  }
}

export function getContractsConfig(): ContractsConfig {
  ensureServerEnvironment();

  const rpcUrl =
    process.env.CELO_RPC_URL?.trim() ??
    (process.env.NODE_ENV === 'production'
      ? 'https://forno.celo.org'
      : 'https://alfajores-forno.celo-testnet.org');

  const relayerKey = process.env.SELF_RELAYER_PRIVATE_KEY?.trim();
  if (!relayerKey) {
    throw new Error('Missing SELF_RELAYER_PRIVATE_KEY environment variable.');
  }

  const identityAnchorAddress = process.env.IDENTITY_ANCHOR_ADDRESS?.trim();
  if (!identityAnchorAddress) {
    throw new Error('Missing IDENTITY_ANCHOR_ADDRESS environment variable.');
  }

  const badgeNftAddress = process.env.BADGE_NFT_ADDRESS?.trim();
  const postAnchorAddress = process.env.POST_ANCHOR_ADDRESS?.trim();
  const merkleAnchorAddress = process.env.MERKLE_ANCHOR_ADDRESS?.trim();
  const badgeMetadataUri = process.env.BADGE_METADATA_URI?.trim();

  const selfConfig = getSelfFrontendConfig();

  return {
    rpcUrl,
    relayerKey,
    identityAnchorAddress,
    badgeNftAddress,
    postAnchorAddress,
    merkleAnchorAddress,
    badgeMetadataUri,
    scope: selfConfig.scope,
    endpoint: selfConfig.endpoint,
    devMode: selfConfig.devMode,
  };
}
