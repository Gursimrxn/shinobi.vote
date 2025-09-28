import { Contract, ContractRunner } from 'ethers';
import { Identity } from '@semaphore-protocol/identity';
import { SemaphoreManager } from './semaphore';
import { 
  Proposal, 
  CreateProposalParams, 
  VoteParams, 
  ContractAddresses, 
  DAOMember,
  VoteEvent,
  ProposalCreatedEvent
} from './types';
import { 
  generateSemaphoreProof, 
  formatProof, 
  isProposalActive, 
  getTimeRemaining,
  calculateVotePercentages,
  getWinningOption
} from './utils';

export class DAO {
  private contract: Contract;
  private provider: ContractRunner;
  private semaphoreManager: SemaphoreManager;
  private addresses: ContractAddresses;
  private groupId: number;

  constructor(
    addresses: ContractAddresses,
    provider: ContractRunner,
    abi: any[],
    groupId: number = 1
  ) {
    this.addresses = addresses;
    this.provider = provider;
    this.groupId = groupId;
    this.contract = new Contract(addresses.shinobiDAO, abi, provider);
    this.semaphoreManager = new SemaphoreManager(addresses.semaphore, provider, []);
  }

  /**
   * Initialize the DAO group for proof generation
   */
  async initializeGroup(members: bigint[] = []): Promise<void> {
    this.semaphoreManager.createGroup(this.groupId, members);
  }

  /**
   * Create a new identity for a user
   */
  createIdentity(privateKey?: string): Identity {
    return this.semaphoreManager.createIdentity(privateKey);
  }

  /**
   * Join the DAO as a member
   */
  async joinDAO(identity: Identity): Promise<void> {
    const identityCommitment = this.semaphoreManager.getIdentityCommitment(identity);
    const tx = await this.contract.joinDAO(identityCommitment);
    await tx.wait();
    
    // Add to local group for proof generation
    this.semaphoreManager.addMemberToGroup(this.groupId, identityCommitment);
  }

  /**
   * Check if an address is a DAO member
   */
  async isMember(address: string): Promise<boolean> {
    return await this.contract.isMember(address);
  }

  /**
   * Create a new proposal
   */
  async createProposal(params: CreateProposalParams): Promise<number> {
    const { title, description, options, duration } = params;
    
    const tx = await this.contract.createProposal(
      title,
      description,
      options,
      duration
    );
    const receipt = await tx.wait();
    
    // Extract proposal ID from events
    const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
    return event?.args?.proposalId?.toNumber() || 0;
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: number): Promise<Proposal> {
    const [
      id,
      title,
      description,
      startTime,
      endTime,
      executed,
      proposer,
      totalVotes,
      optionCount
    ] = await this.contract.getProposal(proposalId);

    const options = await this.contract.getProposalOptions(proposalId);
    const votes = await this.contract.getProposalVotes(proposalId);

    return {
      id: id.toNumber(),
      title,
      description,
      startTime: startTime.toNumber(),
      endTime: endTime.toNumber(),
      executed,
      proposer,
      totalVotes: totalVotes.toNumber(),
      optionCount: optionCount.toNumber(),
      options,
      votes: votes.map((v: any) => v.toNumber())
    };
  }

  /**
   * Get all active proposals
   */
  async getActiveProposals(): Promise<number[]> {
    const activeProposalIds = await this.contract.getActiveProposals();
    return activeProposalIds.map((id: any) => id.toNumber());
  }

  /**
   * Get all proposals (active and inactive)
   */
  async getAllProposals(): Promise<Proposal[]> {
    const proposalCount = await this.contract.proposalCount();
    const proposals: Proposal[] = [];

    for (let i = 0; i < proposalCount.toNumber(); i++) {
      try {
        const proposal = await this.getProposal(i);
        proposals.push(proposal);
      } catch (error) {
        console.warn(`Failed to fetch proposal ${i}:`, error);
      }
    }

    return proposals;
  }

