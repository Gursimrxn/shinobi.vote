// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "../interfaces/IMerkleAnchorRegistry.sol";

/**
 * @title MerkleAnchorRegistry
 * @notice A registry for Merkle roots that enables efficient verification of user data commitments.
 * @dev This contract allows users to register Merkle roots and provides functionality to verify proofs against them.
 *      Uses OpenZeppelin's AccessControl for role-based permissions and MerkleProof for verification.
 *      Designed for deployment on CELO Alfajores testnet as part of the Shinobi ecosystem.
 */
contract MerkleAnchorRegistry is AccessControl, IMerkleAnchorRegistry {
    /// @notice Role identifier for admin accounts that can manage the registry.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    /// @notice Role identifier for users who can register Merkle roots.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @dev Maximum number of roots a user can register to prevent spam.
    uint256 public constant MAX_ROOTS_PER_USER = 100;

    /// @dev Mapping from user address to their registered Merkle roots.
    mapping(address => bytes32[]) private _userRoots;

    /// @dev Mapping to check if a root exists and track its owner.
    mapping(bytes32 => address) private _rootOwner;

    /// @dev Mapping to track if a root has been removed.
    mapping(bytes32 => bool) private _removedRoots;

    /// @dev Counter for total registered roots (active only).
    uint256 private _totalActiveRoots;

    /**
     * @notice Contract constructor that sets up initial roles.
     * @dev The deployer receives both DEFAULT_ADMIN_ROLE and ADMIN_ROLE.
     *      REGISTRAR_ROLE must be granted separately to users who can register roots.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
     * @notice Registers a new Merkle root for the calling user.
     * @dev Only users with REGISTRAR_ROLE can register roots.
     *      Prevents duplicate roots and enforces per-user limits.
     * @param root The Merkle root to register.
     */
    function registerMerkleRoot(bytes32 root) external override onlyRole(REGISTRAR_ROLE) {
        require(root != bytes32(0), "MerkleAnchorRegistry: root cannot be zero");
        require(!_removedRoots[root], "MerkleAnchorRegistry: root was previously removed");
        require(_rootOwner[root] == address(0), "MerkleAnchorRegistry: root already registered");
        require(_userRoots[_msgSender()].length < MAX_ROOTS_PER_USER, "MerkleAnchorRegistry: max roots exceeded");

        _userRoots[_msgSender()].push(root);
        _rootOwner[root] = _msgSender();
        _totalActiveRoots++;

        emit MerkleRootRegistered(_msgSender(), root);
    }

    /**
     * @notice Verifies a Merkle proof against a user's registered root.
     * @dev Uses OpenZeppelin's MerkleProof library for verification.
     * @param user The address of the user who registered the root.
     * @param proof The Merkle proof to verify.
     * @param leaf The leaf node to verify.
     * @return bool True if the proof is valid, false otherwise.
     */
    function verifyProof(
        address user,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view override returns (bool) {
        require(user != address(0), "MerkleAnchorRegistry: user cannot be zero address");
        require(leaf != bytes32(0), "MerkleAnchorRegistry: leaf cannot be zero");

        bytes32[] storage userRoots = _userRoots[user];
        
        // Try to verify against any of the user's active roots
        for (uint256 i = 0; i < userRoots.length; i++) {
            bytes32 root = userRoots[i];
            if (!_removedRoots[root] && MerkleProof.verify(proof, root, leaf)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @notice Verifies a Merkle proof against a specific root.
     * @dev Alternative verification method when you know the specific root.
     * @param root The Merkle root to verify against.
     * @param proof The Merkle proof to verify.
     * @param leaf The leaf node to verify.
     * @return bool True if the proof is valid, false otherwise.
     */
    function verifyProofWithRoot(
        bytes32 root,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view override returns (bool) {
        require(root != bytes32(0), "MerkleAnchorRegistry: root cannot be zero");
        require(leaf != bytes32(0), "MerkleAnchorRegistry: leaf cannot be zero");
        require(_rootOwner[root] != address(0), "MerkleAnchorRegistry: root not registered");
        require(!_removedRoots[root], "MerkleAnchorRegistry: root has been removed");

        return MerkleProof.verify(proof, root, leaf);
    }

    /**
     * @notice Returns all active Merkle roots registered by a user.
     * @dev Filters out removed roots to return only active ones.
     * @param user The address of the user.
     * @return bytes32[] Array of active Merkle roots.
     */
    function getRootsByUser(address user) external view override returns (bytes32[] memory) {
        require(user != address(0), "MerkleAnchorRegistry: user cannot be zero address");

        bytes32[] storage userRoots = _userRoots[user];
        
        // Count active roots first
        uint256 activeCount = 0;
        for (uint256 i = 0; i < userRoots.length; i++) {
            if (!_removedRoots[userRoots[i]]) {
                activeCount++;
            }
        }

        // Create array with active roots only
        bytes32[] memory activeRoots = new bytes32[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < userRoots.length; i++) {
            if (!_removedRoots[userRoots[i]]) {
                activeRoots[index] = userRoots[i];
                index++;
            }
        }

        return activeRoots;
    }

    /**
     * @notice Returns the owner of a specific Merkle root.
     * @param root The Merkle root to query.
     * @return address The owner of the root, or zero address if not found.
     */
    function getRootOwner(bytes32 root) external view override returns (address) {
        return _removedRoots[root] ? address(0) : _rootOwner[root];
    }

    /**
     * @notice Checks if a Merkle root is registered and active.
     * @param root The Merkle root to check.
     * @return bool True if the root is registered and active.
     */
    function isRootRegistered(bytes32 root) external view override returns (bool) {
        return _rootOwner[root] != address(0) && !_removedRoots[root];
    }

    /**
     * @notice Removes a Merkle root from the registry.
     * @dev Only admins or the root owner can remove a root.
     *      The root is marked as removed but not deleted for audit purposes.
     * @param root The Merkle root to remove.
     */
    function removeRoot(bytes32 root) external override {
        require(root != bytes32(0), "MerkleAnchorRegistry: root cannot be zero");
        require(_rootOwner[root] != address(0), "MerkleAnchorRegistry: root not registered");
        require(!_removedRoots[root], "MerkleAnchorRegistry: root already removed");

        address rootOwner = _rootOwner[root];
        require(
            hasRole(ADMIN_ROLE, _msgSender()) || _msgSender() == rootOwner,
            "MerkleAnchorRegistry: unauthorized to remove root"
        );

        _removedRoots[root] = true;
        // Don't clear _rootOwner[root] to maintain audit trail
        _totalActiveRoots--;

        emit MerkleRootRemoved(rootOwner, root);
    }

    /**
     * @notice Returns the total number of active roots in the registry.
     * @return uint256 The total count of active roots.
     */
    function getTotalActiveRoots() external view override returns (uint256) {
        return _totalActiveRoots;
    }

    /**
     * @notice Returns the number of active roots for a specific user.
     * @param user The address of the user.
     * @return uint256 The count of active roots for the user.
     */
    function getUserRootCount(address user) external view override returns (uint256) {
        require(user != address(0), "MerkleAnchorRegistry: user cannot be zero address");

        bytes32[] storage userRoots = _userRoots[user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < userRoots.length; i++) {
            if (!_removedRoots[userRoots[i]]) {
                activeCount++;
            }
        }

        return activeCount;
    }

    /**
     * @notice Emergency function to pause root registration.
     * @dev Only admins can call this function. Implementation depends on requirements.
     */
    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        // Implementation would depend on whether you want to use OpenZeppelin's Pausable
        // For now, this is a placeholder for emergency functionality
        emit EmergencyAction(_msgSender(), "PAUSE");
    }

    /**
     * @notice Batch register multiple Merkle roots for gas efficiency.
     * @dev Only users with REGISTRAR_ROLE can register roots.
     * @param roots Array of Merkle roots to register.
     */
    function batchRegisterMerkleRoots(bytes32[] calldata roots) 
        external 
        override 
        onlyRole(REGISTRAR_ROLE) 
    {
        require(roots.length > 0, "MerkleAnchorRegistry: empty roots array");
        require(
            _userRoots[_msgSender()].length + roots.length <= MAX_ROOTS_PER_USER,
            "MerkleAnchorRegistry: batch would exceed max roots"
        );

        for (uint256 i = 0; i < roots.length; i++) {
            bytes32 root = roots[i];
            require(root != bytes32(0), "MerkleAnchorRegistry: root cannot be zero");
            require(_rootOwner[root] == address(0), "MerkleAnchorRegistry: root already registered");
            require(!_removedRoots[root], "MerkleAnchorRegistry: root was previously removed");

            _userRoots[_msgSender()].push(root);
            _rootOwner[root] = _msgSender();
            _totalActiveRoots++;

            emit MerkleRootRegistered(_msgSender(), root);
        }
    }

    /**
     * @notice Returns the version of this contract.
     * @return string The version string.
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}