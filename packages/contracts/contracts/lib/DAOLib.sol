// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title DAOLib
 * @notice Library containing data structures and utilities for DAO operations
 */
library DAOLib {
    /**
     * @notice Struct containing membership proof data
     * @param points Groth16 proof points [a.x, a.y, b.x0, b.y0, b.x1, b.y1, c.x, c.y]
     * @param merkleTreeRoot The root of the membership tree used in the proof
     * @param nullifier The nullifier to prevent double voting
     * @param message The message being signed (e.g., vote option)
     * @param scope The scope of the proof (should match DAO's SCOPE)
     * @param merkleTreeDepth The depth of the merkle tree
     */
    struct MembershipProof {
        uint256 merkleTreeDepth;
        uint256 merkleTreeRoot;
        uint256 nullifier;
        uint256 message;
        uint256 scope;
        uint256[8] points;
    }

    /**
     * @notice Configuration for vote operations
     * @param merkleRootIndex Index of the merkle root to use from history
     */
    struct VoteConfig {
        uint32 merkleRootIndex;
    }

    /**
     * @notice Vote data combining proof and configuration
     * @param proof The membership proof
     * @param config The vote configuration
     */
    struct VoteData {
        MembershipProof proof;
        VoteConfig config;
    }

    /**
     * @notice Hashes a value using keccak256, right-shifted to fit SNARK scalar field
     * @param _value The value to hash
     * @return The hash of the value, compatible with SNARK scalar modulus
     */
    function _hash(uint256 _value) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_value))) >> 8;
    }

    /**
     * @notice Encodes vote data for paymaster operations
     * @param proposalId The proposal being voted on
     * @param optionIndex The vote option index
     * @param voteData The vote data including proof
     * @return Encoded data for paymaster validation
     */
    function encodeVoteData(
        uint256 proposalId,
        uint256 optionIndex,
        VoteData memory voteData
    ) internal pure returns (bytes memory) {
        return abi.encode(proposalId, optionIndex, voteData);
    }

    /**
     * @notice Decodes vote data from paymaster operations
     * @param data The encoded vote data
     * @return proposalId The proposal being voted on
     * @return optionIndex The vote option index
     * @return voteData The vote data including proof
     */
    function decodeVoteData(bytes memory data)
        internal
        pure
        returns (
            uint256 proposalId,
            uint256 optionIndex,
            VoteData memory voteData
        )
    {
        return abi.decode(data, (uint256, uint256, VoteData));
    }
}