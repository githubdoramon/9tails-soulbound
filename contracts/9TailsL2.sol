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
        emit PermanentURI(tokenURI(0),0);
        emit PermanentURI(tokenURI(1),1);
        emit PermanentURI(tokenURI(2),2);
        emit PermanentURI(tokenURI(3),3);
        emit PermanentURI(tokenURI(4),4);
        emit PermanentURI(tokenURI(5),5);
        emit PermanentURI(tokenURI(6),6);
        emit PermanentURI(tokenURI(7),7);
        emit PermanentURI(tokenURI(8),8);

    }

     function transferToL1(
        uint256 tokenId
    ) external {
        require(msg.sender == ownerOf(tokenId), "Only owner can transfer token to L2");
        bytes memory message = abi.encode(tokenId, msg.sender);
        L1_MESSENGER_CONTRACT.sendToL1(message);
        _burn(tokenId);
        emit SentToLayer(1);
    }

    function receiveFromL1(
        uint256 tokenId,
        address destination
    ) external {
        require(msg.sender == crossChainCounterpart, "Only the right counterpart can call the transfer");
        _mint(destination, tokenId);
        emit ReceivedOnLayer(2);
    }

      function _whichLayerIsToken(uint tokenId) override internal view returns (uint layer) {
        if (_exists(tokenId)) {
            return 2;
        } else {
            return 1;
        }
    }
}