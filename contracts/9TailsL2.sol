// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./9TailsBase.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

contract NineTailsL2 is NineTailsBase {

    constructor() {
        _mint(msg.sender, 0);
        _mint(msg.sender, 1);
        _mint(msg.sender, 2);
        _mint(msg.sender, 3);
        _mint(msg.sender, 4);
        _mint(msg.sender, 5);
        _mint(msg.sender, 6);
        _mint(msg.sender, 7);
        _mint(msg.sender, 8);
    }

     function transferToL1(
        uint256 tokenId
    ) external {
        require(msg.sender == ownerOf(tokenId), "Only owner can transfer token to L2");
        bytes memory message = abi.encode(tokenId, msg.sender);
        L1_MESSENGER_CONTRACT.sendToL1(message);
        _burn(tokenId);
    }

    function receiveFromL1(
        uint256 tokenId,
        address destination
    ) external {
        require(msg.sender == crossChainCounterpart, "Only the right counterpart can call the transfer");
        _mint(destination, tokenId);
        emit SentToLayer(2);
    }

      function _whichLayerIsToken(uint tokenId) override internal view returns (uint layer) {
        if (_exists(tokenId)) {
            return 2;
        } else {
            return 1;
        }
    }
}