  /**
   * Vote on a proposal anonymously
   */
  async vote(params: VoteParams): Promise<void> {
    const { proposalId, optionIndex, identity } = params;
    
    // Generate Semaphore proof
    const message = BigInt(optionIndex);
    const scope = BigInt(proposalId);
    
    const proof = await this.semaphoreManager.generateProof(
      identity,
      this.groupId,
      message,
      scope
    );

    // Submit vote
    const formattedProof = formatProof(proof);
    const tx = await this.contract.vote(proposalId, optionIndex, formattedProof);
    await tx.wait();
  }

  /**
   * Check if a nullifier has been used (i.e., if someone has voted)
   */
  async hasVoted(nullifierHash: string): Promise<boolean> {
    return await this.contract.hasVoted(nullifierHash);
  }

  /**
   * Execute a proposal (typically called after voting period ends)
   */
  async executeProposal(proposalId: number): Promise<void> {
    const tx = await this.contract.executeProposal(proposalId);
    await tx.wait();
  }

  /**
   * Get proposal vote percentages
   */
  async getProposalVotePercentages(proposalId: number): Promise<number[]> {
    const proposal = await this.getProposal(proposalId);
    return calculateVotePercentages(proposal.votes);
  }

  /**
   * Get the winning option for a proposal
   */
  async getWinningOption(proposalId: number): Promise<number> {
    const proposal = await this.getProposal(proposalId);
    return getWinningOption(proposal.votes);
  }

  /**
   * Check if a proposal is currently active
   */
  async isProposalActive(proposalId: number): Promise<boolean> {
    const proposal = await this.getProposal(proposalId);
    return isProposalActive(proposal.startTime, proposal.endTime);
  }

  /**
   * Get time remaining for a proposal
   */
  async getTimeRemaining(proposalId: number): Promise<number> {
    const proposal = await this.getProposal(proposalId);
    return getTimeRemaining(proposal.endTime);
  }

  /**
   * Listen to proposal created events
   */
  onProposalCreated(callback: (event: ProposalCreatedEvent) => void): void {
    this.contract.on('ProposalCreated', (
      proposalId,
      title,
      description,
      options,
      startTime,
      endTime,
      proposer
    ) => {
      callback({
        proposalId: proposalId.toNumber(),
        title,
        description,
        options,
        startTime: startTime.toNumber(),
        endTime: endTime.toNumber(),
        proposer
      });
    });
  }

  /**
   * Listen to vote cast events
   */
  onVoteCast(callback: (event: VoteEvent) => void): void {
    this.contract.on('VoteCast', (proposalId, optionIndex, nullifierHash) => {
      callback({
        proposalId: proposalId.toNumber(),
        optionIndex: optionIndex.toNumber(),
        nullifierHash,
        timestamp: Math.floor(Date.now() / 1000)
      });
    });
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }

  /**
   * Get contract addresses
   */
  getAddresses(): ContractAddresses {
    return this.addresses;
  }

  /**
   * Get the Semaphore manager instance
   */
  getSemaphoreManager(): SemaphoreManager {
    return this.semaphoreManager;
  }

  /**
   * Get the group ID used for this DAO
   */
  getGroupId(): number {
    return this.groupId;
  }

  /**
   * Add a member to the local group (for proof generation)
   * This should be called when you know a new member has joined
   */
  addMemberToGroup(identityCommitment: bigint): void {
    this.semaphoreManager.addMemberToGroup(this.groupId, identityCommitment);
  }

  /**
   * Get current group size
   */
  getGroupSize(): number {
    return this.semaphoreManager.getGroupSize(this.groupId);
  }

  /**
   * Static method to create a new DAO instance
   */
  static create(
    addresses: ContractAddresses,
    provider: ContractRunner,
    abi: any[],
    groupId: number = 1
  ): DAO {
    return new DAO(addresses, provider, abi, groupId);
  }
}