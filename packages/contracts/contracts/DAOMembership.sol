// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IDAO.sol";
import "./core/DAOState.sol";

abstract contract DAOMembership is Ownable, IDAO, DAOState {
    mapping(address => bool) public members;
    mapping(address => uint256) public memberCommitments; // Track member's identity commitment

    modifier onlyMember() {
        require(members[msg.sender], "DAO: Not a member");
        _;
    }

    constructor(address _membershipVerifier) DAOState(_membershipVerifier) {}

    /**
     * @notice Allows an external account to join the DAO and adds their identity commitment
     * to the membership tree.
     * @param identityCommitment The commitment of the member's identity.
     */
    function joinDAO(uint256 identityCommitment) external override {
        require(!members[msg.sender], "DAO: Already a member");
        require(identityCommitment != 0, "DAO: Invalid identity commitment");

        // Mark as member
        members[msg.sender] = true;
        memberCommitments[msg.sender] = identityCommitment;
        
        // Add to internal membership tree
        _insertMember(identityCommitment);

        emit MemberAdded(msg.sender, identityCommitment);
    }

    /**
     * @notice Checks if an address is a member of the DAO.
     * @param account The address to check.
     * @return True if the address is a member, false otherwise.
     */
    function isMember(address account) public view override returns (bool) {
        return members[account];
    }

    /**
     * @notice Gets the identity commitment for a member
     * @param account The member address
     * @return The identity commitment of the member
     */
    function getMemberCommitment(address account) public view returns (uint256) {
        require(members[account], "DAO: Not a member");
        return memberCommitments[account];
    }
}