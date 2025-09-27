// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title ModeratorRegistry
 * @notice Manages moderators and task attestations for GhostApp
 * @dev Allows moderators to opt-in, claim tasks, and resolve tasks with attestation hashes
 */
contract ModeratorRegistry is AccessControl {
    /// @notice Task status enumeration
    uint8 public constant STATUS_UNCLAIMED = 0;
    uint8 public constant STATUS_CLAIMED = 1;
    uint8 public constant STATUS_RESOLVED = 2;

    /// @notice Task struct for minimal on-chain storage
    struct Task {
        bytes32 id;
        address claimer;
        uint8 status;
        bytes32 attestationHash;
    }

    /// @notice Mapping to track moderator status
    mapping(address => bool) public isModerator;

    /// @notice Mapping of task ID to task details
    mapping(bytes32 => Task) public tasks;

    /// @notice Events
    event ModeratorOptedIn(address indexed moderator);
    event ModeratorOptedOut(address indexed moderator);
    event TaskClaimed(bytes32 indexed taskId, address indexed claimer);
    event TaskResolved(bytes32 indexed taskId, bytes32 indexed attestationHash);

    /// @notice Custom error for unauthorized access
    error NotAModerator();
    error TaskAlreadyClaimed();
    error TaskNotClaimed();
    error TaskAlreadyResolved();
    error InvalidTaskId();
    error UnauthorizedClaimer();

    /// @notice Modifier to restrict access to moderators only
    modifier onlyModerator() {
        if (!isModerator[_msgSender()]) {
            revert NotAModerator();
        }
        _;
    }

    /**
     * @notice Constructor sets deployer as default admin
     * @dev DEFAULT_ADMIN_ROLE can be used for emergency functions if needed
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @notice Allows an address to opt-in as a moderator
     * @dev Self-registration mechanism for decentralized moderation
     */
    function optInModerator() external {
        address sender = _msgSender();
        isModerator[sender] = true;
        emit ModeratorOptedIn(sender);
    }

    /**
     * @notice Allows a moderator to opt-out
     * @dev Removes moderator privileges from the caller
     */
    function optOutModerator() external {
        address sender = _msgSender();
        isModerator[sender] = false;
        emit ModeratorOptedOut(sender);
    }

    /**
     * @notice Allows a moderator to claim a task
     * @param taskId The unique identifier for the task
     * @dev Creates a new task entry if it doesn't exist, or claims an unclaimed task
     */
    function claimTask(bytes32 taskId) external onlyModerator {
        if (taskId == bytes32(0)) {
            revert InvalidTaskId();
        }

        Task storage task = tasks[taskId];
        
        // If task doesn't exist, initialize it
        if (task.id == bytes32(0)) {
            task.id = taskId;
            task.claimer = _msgSender();
            task.status = STATUS_CLAIMED;
            task.attestationHash = bytes32(0);
        } else {
            // Task exists, check if it can be claimed
            if (task.status != STATUS_UNCLAIMED) {
                revert TaskAlreadyClaimed();
            }
            task.claimer = _msgSender();
            task.status = STATUS_CLAIMED;
        }

        emit TaskClaimed(taskId, _msgSender());
    }

    /**
     * @notice Allows the task claimer to resolve a task with attestation hash
     * @param taskId The unique identifier for the task
     * @param attestationHash Hash of the signed off-chain manifest stored on Filecoin
     * @dev Only the original claimer can resolve their claimed task
     */
    function resolveTask(bytes32 taskId, bytes32 attestationHash) external onlyModerator {
        if (taskId == bytes32(0)) {
            revert InvalidTaskId();
        }
        if (attestationHash == bytes32(0)) {
            revert("ModeratorRegistry: invalid attestation hash");
        }

        Task storage task = tasks[taskId];
        
        if (task.id == bytes32(0)) {
            revert("ModeratorRegistry: task does not exist");
        }
        if (task.status != STATUS_CLAIMED) {
            revert TaskNotClaimed();
        }
        if (task.claimer != _msgSender()) {
            revert UnauthorizedClaimer();
        }

        task.status = STATUS_RESOLVED;
        task.attestationHash = attestationHash;

        emit TaskResolved(taskId, attestationHash);
    }

    /**
     * @notice Gets task details by ID
     * @param taskId The unique identifier for the task
     * @return Task struct containing all task information
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Checks if a task exists
     * @param taskId The unique identifier for the task
     * @return bool indicating if the task exists
     */
    function taskExists(bytes32 taskId) external view returns (bool) {
        return tasks[taskId].id != bytes32(0);
    }

    /**
     * @notice Gets the number of moderators (view function for frontend)
     * @dev Note: This would require additional storage to track efficiently in production
     * @return count This is a placeholder - would need a counter in production implementation
     */
    function getModeratorCount() external pure returns (uint256 count) {
        // This is a placeholder implementation
        // In production, you would maintain a counter variable
        return 0;
    }

    /**
     * @notice Emergency function to remove a moderator (admin only)
     * @param moderator Address of the moderator to remove
     * @dev Only callable by admin role for emergency situations
     */
    function removeModerator(address moderator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isModerator[moderator] = false;
        emit ModeratorOptedOut(moderator);
    }

    /**
     * @notice Emergency function to reset a task (admin only)
     * @param taskId The unique identifier for the task to reset
     * @dev Only callable by admin role for emergency situations
     */
    function resetTask(bytes32 taskId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (taskId == bytes32(0)) {
            revert InvalidTaskId();
        }
        
        Task storage task = tasks[taskId];
        if (task.id == bytes32(0)) {
            revert("ModeratorRegistry: task does not exist");
        }

        task.claimer = address(0);
        task.status = STATUS_UNCLAIMED;
        task.attestationHash = bytes32(0);
    }
}