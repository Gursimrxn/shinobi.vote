// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMerkleAnchorRegistry
 * @notice Interface for the MerkleAnchorRegistry contract.
 * @dev Defines the external functions and events for Merkle root registration and verification.
 */
interface IMerkleAnchorRegistry {
    /**
     * @notice Emitted when a new Merkle root is registered.
     * @param user The address of the user who registered the root.
     * @param root The Merkle root that was registered.
     */
    event MerkleRootRegistered(address indexed user, bytes32 indexed root);

    /**
     * @notice Emitted when a Merkle root is removed from the registry.
     * @param user The address of the user who owned the root.
     * @param root The Merkle root that was removed.
     */
    event MerkleRootRemoved(address indexed user, bytes32 indexed root);

    /**
     * @notice Emitted during emergency actions.
     * @param admin The address of the admin who performed the action.
     * @param action The type of emergency action performed.
     */
    event EmergencyAction(address indexed admin, string action);

    /**
     * @notice Registers a new Merkle root for the calling user.
     * @param root The Merkle root to register.
     */
    function registerMerkleRoot(bytes32 root) external;

    /**
     * @notice Verifies a Merkle proof against a user's registered roots.
     * @param user The address of the user who registered the root.
     * @param proof The Merkle proof to verify.
     * @param leaf The leaf node to verify.
     * @return bool True if the proof is valid, false otherwise.
     */
    function verifyProof(
        address user,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool);

    /**
     * @notice Verifies a Merkle proof against a specific root.
     * @param root The Merkle root to verify against.
     * @param proof The Merkle proof to verify.
     * @param leaf The leaf node to verify.
     * @return bool True if the proof is valid, false otherwise.
     */
    function verifyProofWithRoot(
        bytes32 root,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool);

    /**
     * @notice Returns all active Merkle roots registered by a user.
     * @param user The address of the user.
     * @return bytes32[] Array of active Merkle roots.
     */
    function getRootsByUser(address user) external view returns (bytes32[] memory);

    /**
     * @notice Returns the owner of a specific Merkle root.
     * @param root The Merkle root to query.
     * @return address The owner of the root, or zero address if not found.
     */
    function getRootOwner(bytes32 root) external view returns (address);

    /**
     * @notice Checks if a Merkle root is registered and active.
     * @param root The Merkle root to check.
     * @return bool True if the root is registered and active.
     */
    function isRootRegistered(bytes32 root) external view returns (bool);

    /**
     * @notice Removes a Merkle root from the registry.
     * @param root The Merkle root to remove.
     */
    function removeRoot(bytes32 root) external;

    /**
     * @notice Returns the total number of active roots in the registry.
     * @return uint256 The total count of active roots.
     */
    function getTotalActiveRoots() external view returns (uint256);

    /**
     * @notice Returns the number of active roots for a specific user.
     * @param user The address of the user.
     * @return uint256 The count of active roots for the user.
     */
    function getUserRootCount(address user) external view returns (uint256);

    /**
     * @notice Batch register multiple Merkle roots for gas efficiency.
     * @param roots Array of Merkle roots to register.
     */
    function batchRegisterMerkleRoots(bytes32[] calldata roots) external;
}