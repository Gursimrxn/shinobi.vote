import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof } from '@semaphore-protocol/proof';
import { Contract, ContractRunner } from 'ethers';
import { SemaphoreProof } from './types';

export function createIdentity(privateKey?: string): Identity {
  return new Identity(privateKey);
}

export function createGroup(groupId: number = 1, members: bigint[] = []): Group {
  const group = new Group(groupId, 20, members); // groupId, depth, members
  return group;
}

export async function generateSemaphoreProof(
  identity: Identity,
  group: Group,
  message: bigint,
  scope: bigint
): Promise<SemaphoreProof> {
  const proof = await generateProof(identity, group, message, scope);
  
  return {
    merkleTreeDepth: group.depth,
    merkleTreeRoot: proof.merkleTreeRoot.toString(),
    nullifier: proof.nullifierHash.toString(),
    message: message.toString(),
    scope: scope.toString(),
    points: proof.proof.map((p: any) => p.toString()) as [string, string, string, string, string, string, string, string]
  };
}

export function formatProof(proof: SemaphoreProof): any {
  return {
    merkleTreeDepth: BigInt(proof.merkleTreeDepth),
    merkleTreeRoot: BigInt(proof.merkleTreeRoot),
    nullifier: BigInt(proof.nullifier),
    message: BigInt(proof.message),
    scope: BigInt(proof.scope),
    points: proof.points.map(p => BigInt(p))
  };
}

export function isProposalActive(startTime: number, endTime: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= startTime && now <= endTime;
}

export function getTimeRemaining(endTime: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, endTime - now);
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function calculateVotePercentages(votes: number[]): number[] {
  const total = votes.reduce((sum, count) => sum + count, 0);
  if (total === 0) return votes.map(() => 0);
  
  return votes.map(count => (count / total) * 100);
}

export function getWinningOption(votes: number[]): number {
  let maxVotes = -1;
  let winningIndex = 0;
  
  votes.forEach((count, index) => {
    if (count > maxVotes) {
      maxVotes = count;
      winningIndex = index;
    }
  });
  
  return winningIndex;
}

export async function waitForTransaction(
  provider: ContractRunner,
  txHash: string,
  confirmations: number = 1
): Promise<any> {
  // Implementation depends on the provider type
  // This is a simplified version
  return new Promise((resolve, reject) => {
    const checkTransaction = async () => {
      try {
        // @ts-ignore - simplified for demo
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.confirmations >= confirmations) {
          resolve(receipt);
        } else {
          setTimeout(checkTransaction, 1000);
        }
      } catch (error) {
        reject(error);
      }
    };
    checkTransaction();
  });
}