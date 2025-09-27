// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityAnchor
 * @notice Anchors zero-knowledge friendly identity commitments on-chain for a decentralized social application.
 * @dev Deployable on the CELO Alfajores testnet. Access control is delegated to the default admin and optional registrar accounts.
 */
contract IdentityAnchor is AccessControl {
    /// @notice Role identifier for trusted registrar accounts.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @dev Mapping of wallet address to the latest registered identity commitment.
    mapping(address => bytes32) private _identityCommitments;

    /// @dev Tracks whether a particular commitment hash has been registered to enforce uniqueness across the system.
    mapping(bytes32 => bool) private _registeredCommitments;

    /**
     * @notice Emitted when a new identity commitment is registered on-chain.
     * @param user The wallet that now owns the anchored identity commitment.
     * @param commitment The 32-byte identity commitment that was registered.
     * @param timestamp The Unix time when the registration occurred.
     */
    event IdentityRegistered(address indexed user, bytes32 indexed commitment, uint256 timestamp);

    /**
     * @notice Emitted when an existing identity commitment is updated.
     * @param user The wallet that owns the identity commitment.
     * @param oldCommitment The previous commitment that was replaced.
     * @param newCommitment The new commitment registered for the wallet.
     * @param timestamp The Unix time when the update occurred.
     */
    event IdentityUpdated(address indexed user, bytes32 indexed oldCommitment, bytes32 indexed newCommitment, uint256 timestamp);

    /**
     * @notice Sets up the default admin role on the deployer.
     * @dev DEFAULT_ADMIN_ROLE can grant or revoke REGISTRAR_ROLE to manage permissioned registration flows.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        // Future consideration: grant REGISTRAR_ROLE to the deployer if programmatic registrations are desired by default.
    }

    /**
     * @notice Registers a fresh identity commitment for the caller.
     * @dev Reverts if the caller already has an identity anchored or if the supplied commitment is invalid or already taken.
     * @param commitment The 32-byte identity commitment derived off-chain (e.g., via Semaphore-style hashing).
     * @custom:security Caller must keep the preimage of the commitment secret to avoid identity spoofing.
     */
    function registerIdentity(bytes32 commitment) external {
        address sender = _msgSender();
        bytes32 zeroCommitment;

        require(sender != address(0), "IdentityAnchor: invalid sender");
        require(commitment != zeroCommitment, "IdentityAnchor: commitment is zero");
        require(_identityCommitments[sender] == zeroCommitment, "IdentityAnchor: identity already registered");
        require(!_registeredCommitments[commitment], "IdentityAnchor: commitment already registered");

        _identityCommitments[sender] = commitment;
        _registeredCommitments[commitment] = true;

        emit IdentityRegistered(sender, commitment, block.timestamp);
    }

    /**
     * @notice Registers an identity commitment on behalf of a specific user.
     * @dev Only callable by accounts granted the REGISTRAR_ROLE (e.g., custodial onboarding services).
     * @param user The wallet that will own the new commitment.
     * @param commitment The 32-byte identity commitment to anchor for the user.
     * @custom:security Registrar must ensure the provided commitment was authorized by the user.
     */
    function registerIdentityFor(address user, bytes32 commitment) external onlyRole(REGISTRAR_ROLE) {
        bytes32 zeroCommitment;

        require(user != address(0), "IdentityAnchor: user is zero address");
        require(commitment != zeroCommitment, "IdentityAnchor: commitment is zero");
        require(_identityCommitments[user] == zeroCommitment, "IdentityAnchor: identity already registered");
        require(!_registeredCommitments[commitment], "IdentityAnchor: commitment already registered");

        _identityCommitments[user] = commitment;
        _registeredCommitments[commitment] = true;

        emit IdentityRegistered(user, commitment, block.timestamp);
    }

    /**
     * @notice Updates the caller's identity commitment to a new value.
     * @dev The previous commitment remains flagged as registered to prevent replay attacks and identity collisions.
     * @param newCommitment The replacement 32-byte commitment for the caller.
     * @custom:security Ensure the new commitment is generated using the latest entropy to avoid linkage with prior identities.
     */
    function updateIdentity(bytes32 newCommitment) external {
        address sender = _msgSender();
        bytes32 currentCommitment = _identityCommitments[sender];
        bytes32 zeroCommitment;

        require(sender != address(0), "IdentityAnchor: invalid sender");
        require(currentCommitment != zeroCommitment, "IdentityAnchor: identity not registered");
        require(newCommitment != zeroCommitment, "IdentityAnchor: commitment is zero");
        require(newCommitment != currentCommitment, "IdentityAnchor: commitment unchanged");
        require(!_registeredCommitments[newCommitment], "IdentityAnchor: commitment already registered");

        _identityCommitments[sender] = newCommitment;
        _registeredCommitments[newCommitment] = true;

        emit IdentityUpdated(sender, currentCommitment, newCommitment, block.timestamp);
    }

    /**
     * @notice Retrieves the currently anchored identity commitment for a wallet.
     * @param user The wallet address being queried.
     * @return commitment The 32-byte commitment associated with the user or zero if none is registered.
     */
    function getIdentity(address user) external view returns (bytes32 commitment) {
        commitment = _identityCommitments[user];
    }

    /**
     * @notice Checks if the provided commitment has been registered by any account (historically or currently).
     * @param commitment The commitment hash to examine.
     * @return isRegistered True if the commitment has ever been anchored on-chain.
     */
    function isCommitmentRegistered(bytes32 commitment) external view returns (bool isRegistered) {
        isRegistered = _registeredCommitments[commitment];
    }

    /**
     * @notice Helper to determine whether a wallet already has an identity commitment.
     * @param user The wallet address to query.
     * @return hasIdentity True if the user has a non-zero commitment anchored.
     */
    function hasIdentity(address user) external view returns (bool hasIdentity) {
        hasIdentity = _identityCommitments[user] != bytes32(0);
    }

    // ------------------------------------------------------------------------
    // Future Integrations
    // ------------------------------------------------------------------------
    // - Merkle root anchoring: integrate OpenZeppelin's MerkleProof utility to validate inclusion proofs.
    // - Decentralized storage: store Filecoin/IPFS content identifiers tied to identity attestations.
    // - Badge NFTs: hook into an ERC-721 contract to mint verifiable reputation tokens upon registration or milestones.
}
