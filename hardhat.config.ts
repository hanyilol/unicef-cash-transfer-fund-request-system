import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

    /**
   * blockchain networks for deployment and testing
   */
  defaultNetwork: "hardhat",
  networks: {
    // hardhat local network
    hardhat: {
      chainId: 31337,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 5,
      accounts: [process.env.PRIVATE_KEY ?? "account not provided"],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1, // A number used to multiply the results of gas estimation to give it some slack due to the uncertainty of the estimation process.
      timeout: 20000, // Timeout in ms for requests sent to the JSON-RPC server.
    },
  },

  /**
   * configure how your tests are run using the mocha entry,
   * which accepts the same options as https://mochajs.org/
   */
  mocha: {
    timeout: 40000,
  },

  /**
   * for etherscan (including both mainnet and testnets) operations, e.g contract verification
   */
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
