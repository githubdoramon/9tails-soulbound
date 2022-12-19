import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';
import "@nomiclabs/hardhat-ethers";
import "@matterlabs/hardhat-zksync-chai-matchers";

// dynamically changes endpoints for local tests
const zkTestnet =
  process.env.NODE_ENV == 'test'
    ? {
        url: 'http://localhost:3050',
        ethNetwork: 'http://localhost:8545',
        zksync: true
      }
    : {
        url: 'https://zksync2-testnet.zksync.dev',
        ethNetwork: 'goerli',
        zksync: true
      };

module.exports = {
  zksolc: {
    version: '1.2.1',
    compilerSource: 'binary',
    settings: {
      optimizer: {
        enabled: true,
      }
    },
  },
  defaultNetwork: "zkTestnet",
  networks: {
    hardhat: {
      zksync: false,
    },
    zkTestnet,
  },
  solidity: {
    version: '0.8.16',
  },
};
