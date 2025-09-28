// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {
    InternalLeanIMT,
    LeanIMTData
} from "@zk-kit/lean-imt.sol/InternalLeanIMT.sol";
import "../interfaces/IDAOState.sol";
import "../interfaces/IVerifier.sol";

/**
 * @title DAOState
 * @notice Base contract for managing the membership state of a DAO using a Merkle tree
 * @dev Each DAO instance maintains its own membership tree and generates unique scope
 */
abstract contract DAOState is IDAOState {
    using InternalLeanIMT for LeanIMTData;

    /// @inheritdoc IDAOState
    uint32 public constant ROOT_HISTORY_SIZE = 64;
    /// @inheritdoc IDAOState
    uint32 public constant MIN_TREE_DEPTH = 1;
    /// @inheritdoc IDAOState
    uint32 public constant MAX_TREE_DEPTH = 32;
    /// @inheritdoc IDAOState
    uint256 public constant SNARK_SCALAR_FIELD =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    /// @inheritdoc IDAOState
    uint256 public immutable SCOPE;

    /// @inheritdoc IDAOState
    IVerifier public immutable MEMBERSHIP_VERIFIER;

    /// @inheritdoc IDAOState
    mapping(uint256 _index => uint256 _root) public membershipRoots;
    /// @inheritdoc IDAOState
    uint32 public currentRootIndex;

    /// @notice The membership merkle tree containing all member identity commitments
    LeanIMTData internal _membershipTree;

    /**
     * @notice Initialize the DAO state
     * @param _membershipVerifier Address of the Groth16 verifier for membership proofs
     */
    constructor(address _membershipVerifier) {
        // Sanitize verifier address
        if (_membershipVerifier == address(0)) revert ZeroAddress();

        // Generate unique SCOPE for this DAO instance
        SCOPE =
            uint256(
                keccak256(
                    abi.encodePacked(
                        address(this),
                        block.chainid,
                        block.timestamp
                    )
                )
            ) %
            SNARK_SCALAR_FIELD;

        MEMBERSHIP_VERIFIER = IVerifier(_membershipVerifier);
    }

    /*///////////////////////////////////////////////////////////////
                              VIEWS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IDAOState
    function currentMembershipRoot() external view returns (uint256 _root) {
        _root = _membershipTree._root();
    }

    /// @inheritdoc IDAOState
    function currentTreeDepth() external view returns (uint256 _depth) {
        _depth = _membershipTree.depth;
    }

    /// @inheritdoc IDAOState
    function currentTreeSize() external view returns (uint256 _size) {
        _size = _membershipTree.size;
    }

    /*///////////////////////////////////////////////////////////////
                        INTERNAL METHODS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Insert a member identity commitment into the membership tree
     * @param _identityCommitment The identity commitment to insert
     * @return _updatedRoot The new root after inserting the commitment
     */
    function _insertMember(
        uint256 _identityCommitment
    ) internal returns (uint256 _updatedRoot) {
        // Validate commitment
        if (_identityCommitment == 0) revert InvalidIdentityCommitment();
        if (_isInMembershipTree(_identityCommitment))
            revert MemberAlreadyExists();

        // Insert commitment in the tree
        _updatedRoot = _membershipTree._insert(_identityCommitment);

        if (_membershipTree.depth > MAX_TREE_DEPTH)
            revert MaxTreeDepthReached();

        // Calculate the next index
        uint32 nextIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;

        // Store the root at the next index
        membershipRoots[nextIndex] = _updatedRoot;

        // Update currentRootIndex to point to the latest root
        currentRootIndex = nextIndex;

        emit MemberAdded(
            _membershipTree.size,
            _identityCommitment,
            _updatedRoot
        );
    }

    /**
     * @notice Returns whether the root is a known membership root
     * @dev A circular buffer is used for root storage to decrease the cost of storing new roots
     * @dev Optimized to start search from most recent roots, improving average case performance
     * @param _root The root to check
     * @return Returns true if the root exists in the history, false otherwise
     */
    function _isKnownMembershipRoot(
        uint256 _root
    ) internal view returns (bool) {
        if (_root == 0) return false;

        // Start from the most recent root (current index)
        uint32 _index = currentRootIndex;

        // Check all possible roots in the history
        for (uint32 _i = 0; _i < ROOT_HISTORY_SIZE; _i++) {
            if (_root == membershipRoots[_index]) return true;
            _index = (_index + ROOT_HISTORY_SIZE - 1) % ROOT_HISTORY_SIZE;
        }
        return false;
    }

    /**
     * @notice Returns whether an identity commitment is in the membership tree
     * @param _identityCommitment The commitment to check
     * @return Returns true if the commitment exists in the tree, false otherwise
     */
    function _isInMembershipTree(
        uint256 _identityCommitment
    ) internal view returns (bool) {
        return _membershipTree._has(_identityCommitment);
    }
}
