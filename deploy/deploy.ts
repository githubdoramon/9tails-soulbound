import { Wallet } from 'zksync-web3';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {

  const wallet = new Wallet(process.env.PVT_KEY!);

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact('NineTailsL2');

  const nineTailsL2 = await deployer.deploy(artifact, []);
  await nineTailsL2.deployed();

  // Show the contract info.
  const contractAddress = nineTailsL2.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  await hre.run("verify:verify", {
    address: contractAddress,
    contract: "contracts/9TailsL2.sol:NineTailsL2"
  });
}
