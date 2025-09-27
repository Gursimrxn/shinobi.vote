// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IModeratorRegistry
 * @notice Interface for the ModeratorRegistry contract
 * @dev Defines the core functions and events for moderator and task management
 */
interface IModeratorRegistry {
    /// @notice Task status constants
    function STATUS_UNCLAIMED() external view returns (uint8);
    function STATUS_CLAIMED() external view returns (uint8);
    function STATUS_RESOLVED() external view returns (uint8);

    /// @notice Task struct
    struct Task {
        bytes32 id;
        address claimer;
        uint8 status;
        bytes32 attestationHash;
    }

    /// @notice Events
    event ModeratorOptedIn(address indexed moderator);
    event ModeratorOptedOut(address indexed moderator);
    event TaskClaimed(bytes32 indexed taskId, address indexed claimer);
    event TaskResolved(bytes32 indexed taskId, bytes32 indexed attestationHash);

    /// @notice Custom errors
    error NotAModerator();
    error TaskAlreadyClaimed();
    error TaskNotClaimed();
    error TaskAlreadyResolved();
    error InvalidTaskId();
    error UnauthorizedClaimer();

    /// @notice Moderator management functions
    function optInModerator() external;
    function optOutModerator() external;
    function isModerator(address account) external view returns (bool);

    /// @notice Task management functions
    function claimTask(bytes32 taskId) external;
    function resolveTask(bytes32 taskId, bytes32 attestationHash) external;
    function getTask(bytes32 taskId) external view returns (Task memory);
    function taskExists(bytes32 taskId) external view returns (bool);
    function tasks(bytes32 taskId) external view returns (bytes32 id, address claimer, uint8 status, bytes32 attestationHash);

    /// @notice Utility functions
    function getModeratorCount() external view returns (uint256);

    /// @notice Admin functions
    function removeModerator(address moderator) external;
    function resetTask(bytes32 taskId) external;
}