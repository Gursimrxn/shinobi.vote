// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./DAOVoting.sol";

/**
 * @title DAO
 * @notice A simple DAO contract that uses Semaphore for privacy-preserving, verifiable voting.
 */
contract DAO is DAOVoting {
    /**
     * @notice Initializes the DAO contract, setting up the membership verifier and the contract owner.
     * @param _membershipVerifier The address of the Groth16 verifier for membership proofs.
     * @param _owner The initial owner of the DAO contract (for `Ownable`).
     */
    constructor(
        address _membershipVerifier,
        address _owner
    ) DAOVoting(_membershipVerifier) Ownable(_owner) {}
}
