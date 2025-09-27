import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const CELO_ALFAJORES_RPC_URL = process.env.CELO_ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org";
const CELO_PRIVATE_KEY = process.env.CELO_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./.cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {},
    alfajores: {
      url: CELO_ALFAJORES_RPC_URL,
      chainId: 44787,
      accounts: CELO_PRIVATE_KEY !== "" ? [CELO_PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || ""
    }
  }
};

export default config;
