const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentProof", function () {
  let mock, proof, owner, alice, bob, carol;

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockAgentID");
    mock = await Mock.deploy();

    const Proof = await ethers.getContractFactory("AgentProof");
    proof = await Proof.deploy(await mock.getAddress());
  });

  it("isAgent reflects mock Agent ID balance", async function () {
    expect(await proof.isAgent(alice.address)).to.equal(false);
    await mock.mint(alice.address);
    expect(await proof.isAgent(alice.address)).to.equal(true);
  });

  it("register WITHOUT an Agent ID reverts", async function () {
    await expect(
      proof.connect(alice).registerProfile("Alice", "research", "https://a.example")
    ).to.be.revertedWith("AgentProof: caller does not hold an Agent ID");
  });

  it("register WITH a mock Agent ID succeeds and stores the profile", async function () {
    await mock.mint(alice.address);
    await expect(
      proof.connect(alice).registerProfile("Alice Agent", "research,data", "ipfs://alice")
    )
      .to.emit(proof, "ProfileRegistered")
      .withArgs(alice.address, "Alice Agent");

    const p = await proof.getProfile(alice.address);
    expect(p.displayName).to.equal("Alice Agent");
    expect(p.skills).to.equal("research,data");
    expect(p.endpointURI).to.equal("ipfs://alice");
    expect(p.exists).to.equal(true);
    expect(await proof.totalAgents()).to.equal(1);
  });

  it("profile update emits ProfileUpdated and keeps totalAgents at 1", async function () {
    await mock.mint(alice.address);
    await proof.connect(alice).registerProfile("Alice", "a", "uri-a");
    await expect(proof.connect(alice).registerProfile("Alice v2", "b", "uri-b"))
      .to.emit(proof, "ProfileUpdated")
      .withArgs(alice.address);
    const p = await proof.getProfile(alice.address);
    expect(p.displayName).to.equal("Alice v2");
    expect(await proof.totalAgents()).to.equal(1);
  });

  it("attest between two Agent ID holders succeeds", async function () {
    await mock.mint(alice.address);
    await mock.mint(bob.address);
    await proof.connect(bob).registerProfile("Bob", "trading", "ipfs://bob");

    await expect(proof.connect(alice).attest(bob.address, 1, "ipfs://note-1"))
      .to.emit(proof, "Attested")
      .withArgs(alice.address, bob.address, 1, "ipfs://note-1");

    expect(await proof.attestationCount(bob.address)).to.equal(1);
    const list = await proof.getAttestations(bob.address);
    expect(list.length).to.equal(1);
    expect(list[0].from).to.equal(alice.address);
    expect(list[0].category).to.equal(1);
    expect(list[0].noteURI).to.equal("ipfs://note-1");
  });

  it("attest TO a non-holder reverts", async function () {
    await mock.mint(alice.address);
    await expect(
      proof.connect(alice).attest(carol.address, 0, "ipfs://x")
    ).to.be.revertedWith("AgentProof: target does not hold an Agent ID");
  });

  it("attest FROM a non-holder reverts", async function () {
    await mock.mint(bob.address);
    await expect(
      proof.connect(carol).attest(bob.address, 0, "ipfs://x")
    ).to.be.revertedWith("AgentProof: caller does not hold an Agent ID");
  });

  it("self-attestation reverts", async function () {
    await mock.mint(alice.address);
    await expect(
      proof.connect(alice).attest(alice.address, 0, "ipfs://x")
    ).to.be.revertedWith("AgentProof: cannot attest yourself");
  });
});
