import { ethers } from 'ethers';
import { getContractsConfig, ContractsConfig } from '@/config/contracts';

const identityAnchorAbi = [
  'function registerIdentity(bytes32 commitment)',
  'function registerIdentityFor(address user, bytes32 commitment)',
  'function hasIdentity(address user) view returns (bool)',
];

const badgeNftAbi = [
  'function safeMintAuto(address to, string uri) returns (uint256)',
];

const postAnchorAbi = [
  'function anchorPost(bytes32 cidHash, bytes32 metaHash)',
];

export type ContractsClient = {
  wallet: ethers.Wallet;
  identityAnchor: ethers.Contract;
  badgeNft?: ethers.Contract;
  postAnchor?: ethers.Contract;
  config: ContractsConfig;
};

let cachedClient: ContractsClient | undefined;

function ensureServerEnvironment() {
  if (typeof window !== 'undefined') {
    throw new Error('Contracts client can only be instantiated on the server.');
  }
}

export function getContractsClient(): ContractsClient {
  ensureServerEnvironment();

  if (cachedClient) {
    return cachedClient;
  }

  const config = getContractsConfig();
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);

  const wallet = new ethers.Wallet(config.relayerKey, provider);
  const identityAnchor = new ethers.Contract(
    config.identityAnchorAddress,
    identityAnchorAbi,
    wallet
  );

  const badgeNft = config.badgeNftAddress
    ? new ethers.Contract(config.badgeNftAddress, badgeNftAbi, wallet)
    : undefined;

  const postAnchor = config.postAnchorAddress
    ? new ethers.Contract(config.postAnchorAddress, postAnchorAbi, wallet)
    : undefined;

  cachedClient = {
    wallet,
    identityAnchor,
    badgeNft,
    postAnchor,
    config,
  };

  return cachedClient;
}

export async function registerIdentityForUser(
  userAddress: string,
  commitment: string
): Promise<{ alreadyRegistered: boolean; txHash?: string }> {
  const client = getContractsClient();
  const { identityAnchor } = client;

  const formattedAddress = ethers.getAddress(userAddress);
  const formattedCommitment = normalizeCommitment(commitment);

  const alreadyRegistered: boolean = await identityAnchor.hasIdentity(formattedAddress);

  if (alreadyRegistered) {
    return { alreadyRegistered: true };
  }

  const tx = await identityAnchor.registerIdentityFor(formattedAddress, formattedCommitment);
  const receipt = await tx.wait();

  return {
    alreadyRegistered: false,
    txHash: receipt?.hash ?? tx.hash,
  };
}

export async function mintVerificationBadge(
  userAddress: string,
  metadataUri?: string
): Promise<string | undefined> {
  const client = getContractsClient();
  const { badgeNft, config } = client;

  const uri = metadataUri ?? config.badgeMetadataUri;

  if (!badgeNft || !uri) {
    return undefined;
  }

  const tx = await badgeNft.safeMintAuto(ethers.getAddress(userAddress), uri);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

function normalizeCommitment(value: string): string {
  if (value.startsWith('0x') && value.length === 66) {
    return ethers.hexlify(value);
  }

  const bytes = value.startsWith('0x')
    ? ethers.getBytes(value)
    : ethers.toUtf8Bytes(value);

  return ethers.keccak256(bytes);
}

export async function anchorVerificationPost(
  cidHash: string,
  metaHash: string
): Promise<string | undefined> {
  const client = getContractsClient();
  const { postAnchor } = client;

  if (!postAnchor) {
    return undefined;
  }

  const tx = await postAnchor.anchorPost(cidHash, metaHash);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}
