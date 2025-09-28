// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@account-abstraction/contracts/core/UserOperationLib.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./lib/DAOLib.sol";
import "./interfaces/IVerifier.sol";

interface IDAO {
    function hasVoted(uint256 nullifierHash) external view returns (bool);
    function SCOPE() external view returns (uint256);
    function membershipRoots(uint256 index) external view returns (uint256);
}

contract VotingPaymaster is BasePaymaster, ReentrancyGuard {
    using UserOperationLib for PackedUserOperation;

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Return value for validation failures
    uint256 internal constant _VALIDATION_FAILED = 1;

    /// @notice DAO contract
    IDAO public immutable DAO;

    /// @notice Semaphore verifier contract for ZK proof verification
    IVerifier public immutable MEMBERSHIP_VERIFIER;

    /// @notice Expected smart account address for deterministic account pattern
    address public expectedSmartAccount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ExpectedSmartAccountUpdated(
        address indexed previousAccount,
        address indexed newAccount
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidCallData();
    error InsufficientPostOpGasLimit();
    error VoteValidationFailed();
    error UnauthorizedCaller();
    error InvalidProposal();
    error ExpectedSmartAccountNotSet();
    error UnauthorizedSmartAccount();
    error SmartAccountNotDeployed();
    error NullifierAlreadySpent();
    error InvalidSemaphoreProof();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploy DAO Voting Paymaster
     * @param _entryPoint ERC-4337 EntryPoint contract
     * @param _dao DAO contract
     * @param _membershipVerifier Semaphore verifier contract for ZK proof verification
     */
    constructor(
        IEntryPoint _entryPoint,
        address _dao,
        address _membershipVerifier
    ) BasePaymaster(_entryPoint) {
        DAO = IDAO(_dao);
        MEMBERSHIP_VERIFIER = IVerifier(_membershipVerifier);
    }

    /*//////////////////////////////////////////////////////////////
                        SMART ACCOUNT CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set the expected smart account address for deterministic account pattern
     * @dev Only owner can set this. Must be set before processing UserOperations.
     * @param account The smart account address that all UserOperations must come from
     */
    function setExpectedSmartAccount(address account) external onlyOwner {
        if (account == address(0)) {
            revert UnauthorizedSmartAccount();
        }

        address previousAccount = expectedSmartAccount;
        expectedSmartAccount = account;

        emit ExpectedSmartAccountUpdated(previousAccount, account);
    }

    /*//////////////////////////////////////////////////////////////
                        EMBEDDED VOTE VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Internal vote validation method that mirrors DAO.vote()
     * @dev This method is called internally by the paymaster to validate vote proofs
     *      without actually executing the vote. Uses the exact same signature as DAO.vote()
     *      to allow direct calldata forwarding.
     *
     *      Only callable by the paymaster itself during UserOperation validation to ensure
     *      secure proof verification before gas sponsorship approval.
     *
     * @param proposalId The proposal being voted on
     * @param optionIndex The option being voted for
     * @param voteData The vote data containing membership proof and configuration
     */
    function vote(
        uint256 proposalId,
        uint256 optionIndex,
        DAOLib.VoteData calldata voteData
    ) external view {
        if (msg.sender != address(this)) {
            revert UnauthorizedCaller();
        }

        // Check nullifier hasn't been used
        if (DAO.hasVoted(voteData.proof.nullifier)) {
            revert NullifierAlreadySpent();
        }

        if (voteData.proof.scope != DAO.SCOPE()) {
            revert InvalidSemaphoreProof();
        }

        // Check if the merkle root is from DAO's history
        uint256 expectedRoot = DAO.membershipRoots(
            voteData.config.merkleRootIndex
        );
        if (
            voteData.proof.merkleTreeRoot != expectedRoot || expectedRoot == 0
        ) {
            revert InvalidSemaphoreProof();
        }

        // Verify ZK proof using Semaphore verifier
        bool isValidProof = MEMBERSHIP_VERIFIER.verifyProof(
            [voteData.proof.points[0], voteData.proof.points[1]],
            [
                [voteData.proof.points[2], voteData.proof.points[3]],
                [voteData.proof.points[4], voteData.proof.points[5]]
            ],
            [voteData.proof.points[6], voteData.proof.points[7]],
            [
                voteData.proof.merkleTreeRoot,
                voteData.proof.nullifier,
                DAOLib._hash(voteData.proof.message),
                DAOLib._hash(voteData.proof.scope)
            ],
            voteData.proof.merkleTreeDepth
        );

        if (!isValidProof) {
            revert InvalidSemaphoreProof();
        }
    }

    /**
     * @notice Validate a UserOperation for DAO voting
     * @dev Performs comprehensive validation including ZK proof verification and vote parameters
     *      to ensure the paymaster only sponsors successful votes
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation
     * @return context Encoded context with user info for postOp
     * @return validationData 0 if valid, packed failure data otherwise
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        // 1. Check that expected smart account is configured
        if (expectedSmartAccount == address(0)) {
            revert ExpectedSmartAccountNotSet();
        }

        // 2. Check that UserOperation comes from expected smart account
        if (userOp.sender != expectedSmartAccount) {
            revert UnauthorizedSmartAccount();
        }

        // 3. Ensure smart account is already deployed (no initCode)
        if (userOp.initCode.length > 0) {
            revert SmartAccountNotDeployed();
        }

        // 6. Check paymaster has sufficient deposit
        if (getDeposit() < maxCost) {
            return ("", _VALIDATION_FAILED); // Insufficient paymaster deposit
        }

        // 7. Extract execute call parameters
        (
            address target,
            uint256 value,
            bytes memory data
        ) = _extractExecuteCall(userOp.callData);

        // 8. Validate vote transaction (no economic checks needed, just vote validation)
        if (!_validateVote(target, value, data)) {
            revert VoteValidationFailed();
        }

        // No need for complex context since we don't do postOp operations
        return ("", 0);
    }

    /*//////////////////////////////////////////////////////////////
                            POST-OP OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Handle post-operation (no operations needed for voting)
     * @dev We don't need to track anything or do refunds for voting
     */
    function _postOp(
        IPaymaster.PostOpMode /* mode */,
        bytes calldata /* context */,
        uint256 /* actualGasCost */,
        uint256 /* actualUserOpFeePerGas */
    ) internal override {
        // No post-op operations needed for voting paymaster
        // The vote transaction either succeeds or fails, no refunds needed
    }

    /*//////////////////////////////////////////////////////////////
                        VOTE VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validate DAO vote by performing embedded proof verification
     * @dev This method validates the target and value, then calls the internal vote method
     *      to perform comprehensive ZK proof validation including replay protection.
     *      No economic checks needed - just validates it's a valid vote call to our DAO.
     * @param target The target address being called (should be DAO)
     * @param value ETH value being sent (should be 0 for votes)
     * @param data The call data to the DAO (vote method call)
     * @return true if validation passes, false otherwise
     */
    function _validateVote(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bool) {
        // Validate target is DAO
        if (target != address(DAO)) {
            return false;
        }

        // Validate no ETH transfer
        if (value != 0) {
            return false;
        }

        // Direct call to vote method - let Solidity's dispatcher handle parameter decoding
        // This is more gas efficient than manually decoding parameters
        // If the method doesn't exist or parameters are invalid, the call will fail
        (bool success, ) = address(this).call(data);
        return success;
    }

    /*//////////////////////////////////////////////////////////////
                         INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Extract target, value, and data from SimpleAccount.execute() callData
     * @dev Validates callData format and extracts execute parameters
     * @param callData The UserOperation callData
     * @return target The target address being called
     * @return value The ETH value being sent
     * @return data The call data to the target
     */
    function _extractExecuteCall(
        bytes calldata callData
    ) internal pure returns (address target, uint256 value, bytes memory data) {
        // Check minimum callData length (4 bytes selector + minimal parameters)
        if (callData.length < 4) {
            revert InvalidCallData();
        }

        // Check if it's SimpleAccount.execute() selector (0xb61d27f6)
        bytes4 selector = bytes4(callData[:4]);
        if (selector != 0xb61d27f6) {
            revert InvalidCallData(); // Not a SimpleAccount.execute() call
        }

        // Decode execute parameters: execute(address target, uint256 value, bytes calldata data)
        (target, value, data) = abi.decode(
            callData[4:],
            (address, uint256, bytes)
        );

        return (target, value, data);
    }

    /*//////////////////////////////////////////////////////////////
                                RECEIVE
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Allow contract to receive ETH and redirect to deposit
     */
    receive() external payable {
        deposit();
    }
}
