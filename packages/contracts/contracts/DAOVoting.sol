// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DAOProposals.sol";
import "./lib/DAOLib.sol";

abstract contract DAOVoting is DAOProposals, ReentrancyGuard {
    // Storage for vote counts (must be separate from the struct definition in IDAO for mapping)
    mapping(uint256 => mapping(uint256 => uint256)) internal proposalVotes; // proposalId => optionIndex => voteCount
    mapping(uint256 => bool) public nullifierHashes; // prevent double voting

    constructor(
        address _membershipVerifier
    ) DAOProposals(_membershipVerifier) {}

    /**
     * @notice Verifies a membership proof and registers a vote.
     * @param proposalId The ID of the proposal being voted on.
     * @param optionIndex The index of the option being voted for.
     * @param voteData The vote data containing membership proof and configuration.
     */
    function vote(
        uint256 proposalId,
        uint256 optionIndex,
        DAOLib.VoteData calldata voteData
    ) external override validProposal(proposalId) nonReentrant {
        IDAO.Proposal storage proposal = proposals[proposalId];

        require(
            block.timestamp >= proposal.startTime,
            "DAO: Voting not started"
        );
        require(block.timestamp <= proposal.endTime, "DAO: Voting ended");
        require(optionIndex < proposal.optionCount, "DAO: Invalid option");
        require(
            !nullifierHashes[voteData.proof.nullifier],
            "DAO: Already voted"
        );

        // Note: Message validation removed - message should be userOpHash or hash(proposalId, optionIndex, userOpHash)
        // This prevents replay attacks while allowing flexibility in proof generation
        require(
            voteData.proof.scope == SCOPE,
            "DAO: Invalid DAO scope in proof"
        );

        // Check if the merkle root is from our history
        uint256 expectedRoot = membershipRoots[voteData.config.merkleRootIndex];
        require(
            voteData.proof.merkleTreeRoot == expectedRoot && expectedRoot != 0,
            "DAO: Unknown membership root"
        );

        // Validate tree depth
        require(
            voteData.proof.merkleTreeDepth >= MIN_TREE_DEPTH &&
                voteData.proof.merkleTreeDepth <= MAX_TREE_DEPTH,
            "DAO: Invalid tree depth"
        );

        // Verify membership proof using our verifier
        if (!_validateProof(voteData.proof)) {
            revert ProofVerificationFailed();
        }

        // Record vote
        nullifierHashes[voteData.proof.nullifier] = true;
        proposalVotes[proposalId][optionIndex]++;
        proposal.totalVotes++;

        emit VoteCast(proposalId, optionIndex, voteData.proof.nullifier);
    }

    /**
     * @notice Internal proof validation using the Semaphore verifier contract
     * @param proof The membership proof data
     * @return True if the proof is valid, false otherwise
     */
    function _validateProof(
        DAOLib.MembershipProof memory proof
    ) internal view returns (bool) {
        // Call the external verifier contract to verify the proof using exact same format as prepaid-gas-paymaster
        return
            MEMBERSHIP_VERIFIER.verifyProof(
                [proof.points[0], proof.points[1]],
                [
                    [proof.points[2], proof.points[3]],
                    [proof.points[4], proof.points[5]]
                ],
                [proof.points[6], proof.points[7]],
                [
                    proof.merkleTreeRoot,
                    proof.nullifier,
                    DAOLib._hash(proof.message),
                    DAOLib._hash(proof.scope)
                ],
                proof.merkleTreeDepth
            );
    }

    // --- View Functions ---

    function getProposalVotes(
        uint256 proposalId
    )
        public
        view
        override
        validProposal(proposalId)
        returns (uint256[] memory)
    {
        IDAO.Proposal storage proposal = proposals[proposalId];
        uint256[] memory votes = new uint256[](proposal.optionCount);

        for (uint256 i = 0; i < proposal.optionCount; i++) {
            votes[i] = proposalVotes[proposalId][i];
        }

        return votes;
    }

    /**
     * @notice Checks if a nullifier hash has already been used (prevents double voting).
     * @param nullifierHash The nullifier hash to check.
     * @return True if the nullifier has been used, false otherwise.
     */
    function hasVoted(
        uint256 nullifierHash
    ) public view override returns (bool) {
        return nullifierHashes[nullifierHash];
    }
}
