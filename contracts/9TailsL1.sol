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
        zksync.requestL2Transaction{value: 0}(crossChainCounterpart, 0, abi.encodeWithSignature('receiveFromL1(uint256,address)', tokenId, ownerOf(tokenId)), 100000, new bytes[](0));
        _burn(tokenId);
        emit SentToLayer(2);
    }

    function receiveFromL2(
        address to,
        uint256 tokenId,
        address _zkSyncAddress,
        // zkSync block number in which the message was sent
        uint32 _l1BatchNumber,
        // Message index, that can be received via API
        uint256 _l1BatchTxIndex,
        uint256 _l2MessageIndex,
        // Merkle proof for the message
        bytes32[] calldata _proof
    ) external {
        require(!_exists(tokenId), "Token already minted");

        IZkSync zksync = IZkSync(_zkSyncAddress);

        bytes memory _message = abi.encode(tokenId, to);

        L2Message memory message = L2Message({sender: crossChainCounterpart, data: _message, txNumberInBlock: uint16(_l1BatchTxIndex)});

        bool success = zksync.proveL2MessageInclusion(
            _l1BatchNumber,
            _l2MessageIndex,
            message,
            _proof
        );

        require(success, "Failed to prove message inclusion");

        _mint(to, tokenId);
        emit ReceivedOnLayer(1);
    }

    function _whichLayerIsToken(uint tokenId) override internal view returns (uint layer) {
        if (_exists(tokenId)) {
            return 1;
        } else {
            return 2;
        }
    }
}