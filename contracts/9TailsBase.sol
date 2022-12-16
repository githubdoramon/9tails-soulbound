// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract NineTailsBase is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {

    address public crossChainCounterpart;
    event SentToLayer(uint layer);

    constructor() ERC721("The Nine Tails", "TAIL") {
    }

    function setCrossChainCounterpart(address _crossChainCounterpart) public onlyOwner {
        crossChainCounterpart = _crossChainCounterpart;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ramon";
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function whichLayerIsToken(uint tokenId) public returns (uint layer) {
        require(tokenId < 9, "This Tail does not exists");
        return _whichLayerIsToken(tokenId);
    }
    
    function _whichLayerIsToken(uint tokenId) internal virtual returns (uint layer);

    function transferFrom(address from, address to, uint256 tokenId) public override onlyOwner {
        super.transferFrom(from, to, tokenId);
    }
}