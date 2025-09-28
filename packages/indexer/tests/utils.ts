import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  ProposalCreated,
  VoteCast,
  MemberAdded,
  ProposalExecuted
} from "../generated/ShinobiDAO/ShinobiDAO"

export function createProposalCreatedEvent(
  proposalId: BigInt,
  title: string,
  description: string,
  options: Array<string>,
  startTime: BigInt,
  endTime: BigInt,
  proposer: Address
): ProposalCreated {
  let proposalCreatedEvent = changetype<ProposalCreated>(newMockEvent())

  proposalCreatedEvent.parameters = new Array()

  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("description", ethereum.Value.fromString(description))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("options", ethereum.Value.fromStringArray(options))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("startTime", ethereum.Value.fromUnsignedBigInt(startTime))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("endTime", ethereum.Value.fromUnsignedBigInt(endTime))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("proposer", ethereum.Value.fromAddress(proposer))
  )

  return proposalCreatedEvent
}

export function createVoteCastEvent(
  proposalId: BigInt,
  optionIndex: BigInt,
  nullifierHash: BigInt
): VoteCast {
  let voteCastEvent = changetype<VoteCast>(newMockEvent())

  voteCastEvent.parameters = new Array()

  voteCastEvent.parameters.push(
    new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("optionIndex", ethereum.Value.fromUnsignedBigInt(optionIndex))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("nullifierHash", ethereum.Value.fromUnsignedBigInt(nullifierHash))
  )

  return voteCastEvent
}

export function createMemberAddedEvent(
  member: Address,
  identityCommitment: BigInt
): MemberAdded {
  let memberAddedEvent = changetype<MemberAdded>(newMockEvent())

  memberAddedEvent.parameters = new Array()

  memberAddedEvent.parameters.push(
    new ethereum.EventParam("member", ethereum.Value.fromAddress(member))
  )
  memberAddedEvent.parameters.push(
    new ethereum.EventParam("identityCommitment", ethereum.Value.fromUnsignedBigInt(identityCommitment))
  )

  return memberAddedEvent
}

export function createProposalExecutedEvent(proposalId: BigInt): ProposalExecuted {
  let proposalExecutedEvent = changetype<ProposalExecuted>(newMockEvent())

  proposalExecutedEvent.parameters = new Array()

  proposalExecutedEvent.parameters.push(
    new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId))
  )

  return proposalExecutedEvent
}