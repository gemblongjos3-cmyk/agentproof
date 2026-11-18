require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // BSC Testnet (chainId 97). Set DEPLOYER_PRIVATE_KEY in your shell env
    // or a local .env that is NEVER committed. No key lives in this repo.
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    // BSC Mainnet (chainId 56) — Fase 3, only after testnet sign-off.
    bsc: {
      url: process.env.BSC_RPC || "https://bsc-dataseed.bnbchain.org",
      chainId: 56,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    // For BscScan verification (Fase 3). Key comes from env only.
    apiKey: { bsc: process.env.BSCSCAN_API_KEY || "", bscTestnet: process.env.BSCSCAN_API_KEY || "" },
  },
};
