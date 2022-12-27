import { expect } from 'chai';
import { Contract, Wallet } from 'zksync-web3';
import * as hre from 'hardhat';
import * as zk from 'zksync-web3'
import { ethers } from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { L1_MESSENGER_ADDRESS } from 'zksync-web3/build/src/utils';
import { readFileSync } from 'fs';
import { ContractFactory } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

async function deployL2(deployer: Deployer): Promise<Contract> {
  const artifact = await deployer.loadArtifact('NineTailsL2');
  return await deployer.deploy(artifact)
}

describe('NineTails', function () {

  let provider: zk.Provider, nineTailsL1: Contract | null = null, nineTailsL2: Contract | null = null, wallet: Wallet | null

  before(async function () {
    wallet = new Wallet(RICH_WALLET_PK, provider);

    const l1Provider = new ethers.providers.JsonRpcProvider(hre.config.networks.zkTestnet.ethNetwork)
    const l1Deployer = new ethers.Wallet(wallet.privateKey, l1Provider)

    const jsonFilePath = `./artifacts/contracts/9TailsL1.sol/NineTailsL1.json`
    const json = JSON.parse(readFileSync(jsonFilePath, 'utf-8'))
    const factory = (await ethers.getContractFactory(json.abi, json.bytecode)) as ContractFactory
    const contractFactory = new ethers.ContractFactory(factory.interface, factory.bytecode, l1Deployer)
    const contract = await contractFactory.deploy()
    nineTailsL1 = await contract.deployed()

    provider = new zk.Provider(hre.config.networks.zkTestnet.url)

    const deployer = new Deployer(hre, wallet);

    nineTailsL2 = await deployL2(deployer);

    await nineTailsL1.setCrossChainCounterpart(nineTailsL2.address)
    await nineTailsL2.setCrossChainCounterpart(nineTailsL1.address)
  });

  it("Should deploy contract and mint them all on L2", async function () {
    expect(await nineTailsL2!.name()).to.eq('The Nine Tails');
    expect(await nineTailsL2!.symbol()).to.eq('TAIL');
    expect(await nineTailsL2!.ownerOf(0)).to.eq(wallet!.address);
    expect(await nineTailsL2!.ownerOf(8)).to.eq(wallet!.address);
  });

  it("Should deploy contract on L1 and have no NFTs", async function () {
    expect(await nineTailsL1!.name()).to.eq('The Nine Tails');
    expect(await nineTailsL1!.symbol()).to.eq('TAIL');
  });

  it("Should be able to remove from address", async function () {
    const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);
    
    const theTransfer = nineTailsL2!.transferFrom(wallet!.address, wallet2.address, 0)

    await expect(theTransfer).to.emit(nineTailsL2, "Transfer");
    expect(await nineTailsL2!.ownerOf(0)).to.eq(wallet2.address);
  });

   it("Can send from L2 to L1", async function () {
    const messageHash = keccak256(ethers.utils.defaultAbiCoder.encode([ "uint256", "address" ], [ 1, wallet!.address ]))
    expect(await nineTailsL2!.whichLayerIsToken(1)).to.eq(2);
    expect(await nineTailsL1!.whichLayerIsToken(1)).to.eq(2);

    const transferTx = await nineTailsL2!.transferToL1(1)
    await expect(transferTx).to.emit(nineTailsL2, "SentToLayer");
    const receipt = await transferTx.waitFinalize();

    const l2ToL1LogIndex = receipt.l2ToL1Logs.findIndex(
      (l2ToL1log) => l2ToL1log.sender == L1_MESSENGER_ADDRESS  && l2ToL1log.value == messageHash
    );

    const msgProof = await provider.getLogProof(receipt.transactionHash, l2ToL1LogIndex);
    
    const zkSyncAddress = await provider.getMainContractAddress();
    const tx = nineTailsL1!.receiveFromL2(wallet!.address, 1, zkSyncAddress, receipt.l1BatchNumber, receipt.l1BatchTxIndex, msgProof!.id, msgProof!.proof)
    await expect(tx).to.emit(nineTailsL1, "ReceivedOnLayer");
    expect(await nineTailsL1!.ownerOf(1)).to.eq(wallet!.address);
    expect(await nineTailsL2!.whichLayerIsToken(1)).to.eq(1);
    expect(await nineTailsL1!.whichLayerIsToken(1)).to.eq(1);
  });

  it("Can send from back L1 to L2", async function () {
    const tx = await nineTailsL1!.transferToL2(1, provider.getMainContractAddress())
    await tx.wait()
    await expect(tx).to.emit(nineTailsL1, "SentToLayer");
    
    const txL2Handle = await provider.getPriorityOpResponse(tx);
    await txL2Handle.wait()

    await expect(txL2Handle).to.emit(nineTailsL2, "ReceivedOnLayer");
    expect(await nineTailsL2!.whichLayerIsToken(1)).to.eq(2);  
    expect(await nineTailsL1!.whichLayerIsToken(1)).to.eq(2);  
  }); 

  it("Should fail trying to transfer to other address or L1", async function () {
    const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);

    await expect(nineTailsL2!.connect(wallet2).transferFrom(wallet2.address, wallet!.address, 0)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(nineTailsL2!.transferToL1(0)).to.be.revertedWith("Only owner can transfer token to L2");
  });

});
