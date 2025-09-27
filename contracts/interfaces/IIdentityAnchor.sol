// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIdentityAnchor
 * @notice Interface for the IdentityAnchor contract functionality.
 * @dev Defines the core functions for identity commitment management.
 */
interface IIdentityAnchor {
    /// @notice Emitted when a new identity commitment is registered on-chain.
    event IdentityRegistered(address indexed user, bytes32 indexed commitment, uint256 timestamp);

    /// @notice Emitted when an existing identity commitment is updated.
    event IdentityUpdated(address indexed user, bytes32 indexed oldCommitment, bytes32 indexed newCommitment, uint256 timestamp);

    /**
     * @notice Registers a fresh identity commitment for the caller.
     * @param commitment The 32-byte identity commitment derived off-chain.
     */
    function registerIdentity(bytes32 commitment) external;

    /**
     * @notice Registers an identity commitment on behalf of a specific user.
     * @param user The wallet that will own the new commitment.
     * @param commitment The 32-byte identity commitment to anchor for the user.
     */
    function registerIdentityFor(address user, bytes32 commitment) external;

    /**
     * @notice Updates the caller's identity commitment to a new value.
     * @param newCommitment The replacement 32-byte commitment for the caller.
     */
    function updateIdentity(bytes32 newCommitment) external;

    /**
     * @notice Retrieves the currently anchored identity commitment for a wallet.
     * @param user The wallet address being queried.
     * @return commitment The 32-byte commitment associated with the user or zero if none is registered.
     */
    function getIdentity(address user) external view returns (bytes32 commitment);

    /**
     * @notice Checks if the provided commitment has been registered by any account.
     * @param commitment The commitment hash to examine.
     * @return isRegistered True if the commitment has ever been anchored on-chain.
     */
    function isCommitmentRegistered(bytes32 commitment) external view returns (bool isRegistered);

    /**
     * @notice Helper to determine whether a wallet already has an identity commitment.
     * @param user The wallet address to query.
     * @return hasIdentity True if the user has a non-zero commitment anchored.
     */
    function hasIdentity(address user) external view returns (bool hasIdentity);
}