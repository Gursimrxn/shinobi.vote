import {
  ProposalCreated as ProposalCreatedEvent,
  VoteCast as VoteCastEvent,
  MemberAdded as MemberAddedEvent,
  ProposalExecuted as ProposalExecutedEvent
} from "../generated/DAO/DAO"
import {
  Proposal,
  ProposalOption,
  Vote,
  Member,
  DAOStats,
  DailyMetric,
  VotingActivity
} from "../generated/schema"
import { BigInt, Bytes, store } from "@graphprotocol/graph-ts"

// Helper function to get or create DAO stats
function getOrCreateDAOStats(): DAOStats {
  let stats = DAOStats.load("singleton")
  if (!stats) {
    stats = new DAOStats("singleton")
    stats.totalProposals = BigInt.fromI32(0)
    stats.totalVotes = BigInt.fromI32(0)
    stats.totalMembers = BigInt.fromI32(0)
    stats.activeProposals = BigInt.fromI32(0)
    stats.activeVoters = BigInt.fromI32(0)
    stats.lastUpdated = BigInt.fromI32(0)
  }
  return stats
}

// Helper function to get or create daily metrics
function getOrCreateDailyMetric(timestamp: BigInt): DailyMetric {
  let dayTimestamp = timestamp.div(BigInt.fromI32(86400)).times(BigInt.fromI32(86400))
  let date = new Date(dayTimestamp.toI32() * 1000).toISOString().split('T')[0]
  let id = date
  
  let metric = DailyMetric.load(id)
  if (!metric) {
    metric = new DailyMetric(id)
    metric.date = date
    metric.proposalsCreated = BigInt.fromI32(0)
    metric.dailyVotes = BigInt.fromI32(0)
    metric.membersJoined = BigInt.fromI32(0)
    metric.activeProposals = BigInt.fromI32(0)
  }
  return metric
}

// Helper function to get or create hourly voting activity
function getOrCreateVotingActivity(timestamp: BigInt, proposalId: BigInt): VotingActivity {
  let id = timestamp.toString() + "-" + proposalId.toString()
  
  let activity = VotingActivity.load(id)
  if (!activity) {
    activity = new VotingActivity(id)
    activity.hour = timestamp.div(BigInt.fromI32(3600)).times(BigInt.fromI32(3600))
    activity.votes = BigInt.fromI32(0)
    activity.uniqueProposals = BigInt.fromI32(0)
    activity.proposalId = proposalId
    activity.timestamp = timestamp
  }
  return activity
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let proposal = new Proposal(event.params.proposalId.toString())
  
  proposal.proposalId = event.params.proposalId
  proposal.title = event.params.title
  proposal.description = event.params.description
  proposal.startTime = event.params.startTime
  proposal.endTime = event.params.endTime
  proposal.executed = false
  proposal.totalVotes = BigInt.fromI32(0)
  proposal.createdAt = event.block.timestamp
  proposal.status = "ACTIVE"
  
  // Get or create proposer
  let proposer = Member.load(event.params.proposer.toHex())
  if (!proposer) {
    proposer = new Member(event.params.proposer.toHex())
    proposer.address = event.params.proposer
    proposer.identityCommitment = BigInt.fromI32(0) // Will be set when member joins
    proposer.joinedAt = event.block.timestamp
    proposer.votesCount = BigInt.fromI32(0)
  }
  proposer.save()
  
  proposal.proposer = proposer.id
  proposal.save()
  
  // Create proposal options
  let options = event.params.options
  for (let i = 0; i < options.length; i++) {
    let optionId = event.params.proposalId.toString() + "-" + i.toString()
    let option = new ProposalOption(optionId)
    option.proposal = proposal.id
    option.index = BigInt.fromI32(i)
    option.text = options[i]
    option.voteCount = BigInt.fromI32(0)
    option.save()
  }
  
  // Update stats
  let stats = getOrCreateDAOStats()
  stats.totalProposals = stats.totalProposals.plus(BigInt.fromI32(1))
  stats.activeProposals = stats.activeProposals.plus(BigInt.fromI32(1))
  stats.lastUpdated = event.block.timestamp
  stats.save()
  
  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  dailyMetric.proposalsCreated = dailyMetric.proposalsCreated.plus(BigInt.fromI32(1))
  dailyMetric.activeProposals = dailyMetric.activeProposals.plus(BigInt.fromI32(1))
  dailyMetric.save()
}

export function handleVoteCast(event: VoteCastEvent): void {
  let vote = new Vote(event.params.nullifierHash.toString())
  
  vote.proposal = event.params.proposalId.toString()
  vote.optionIndex = event.params.optionIndex
  vote.nullifierHash = event.params.nullifierHash
  vote.timestamp = event.block.timestamp
  vote.blockNumber = event.block.number
  vote.save()
  
  // Update proposal vote count
  let proposal = Proposal.load(event.params.proposalId.toString())
  if (proposal) {
    proposal.totalVotes = proposal.totalVotes.plus(BigInt.fromI32(1))
    
    // Check if proposal has ended
    if (event.block.timestamp.gt(proposal.endTime)) {
      proposal.status = "ENDED"
    }
    
    proposal.save()
  }
  
  // Update proposal option vote count
  let optionId = event.params.proposalId.toString() + "-" + event.params.optionIndex.toString()
  let option = ProposalOption.load(optionId)
  if (option) {
    option.voteCount = option.voteCount.plus(BigInt.fromI32(1))
    option.save()
  }
  
  // Update stats
  let stats = getOrCreateDAOStats()
  stats.totalVotes = stats.totalVotes.plus(BigInt.fromI32(1))
  stats.lastUpdated = event.block.timestamp
  stats.save()
  
  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  dailyMetric.dailyVotes = dailyMetric.dailyVotes.plus(BigInt.fromI32(1))
  dailyMetric.save()
  
  // Update hourly voting activity
  let votingActivity = getOrCreateVotingActivity(event.block.timestamp, event.params.proposalId)
  votingActivity.votes = votingActivity.votes.plus(BigInt.fromI32(1))
  votingActivity.save()
}

export function handleMemberAdded(event: MemberAddedEvent): void {
  let member = Member.load(event.params.member.toHex())
  if (!member) {
    member = new Member(event.params.member.toHex())
    member.address = event.params.member
    member.joinedAt = event.block.timestamp
    member.votesCount = BigInt.fromI32(0)
  }
  
  member.identityCommitment = event.params.identityCommitment
  member.save()
  
  // Update stats
  let stats = getOrCreateDAOStats()
  stats.totalMembers = stats.totalMembers.plus(BigInt.fromI32(1))
  stats.lastUpdated = event.block.timestamp
  stats.save()
  
  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  dailyMetric.membersJoined = dailyMetric.membersJoined.plus(BigInt.fromI32(1))
  dailyMetric.save()
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let proposal = Proposal.load(event.params.proposalId.toString())
  if (proposal) {
    proposal.executed = true
    proposal.executedAt = event.block.timestamp
    proposal.status = "EXECUTED"
    proposal.save()
  }
  
  // Update stats
  let stats = getOrCreateDAOStats()
  stats.activeProposals = stats.activeProposals.minus(BigInt.fromI32(1))
  stats.lastUpdated = event.block.timestamp
  stats.save()
  
  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  dailyMetric.activeProposals = dailyMetric.activeProposals.minus(BigInt.fromI32(1))
  dailyMetric.save()
}