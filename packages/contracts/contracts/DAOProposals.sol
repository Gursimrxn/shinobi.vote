// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./interfaces/IDAO.sol";
import "./DAOMembership.sol";

abstract contract DAOProposals is DAOMembership {
    // Struct definition is in IDAO.sol

    // The key state variable storage
    mapping(uint256 => IDAO.Proposal) internal proposals;
    mapping(uint256 => mapping(uint256 => string)) internal proposalOptions; // proposalId => optionIndex => option

    uint256 public proposalCount;
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_VOTING_DURATION = 1 hours;

    modifier validProposal(uint256 proposalId) {
        require(proposalId < proposalCount, "DAO: Invalid proposal");
        _;
    }

    constructor(
        address _membershipVerifier
    ) DAOMembership(_membershipVerifier) {}

    /**
     * @notice Creates a new voting proposal.
     * @param title The title of the proposal.
     * @param description The full description.
     * @param options The list of voting options.
     * @param duration The length of the voting period.
     */
    function createProposal(
        string calldata title,
        string calldata description,
        string[] calldata options,
        uint256 duration
    ) external override onlyMember {
        require(options.length >= 2, "DAO: Need at least 2 options");
        require(options.length <= 10, "DAO: Too many options");
        require(duration >= MIN_VOTING_DURATION, "DAO: Duration too short");
        require(bytes(title).length > 0, "DAO: Empty title");
        require(bytes(description).length > 0, "DAO: Empty description");

        uint256 proposalId = proposalCount++;
        IDAO.Proposal storage proposal = proposals[proposalId];

        proposal.id = proposalId;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + duration;
        proposal.proposer = msg.sender;
        proposal.executed = false;
        proposal.totalVotes = 0;
        proposal.optionCount = options.length;

        // Store options separately
        for (uint256 i = 0; i < options.length; i++) {
            proposalOptions[proposalId][i] = options[i];
        }

        emit ProposalCreated(
            proposalId,
            title,
            description,
            options,
            proposal.startTime,
            proposal.endTime,
            msg.sender
        );
    }

    /**
     * @notice Executes a proposal after the voting period has ended.
     * @param proposalId The ID of the proposal to execute.
     */
    function executeProposal(
        uint256 proposalId
    ) external override validProposal(proposalId) {
        IDAO.Proposal storage proposal = proposals[proposalId];

        require(block.timestamp > proposal.endTime, "DAO: Voting still active");
        require(!proposal.executed, "DAO: Already executed");

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    // --- View Functions ---

    function getProposal(
        uint256 proposalId
    )
        public
        view
        override
        validProposal(proposalId)
        returns (IDAO.Proposal memory)
    {
        return proposals[proposalId];
    }

    function getProposalOptions(
        uint256 proposalId
    ) public view override validProposal(proposalId) returns (string[] memory) {
        IDAO.Proposal storage proposal = proposals[proposalId];
        string[] memory options = new string[](proposal.optionCount);

        for (uint256 i = 0; i < proposal.optionCount; i++) {
            options[i] = proposalOptions[proposalId][i];
        }

        return options;
    }

    function getActiveProposals()
        public
        view
        override
        returns (uint256[] memory)
    {
        uint256[] memory tempActiveProposals = new uint256[](proposalCount);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < proposalCount; i++) {
            if (
                block.timestamp >= proposals[i].startTime &&
                block.timestamp <= proposals[i].endTime &&
                !proposals[i].executed
            ) {
                tempActiveProposals[activeCount] = i;
                activeCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = tempActiveProposals[i];
        }

        return result;
    }
}
