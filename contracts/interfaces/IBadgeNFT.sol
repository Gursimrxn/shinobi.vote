// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IBadgeNFT
 * @notice Interface for the BadgeNFT contract defining core badge management functions.
 * @dev Extends ERC721 and AccessControl interfaces for comprehensive badge functionality.
 */
interface IBadgeNFT is IERC721, IAccessControl {
    /**
     * @notice Emitted when a badge is successfully minted.
     * @param to The recipient address of the badge.
     * @param tokenId The unique token ID of the minted badge.
     * @param tokenURI The metadata URI pointing to badge information on IPFS/Filecoin.
     */
    event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    /**
     * @notice Mints a new badge NFT to the specified address with custom token ID and metadata URI.
     * @param to The recipient address for the badge.
     * @param tokenId The unique token ID for the badge.
     * @param tokenURI The metadata URI pointing to badge information.
     */
    function safeMint(address to, uint256 tokenId, string memory tokenURI) external;

    /**
     * @notice Mints a badge with an auto-incremented token ID.
     * @param to The recipient address for the badge.
     * @param tokenURI The metadata URI pointing to badge information.
     * @return tokenId The assigned token ID for the newly minted badge.
     */
    function safeMintAuto(address to, string memory tokenURI) external returns (uint256);

    /**
     * @notice Returns the current token ID counter value.
     * @return The current counter value.
     */
    function getCurrentTokenId() external view returns (uint256);

    /**
     * @notice Returns the total number of tokens that have been minted.
     * @return The total number of minted tokens.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @notice Checks if a token with the given ID exists.
     * @param tokenId The token ID to check.
     * @return bool indicating whether the token exists.
     */
    function exists(uint256 tokenId) external view returns (bool);

    /**
     * @notice Updates token URI for existing tokens (admin only).
     * @param tokenId The token ID to update.
     * @param newTokenURI The new metadata URI.
     */
    function updateTokenURI(uint256 tokenId, string memory newTokenURI) external;

    /**
     * @notice Grants MINTER_ROLE to a new account.
     * @param account The account to grant minting privileges to.
     */
    function grantMinterRole(address account) external;

    /**
     * @notice Revokes MINTER_ROLE from an account.
     * @param account The account to revoke minting privileges from.
     */
    function revokeMinterRole(address account) external;
}