// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IVerifier.sol";

/**
 * @title IDAOState
 * @notice Interface for managing DAO membership state using Merkle trees
 */
interface IDAOState {
    /*///////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitted when a new member is added to the membership tree
     * @param memberIndex The index of the member in the tree
     * @param identityCommitment The identity commitment of the new member
     * @param newRoot The new root after insertion
     */
    event MemberAdded(
        uint256 indexed memberIndex,
        uint256 identityCommitment,
        uint256 newRoot
    );

    /*///////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error ZeroAddress();
    error InvalidIdentityCommitment();
    error MemberAlreadyExists();
    error MaxTreeDepthReached();
    error UnknownMembershipRoot();
    error InvalidTreeDepth();
    error ScopeMismatch();
    error ProofVerificationFailed();

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Size of the root history buffer
     * @return The size of the root history buffer
     */
    function ROOT_HISTORY_SIZE() external pure returns (uint32);

    /**
     * @notice Minimum allowed tree depth
     * @return The minimum tree depth
     */
    function MIN_TREE_DEPTH() external pure returns (uint32);

    /**
     * @notice Maximum allowed tree depth
     * @return The maximum tree depth
     */
    function MAX_TREE_DEPTH() external pure returns (uint32);

    /**
     * @notice The scalar field used for SNARK computations
     * @return The SNARK scalar field modulus
     */
    function SNARK_SCALAR_FIELD() external pure returns (uint256);

    /**
     * @notice Unique scope identifier for this DAO instance
     * @return The scope value used in proofs
     */
    function SCOPE() external view returns (uint256);

    /**
     * @notice The verifier contract for membership proofs
     * @return The verifier contract address
     */
    function MEMBERSHIP_VERIFIER() external view returns (IVerifier);

    /**
     * @notice Get a historical membership root by index
     * @param _index The index in the root history
     * @return The root at the given index
     */
    function membershipRoots(uint256 _index) external view returns (uint256);

    /**
     * @notice Get the current root index
     * @return The current index in the root history buffer
     */
    function currentRootIndex() external view returns (uint32);

    /**
     * @notice Get the current membership tree root
     * @return The current root of the membership tree
     */
    function currentMembershipRoot() external view returns (uint256);

    /**
     * @notice Get the current tree depth
     * @return The current depth of the membership tree
     */
    function currentTreeDepth() external view returns (uint256);

    /**
     * @notice Get the current tree size (number of members)
     * @return The current size of the membership tree
     */
    function currentTreeSize() external view returns (uint256);
}
