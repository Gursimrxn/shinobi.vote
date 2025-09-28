import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { handleProposalCreated, handleVoteCast, handleMemberAdded } from "../src/dao"
import { createProposalCreatedEvent, createVoteCastEvent, createMemberAddedEvent } from "./utils"

describe("ShinobiDAO", () => {
  beforeAll(() => {
    // Setup code here
  })

  afterAll(() => {
    clearStore()
  })

  test("ProposalCreated event creates proposal entity", () => {
    let proposalId = BigInt.fromI32(1)
    let title = "Test Proposal"
    let description = "Test Description"
    let options = ["Yes", "No"]
    let startTime = BigInt.fromI32(1000)
    let endTime = BigInt.fromI32(2000)
    let proposer = Address.fromString("0x1234567890123456789012345678901234567890")

    let proposalCreatedEvent = createProposalCreatedEvent(
      proposalId,
      title,
      description,
      options,
      startTime,
      endTime,
      proposer
    )

    handleProposalCreated(proposalCreatedEvent)

    assert.entityCount("Proposal", 1)
    assert.fieldEquals("Proposal", "1", "title", "Test Proposal")
    assert.fieldEquals("Proposal", "1", "description", "Test Description")
    assert.fieldEquals("Proposal", "1", "executed", "false")
    assert.fieldEquals("Proposal", "1", "status", "ACTIVE")
  })

  test("VoteCast event creates vote entity and updates proposal", () => {
    // First create a proposal
    let proposalId = BigInt.fromI32(1)
    let title = "Test Proposal"
    let description = "Test Description"
    let options = ["Yes", "No"]
    let startTime = BigInt.fromI32(1000)
    let endTime = BigInt.fromI32(2000)
    let proposer = Address.fromString("0x1234567890123456789012345678901234567890")

    let proposalCreatedEvent = createProposalCreatedEvent(
      proposalId,
      title,
      description,
      options,
      startTime,
      endTime,
      proposer
    )
    handleProposalCreated(proposalCreatedEvent)

    // Now cast a vote
    let optionIndex = BigInt.fromI32(0)
    let nullifierHash = BigInt.fromI32(12345)

    let voteCastEvent = createVoteCastEvent(proposalId, optionIndex, nullifierHash)
    handleVoteCast(voteCastEvent)

    assert.entityCount("Vote", 1)
    assert.fieldEquals("Vote", "12345", "optionIndex", "0")
    assert.fieldEquals("Proposal", "1", "totalVotes", "1")
  })

  test("MemberAdded event creates member entity", () => {
    let memberAddress = Address.fromString("0x1234567890123456789012345678901234567890")
    let identityCommitment = BigInt.fromI32(67890)

    let memberAddedEvent = createMemberAddedEvent(memberAddress, identityCommitment)
    handleMemberAdded(memberAddedEvent)

    assert.entityCount("Member", 1)
    assert.fieldEquals(
      "Member",
      "0x1234567890123456789012345678901234567890",
      "identityCommitment",
      "67890"
    )
  })
})