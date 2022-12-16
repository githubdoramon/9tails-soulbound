// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./9TailsBase.sol";
import "@matterlabs/zksync-contracts/l1/contracts/zksync/interfaces/IZkSync.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NineTailsL1 is NineTailsBase {

    constructor(){

    }

    function transferToL2(
        uint256 tokenId,
        address zkSyncAddress
    ) external {
        require(msg.sender == ownerOf(tokenId), "Only owner can transfer token to L2");
        IZkSync zksync = IZkSync(zkSyncAddress);
        zksync.requestL2Transaction{value: 0}(crossChainCounterpart, 0, abi.encodePacked(string.concat("receiveFromL1(",Strings.toString(tokenId),",",Strings.toHexString(uint256(uint160(ownerOf(tokenId))), 20),")")), 10000, new bytes[](0));
        _burn(tokenId);
    }

    function receiveFromL2(
        address to,
        uint256 tokenId,
        address _zkSyncAddress,
        // zkSync block number in which the message was sent
        uint32 _l2BlockNumber,
        // Message index, that can be received via API
        uint256 _index,
        // Merkle proof for the message
        bytes32[] calldata _proof
    ) external {
        require(!_exists(tokenId), "Token already minted");

        IZkSync zksync = IZkSync(_zkSyncAddress);

        bytes memory _message = abi.encode(tokenId, msg.sender);

        L2Message memory message = L2Message({sender: to, data: _message, txNumberInBlock: uint16(_index)});

        bool success = zksync.proveL2MessageInclusion(
            _l2BlockNumber,
            _index,
            message,
            _proof
        );

        require(success, "Failed to prove message inclusion");

        _mint(to, tokenId);
        emit SentToLayer(1);
    }

    function _whichLayerIsToken(uint tokenId) override internal view returns (uint layer) {
        if (_exists(tokenId)) {
            return 1;
        } else {
            return 2;
        }
    }
}