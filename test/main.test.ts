import { expect } from 'chai';
import { Contract, Wallet } from 'zksync-web3';
import * as hre from 'hardhat';
import * as zk from 'zksync-web3'
import { ethers } from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { L1_MESSENGER_ADDRESS } from 'zksync-web3/build/src/utils';
import { readFileSync } from 'fs';
import { ContractFactory } from 'ethers';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

async function deployL2(deployer: Deployer): Promise<Contract> {
  const artifact = await deployer.loadArtifact('NineTailsL2');
  return await deployer.deploy(artifact)
}

describe('NineTails', function () {

  let provider, nineTailsL1: Contract | null = null, nineTailsL2: Contract | null = null

  before(async function () {
    const wallet = new Wallet(RICH_WALLET_PK, provider);

    const l1Provider = new ethers.providers.JsonRpcProvider(hre.config.networks.zkTestnet.ethNetwork)
    const l1Deployer = new ethers.Wallet(wallet.privateKey, l1Provider)

    const jsonFilePath = `./artifacts/contracts/9TailsL1.sol/NineTailsL1.json`
    const json = JSON.parse(readFileSync(jsonFilePath, 'utf-8'))
    console.log(json.bytecode)
    const factory = (await ethers.getContractFactory(json.abi, json.bytecode)) as ContractFactory
    const contractFactory = new ethers.ContractFactory(factory.interface, factory.bytecode, l1Deployer)
    const contract = await contractFactory.deploy()
    nineTailsL1 = await contract.deployed()

    provider = new zk.Provider(hre.config.networks.zkTestnet.url)

    const deployer = new Deployer(hre, wallet);

    nineTailsL2 = await deployL2(deployer);

   
  });

  it("Should deploy contract and mint them all on L2", async function () {

    const wallet = new Wallet(RICH_WALLET_PK, provider);

    expect(await nineTailsL2!.name()).to.eq('The Nine Tails');
    expect(await nineTailsL2!.symbol()).to.eq('TAIL');
    expect(await nineTailsL2!.ownerOf(0)).to.eq(wallet.address);
    expect(await nineTailsL2!.ownerOf(8)).to.eq(wallet.address);
  });

  it("Should deploy contract on L1 and have no NFTs", async function () {
    console.log(nineTailsL1)
    expect(await nineTailsL1!.name()).to.eq('The Nine Tails');
    expect(await nineTailsL1!.symbol()).to.eq('TAIL');
  });

  it("Should be able to remove from address", async function () {

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);
    
    const theTransfer = nineTailsL2!.transferFrom(wallet.address, wallet2.address, 0)

    await expect(theTransfer).to.emit(nineTailsL2, "Transfer");
    expect(await nineTailsL2!.ownerOf(0)).to.eq(wallet2.address);
  });

   it("Can send from L2 to L1", async function () {

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const transferTx = await nineTailsL2!.transferToL1(1)
    const receipt = await transferTx.waitFinalize();

    let data, index
    for(const log of receipt.logs) {
      if(log.address === L1_MESSENGER_ADDRESS) {
          data = log.topics[2]    
          index = log.logIndex  
      }
    }
    const msgProof = await provider.getMessageProof(receipt.blockNumber, nineTailsL2!.address, data);

    const zkSyncAddress = await provider.getMainContractAddress();
    const tx = await nineTailsL1!.receiveFromL2(wallet.address, 1, zkSyncAddress, receipt.blockNumber, index, msgProof.proof)
    const l1Receipt = await tx.wait()

    expect(await nineTailsL1!.exists(1)).to.eq(wallet.address);
  });

  // it("Should fail trying to transfer to other address or L1", async function () {

  //   const wallet = new Wallet(RICH_WALLET_PK, provider);
  //   const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);

  //   await expect(nineTailsL2!.connect(wallet2).transferFrom(wallet2.address, wallet.address, 0)).to.be.revertedWith("Ownable: caller is not the owner");
  //   await expect(nineTailsL2!.transferToL1(0)).to.be.revertedWith("Only owner can transfer token to L2");
  // });


});
