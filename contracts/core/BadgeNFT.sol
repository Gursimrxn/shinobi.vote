// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title BadgeNFT
 * @notice Manages on-chain collectible badges for Shinobi users, representing verification achievements or activity milestones.
 * @dev ERC-721 compliant NFT contract with role-based minting. Designed for CELO Alfajores testnet deployment.
 * Each badge contains metadata stored on Filecoin/IPFS, providing visual proof of verification or participation.
 */
contract BadgeNFT is ERC721, AccessControl {
    /// @notice Role identifier for accounts authorized to mint badges.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Counter for auto-incrementing token IDs.
    uint256 private _tokenIdCounter;

    /// @dev Mapping from token ID to token URI (IPFS/Filecoin CID).
    mapping(uint256 => string) private _tokenURIs;

    /**
     * @notice Emitted when a badge is successfully minted.
     * @param to The recipient address of the badge.
     * @param tokenId The unique token ID of the minted badge.
     * @param tokenURI The metadata URI pointing to badge information on IPFS/Filecoin.
     */
    event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    /**
     * @notice Initializes the BadgeNFT contract with ERC-721 metadata and access control.
     * @dev Sets up the deployer as the default admin with full access control privileges.
     */
    constructor() ERC721("Shinobi Badge", "GHOST-BADGE") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        // Start token IDs from 1 instead of 0 for better UX
        _tokenIdCounter = 1;
    }

    /**
     * @notice Mints a new badge NFT to the specified address with custom token ID and metadata URI.
     * @dev Restricted to accounts with MINTER_ROLE. Validates inputs and emits BadgeMinted event.
     * @param to The recipient address for the badge (must be non-zero).
     * @param tokenId The unique token ID for the badge (must not already exist).
     * @param uri The metadata URI pointing to badge information (must be non-empty).
     * @custom:security Only MINTER_ROLE can call this function. Validates all inputs to prevent invalid minting.
     */
    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "BadgeNFT: mint to zero address");
        require(bytes(uri).length > 0, "BadgeNFT: empty token URI");
        require(_ownerOf(tokenId) == address(0), "BadgeNFT: token already exists");

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit BadgeMinted(to, tokenId, uri);
    }

    /**
     * @notice Mints a badge with an auto-incremented token ID for simplified minting.
     * @dev Convenience function that automatically assigns the next available token ID.
     * @param to The recipient address for the badge.
     * @param uri The metadata URI pointing to badge information.
     * @return tokenId The assigned token ID for the newly minted badge.
     */
    function safeMintAuto(
        address to,
        string memory uri
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "BadgeNFT: mint to zero address");
        require(bytes(uri).length > 0, "BadgeNFT: empty token URI");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit BadgeMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @notice Returns the metadata URI for a given token ID.
     * @dev Overrides ERC721's tokenURI to return stored IPFS/Filecoin metadata.
     * @param tokenId The token ID to query.
     * @return The metadata URI string for the token.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Returns the current token ID counter value (next token to be minted).
     * @dev Useful for frontend integration to predict next token ID.
     * @return The current counter value.
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Returns the total number of tokens that have been minted.
     * @dev Calculates total supply based on current counter minus 1 (since we start from 1).
     * @return The total number of minted tokens.
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @notice Checks if a token with the given ID exists.
     * @param tokenId The token ID to check.
     * @return bool indicating whether the token exists.
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Internal function to set the token URI for a given token ID.
     * @dev Stores the metadata URI in the contract's mapping.
     * @param tokenId The token ID to set URI for.
     * @param uri The metadata URI to store.
     */
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_ownerOf(tokenId) != address(0), "BadgeNFT: URI set of nonexistent token");
        _tokenURIs[tokenId] = uri;
    }

    /**
     * @notice Checks if the contract supports a given interface.
     * @dev Required override for AccessControl and ERC721 compatibility.
     * @param interfaceId The interface identifier to check.
     * @return bool indicating support for the interface.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Emergency function to update token URI for existing tokens.
     * @dev Restricted to DEFAULT_ADMIN_ROLE. Use carefully as it changes immutable-seeming metadata.
     * @param tokenId The token ID to update.
     * @param newUri The new metadata URI.
     */
    function updateTokenURI(
        uint256 tokenId,
        string memory newUri
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(newUri).length > 0, "BadgeNFT: empty token URI");
        _setTokenURI(tokenId, newUri);
    }

    /**
     * @notice Grants MINTER_ROLE to a new account (moderator, relayer, etc.).
     * @dev Only callable by DEFAULT_ADMIN_ROLE.
     * @param account The account to grant minting privileges to.
     */
    function grantMinterRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "BadgeNFT: cannot grant role to zero address");
        _grantRole(MINTER_ROLE, account);
    }

    /**
     * @notice Revokes MINTER_ROLE from an account.
     * @dev Only callable by DEFAULT_ADMIN_ROLE.
     * @param account The account to revoke minting privileges from.
     */
    function revokeMinterRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, account);
    }
}