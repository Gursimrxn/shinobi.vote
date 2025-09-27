// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PostAnchor
 * @notice Lightweight contract for anchoring social media posts on-chain without storing data
 * @dev Emits events only - no state storage for maximum gas efficiency
 * @author Shinobi Team
 * 
 * This contract provides immutable proof of content existence for decentralized social platforms.
 * Content is stored on Filecoin/IPFS, while only cryptographic hashes are recorded on-chain
 * through events for minimal gas costs and maximum scalability.
 */
contract PostAnchor {
    
    /**
     * @notice Emitted when a new post is anchored on-chain
     * @dev This event serves as the sole record of post anchoring - no state variables are used
     * @param author The wallet address of the post creator
     * @param cidHash The keccak256 hash of the Filecoin/IPFS CID
     * @param timestamp The block timestamp when the post was anchored
     * @param metaHash Optional hash for metadata (tags, category, JSON, etc.)
     */
    event PostAnchored(
        address indexed author,
        bytes32 indexed cidHash,
        uint256 timestamp,
        bytes32 metaHash
    );

    /**
     * @notice Anchors a post on-chain by emitting an event with content hash
     * @dev Extremely gas-efficient as it only emits an event without state changes
     * @param cidHash The keccak256 hash of the Filecoin/IPFS CID where content is stored
     * @param metaHash Optional hash for metadata (can be bytes32(0) if no metadata)
     * 
     * Requirements:
     * - cidHash must not be zero (empty content not allowed)
     * 
     * Gas usage: ~2,000-5,000 gas (event emission only)
     * 
     * Example usage:
     * ```
     * bytes32 contentHash = keccak256(abi.encodePacked("QmExampleCID123"));
     * bytes32 metaHash = keccak256(abi.encodePacked('{"tags":["crypto","defi"]}'));
     * postAnchor.anchorPost(contentHash, metaHash);
     * ```
     */
    function anchorPost(bytes32 cidHash, bytes32 metaHash) external {
        require(cidHash != bytes32(0), "PostAnchor: CID hash cannot be zero");
        
        emit PostAnchored(
            msg.sender,
            cidHash,
            block.timestamp,
            metaHash
        );
    }

    /**
     * @notice Returns the contract version for tracking deployments
     * @dev Pure function that doesn't read state - useful for deployment verification
     * @return version string indicating the contract version
     */
    function getVersion() external pure returns (string memory) {
        return "1.0.0";
    }

    /**
     * @notice Utility function to generate a hash from a CID string
     * @dev Helper function for frontend integration - converts CID to bytes32
     * @param cid The Filecoin/IPFS CID as a string
     * @return cidHash The keccak256 hash of the CID
     * 
     * Note: This is a view function to help with frontend integration.
     * In production, CID hashing should typically be done off-chain to save gas.
     */
    function hashCID(string calldata cid) external pure returns (bytes32) {
        require(bytes(cid).length > 0, "PostAnchor: CID cannot be empty");
        return keccak256(abi.encodePacked(cid));
    }

    /**
     * @notice Utility function to generate a hash from metadata JSON
     * @dev Helper function for frontend integration - converts metadata to bytes32
     * @param metadata The metadata as a JSON string
     * @return metaHash The keccak256 hash of the metadata
     * 
     * Note: This is a view function to help with frontend integration.
     * In production, metadata hashing should typically be done off-chain to save gas.
     */
    function hashMetadata(string calldata metadata) external pure returns (bytes32) {
        if (bytes(metadata).length == 0) {
            return bytes32(0);
        }
        return keccak256(abi.encodePacked(metadata));
    }
}