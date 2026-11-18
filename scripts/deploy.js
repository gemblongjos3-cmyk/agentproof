// AgentProof deploy script.
// Usage:
//   Testnet (uses a freshly deployed MockAgentID unless AGENT_ID_ADDRESS is set):
//     npx hardhat run scripts/deploy.js --network bscTestnet
//   Mainnet (Fase 3 — uses the OFFICIAL Agent ID contract by default):
//     AGENT_ID_ADDRESS=0x60b9262456de011f7d15a54cdd8c48baaa8b022f \
//     npx hardhat run scripts/deploy.js --network bsc
//
// The deployer key comes from DEPLOYER_PRIVATE_KEY in the environment.
// No private key is stored in this repository.

const OFFICIAL_AGENT_ID_BSC = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";

async function main() {
  const { ethers, network } = require("hardhat");
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer account — set DEPLOYER_PRIVATE_KEY.");
  console.log(`Network: ${network.name} | Deployer: ${deployer.address}`);

  let agentIdAddress = process.env.AGENT_ID_ADDRESS;

  if (!agentIdAddress) {
    if (network.name === "bsc") {
      agentIdAddress = OFFICIAL_AGENT_ID_BSC;
      console.log(`Using OFFICIAL Agent ID contract: ${agentIdAddress}`);
    } else {
      const Mock = await ethers.getContractFactory("MockAgentID");
      const mock = await Mock.deploy();
      await mock.waitForDeployment();
      agentIdAddress = await mock.getAddress();
      console.log(`Deployed MockAgentID (test only): ${agentIdAddress}`);
    }
  } else {
    console.log(`Using AGENT_ID_ADDRESS from env: ${agentIdAddress}`);
  }

  const Proof = await ethers.getContractFactory("AgentProof");
  const proof = await Proof.deploy(agentIdAddress);
  await proof.waitForDeployment();
  const proofAddress = await proof.getAddress();

  console.log(`AgentProof deployed: ${proofAddress}`);
  console.log(`agentId() -> ${await proof.agentId()}`);
  console.log(`totalAgents() -> ${await proof.totalAgents()}`);
  console.log("\nNext: verify on BscScan with constructor arg:", agentIdAddress);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
