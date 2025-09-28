import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { Contract, ContractRunner } from 'ethers';
import { generateSemaphoreProof, formatProof } from './utils';
import { SemaphoreProof } from './types';

export class SemaphoreManager {
  private contract: Contract;
  private provider: ContractRunner;
  private groups: Map<number, Group> = new Map();

  constructor(contractAddress: string, provider: ContractRunner, abi: any[]) {
    this.provider = provider;
    this.contract = new Contract(contractAddress, abi, provider);
  }

  /**
   * Create a new identity for a user
   */
  createIdentity(privateKey?: string): Identity {
    return new Identity(privateKey);
  }

  /**
   * Get the identity commitment for an identity
   */
  getIdentityCommitment(identity: Identity): bigint {
    return identity.commitment;
  }

  /**
   * Add a member to a Semaphore group
   */
  async addMember(groupId: number, identityCommitment: bigint): Promise<void> {
    const tx = await this.contract.addMember(groupId, identityCommitment);
    await tx.wait();
    
    // Update local group if we have it
    if (this.groups.has(groupId)) {
      this.groups.get(groupId)!.addMember(identityCommitment);
    }
  }

  /**
   * Create a local group for proof generation
   */
  createGroup(groupId: number, members: bigint[] = []): Group {
    const group = new Group(groupId, 20, members); // groupId, depth, members
    this.groups.set(groupId, group);
    return group;
  }

  /**
   * Add member to local group
   */
  addMemberToGroup(groupId: number, identityCommitment: bigint): void {
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new Group(groupId, 20)); // groupId, depth
    }
    this.groups.get(groupId)!.addMember(identityCommitment);
  }

  /**
   * Get a group for proof generation
   */
  getGroup(groupId: number): Group | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Generate a Semaphore proof for voting
   */
  async generateProof(
    identity: Identity,
    groupId: number,
    message: bigint,
    scope: bigint
  ): Promise<SemaphoreProof> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found. Create the group first.`);
    }

    return await generateSemaphoreProof(identity, group, message, scope);
  }

  /**
   * Validate a proof on-chain
   */
  async validateProof(groupId: number, proof: SemaphoreProof): Promise<boolean> {
    try {
      const formattedProof = formatProof(proof);
      const isValid = await this.contract.verifyProof(groupId, formattedProof);
      return isValid;
    } catch (error) {
      console.error('Proof validation failed:', error);
      return false;
    }
  }

  /**
   * Get all members of a group (if available)
   */
  getGroupMembers(groupId: number): bigint[] {
    const group = this.groups.get(groupId);
    return group ? group.members.map(member => BigInt(member)) : [];
  }

  /**
   * Check if an identity is a member of a group
   */
  isMember(groupId: number, identityCommitment: bigint): boolean {
    const group = this.groups.get(groupId);
    return group ? group.members.some(member => BigInt(member) === identityCommitment) : false;
  }

  /**
   * Get the size of a group
   */
  getGroupSize(groupId: number): number {
    const group = this.groups.get(groupId);
    return group ? group.members.length : 0;
  }

  /**
   * Create a poll for voting
   */
  async createPoll(
    groupId: number,
    merkleTreeDepth: number,
    encryptionKey: number[],
    duration: number
  ): Promise<number> {
    const tx = await this.contract.createPoll(
      groupId,
      merkleTreeDepth,
      encryptionKey,
      duration
    );
    const receipt = await tx.wait();
    
    // Extract poll ID from events
    const event = receipt.events?.find((e: any) => e.event === 'PollCreated');
    return event?.args?.pollId || 0;
  }

  /**
   * Cast a vote in a poll
   */
  async castVote(pollId: number, proof: SemaphoreProof): Promise<void> {
    const formattedProof = formatProof(proof);
    const tx = await this.contract.castVote(pollId, formattedProof);
    await tx.wait();
  }

  /**
   * Get poll information
   */
  async getPoll(pollId: number): Promise<any> {
    return await this.contract.getPoll(pollId);
  }

  /**
   * Get votes for a poll
   */
  async getPollVotes(pollId: number): Promise<bigint[]> {
    return await this.contract.getPollVotes(pollId);
  }

  /**
   * Check if a poll is active
   */
  async isPollActive(pollId: number): Promise<boolean> {
    return await this.contract.isPollActive(pollId);
  }
}