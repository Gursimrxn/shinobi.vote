// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "../lib/DAOLib.sol";

interface IDAO {
    // --- Structs ---
    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        address proposer;
        // Mapping (optionIndex => voteCount) is internal and will be in the main contract storage
        uint256 totalVotes;
        uint256 optionCount;
    }

    // --- Events ---
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        string description,
        string[] options,
        uint256 startTime,
        uint256 endTime,
        address proposer
    );

    event VoteCast(
        uint256 indexed proposalId,
        uint256 optionIndex,
        uint256 nullifierHash
    );

    event MemberAdded(address indexed member, uint256 identityCommitment);
    event ProposalExecuted(uint256 indexed proposalId);

    // --- External Functions ---
    function joinDAO(uint256 identityCommitment) external;

    function createProposal(
        string calldata title,
        string calldata description,
        string[] calldata options,
        uint256 duration
    ) external;

    function vote(
        uint256 proposalId,
        uint256 optionIndex,
        DAOLib.VoteData calldata voteData
    ) external;

    function executeProposal(uint256 proposalId) external;

    // --- View Functions (Simplified to return the struct components) ---
    function getProposal(
        uint256 proposalId
    ) external view returns (Proposal memory);

    function getProposalOptions(
        uint256 proposalId
    ) external view returns (string[] memory);

    function getProposalVotes(
        uint256 proposalId
    ) external view returns (uint256[] memory);

    function getActiveProposals() external view returns (uint256[] memory);

    function isMember(address account) external view returns (bool);
    function hasVoted(uint256 nullifierHash) external view returns (bool);
}
