import { Identity } from '@semaphore-protocol/identity';

export interface Proposal {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  executed: boolean;
  proposer: string;
  totalVotes: number;
  optionCount: number;
  options: string[];
  votes: number[];
}

export interface VoteOption {
  index: number;
  text: string;
  votes: number;
}

export interface SemaphoreProof {
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: [string, string, string, string, string, string, string, string];
}

export interface CreateProposalParams {
  title: string;
  description: string;
  options: string[];
  duration: number; // in seconds
}

export interface VoteParams {
  proposalId: number;
  optionIndex: number;
  identity: Identity;
}

export interface ContractAddresses {
  shinobiDAO: string;
  semaphoreVoting: string;
  votingPaymaster: string;
  semaphore: string;
}

export interface DAOMember {
  address: string;
  identityCommitment: string;
  joinedAt: number;
}

export interface VoteEvent {
  proposalId: number;
  optionIndex: number;
  nullifierHash: string;
  timestamp: number;
}

export interface ProposalCreatedEvent {
  proposalId: number;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  proposer: string;
}