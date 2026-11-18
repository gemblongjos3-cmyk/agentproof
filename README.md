# AgentProof

**An on-chain registry and attestation layer exclusively for Agent ID holders.**

AgentProof is a BNB Chain dApp built for the Binance Agent ID Hackathon
(Innovation Award track). It turns an Agent ID from a passive name into a
working credential: the registry can only be written by Agent ID holders,
and reputation (attestations) can only flow between Agent ID holders.

## Live

- **App:** https://agentproof-app.netlify.app/
- **App (mirror, GitHub Pages):** https://gemblongjos3-cmyk.github.io/agentproof/
- **Contract (BSC mainnet):**
  [`0x2D2DB4937EaC14a97c65aE8BA475B7f013886050`](https://bscscan.com/address/0x2D2DB4937EaC14a97c65aE8BA475B7f013886050)
- **Source verification (Sourcify, exact match):**
  https://sourcify.dev/server/v2/contract/56/0x2D2DB4937EaC14a97c65aE8BA475B7f013886050?fields=sources,metadata,compilation

To use the app: connect a wallet that holds an Agent ID, then
`registerProfile(displayName, skills, endpointURI)` to join the registry,
and `attest(target, category, noteURI)` to vouch for another registered
agent. Both actions revert for non-holders — that is the point.

## How Agent ID is used (submission description)

Agent ID is the **core access-control and identity primitive** of
AgentProof — not a cosmetic integration:

- The AgentProof contract reads `balanceOf(address)` on the official
  SPACE ID Agent ID contract
  (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`, BNB Chain) on **every**
  write operation.
- `registerProfile(...)` reverts unless the caller currently holds an
  Agent ID. One address = one agent profile (name, skills, endpoint URI).
- `attest(...)` reverts unless **both** the giver and the target hold an
  Agent ID, and self-attestation is rejected. Reputation therefore exists
  only inside the verified Agent ID population.
- `isAgent(address)` exposes the same holder check as a public view, so
  any other dApp can reuse AgentProof + Agent ID as a gating primitive.

Use cases this enables: discoverable directory of real agents, portable
on-chain reputation for agent-to-agent work (delivered work,
collaboration, reliability), and a Sybil-resistant membership list —
every entry is backed by a non-transferable, one-per-user Agent ID.

## Architecture

```
contracts/
  AgentProof.sol   Registry + attestations. Immutable Agent ID reference.
  MockAgentID.sol  TEST-ONLY balanceOf mock for local tests. Never a
                   mainnet credential source.
test/
  AgentProof.test.js   Hardhat tests (gate, register, update, attest).
scripts/
  deploy.js            Deploys MockAgentID on testnets (or uses
                       AGENT_ID_ADDRESS); on mainnet defaults to the
                       official Agent ID contract.
frontend/
  index.html           Single-page UI (ethers.js via CDN): holder check,
                       register form, attestation form, agent directory.
hardhat.config.js      BSC testnet (97) + mainnet (56) network config.
```

Events `ProfileRegistered`, `ProfileUpdated`, and `Attested` are emitted
for off-chain indexing of the directory and reputation graph.

## Safety & owner permissions (hackathon red-line compliance)

- **The contract holds no user funds.** There is no payable function, no
  deposit, no withdrawal.
- **No asset functions at all:** no token transfers, no trading, no
  approvals (`approve`/`transferFrom` are never called or exposed for
  user assets). AgentProof only *reads* `balanceOf` on the Agent ID NFT
  contract.
- **No owner, no admin, no upgrade path.** `AgentProof` has **no owner**
  and **no administrative functions whatsoever** — nobody (including the
  deployer) can pause it, edit or delete profiles, forge or remove
  attestations, or change the Agent ID contract reference after
  deployment (it is `immutable`). The deployer can do exactly one thing
  any user cannot undo: nothing. Deployment is the last privileged act.
- **No return promises:** nothing in this project promises yield,
  income, or returns of any kind.
- **No brand impersonation:** the project and contract names do not use
  "Binance" or "BNB".
- **No credential collection:** the frontend never asks for seed
  phrases, private keys, or pairing codes; all signing happens in the
  user's own wallet with the transaction visible for confirmation.

## Run the tests

```bash
npm install
npx hardhat test
```

Expected coverage: registration reverts without an Agent ID, succeeds
with a (mock) Agent ID, profile updates keep a single registry entry,
attestations succeed between two holders, and attestations to/from
non-holders and self-attestations revert.

## Deploy

Testnet (deploys a mock Agent ID unless `AGENT_ID_ADDRESS` is set):

```bash
export DEPLOYER_PRIVATE_KEY=...   # from your own wallet; never commit it
npx hardhat run scripts/deploy.js --network bscTestnet
```

Mainnet (defaults to the official Agent ID contract):

```bash
export DEPLOYER_PRIVATE_KEY=...
npx hardhat run scripts/deploy.js --network bsc
```

After mainnet deployment: verify the source on BscScan (constructor
argument = the official Agent ID address), set `AGENTPROOF_ADDRESS` in
`frontend/index.html`, and host the static page.

## Live deployment (BSC mainnet)

- **AgentProof:** `0x2D2DB4937EaC14a97c65aE8BA475B7f013886050`
  (chainId 56), deploy tx
  `0xedc16b352ced0bd27bab3dde3b864fffe5d189e10bd9a372fb2aa2ca25002eba`.
- **Agent ID reference (constructor arg):**
  `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` (official, immutable).
- **Registered agents:** 3 (eireen.ai, odet777.ai, odet.ai) —
  `totalAgents()` = 3 as of 2026-11-18.
- **Source verification (Sourcify):** VERIFIED 2026-11-18 —
  **exact_match** (full match: creation + runtime bytecode and
  metadata all match), matchId 59467763, verifiedAt
  2026-11-18T12:24:53Z. Proof (Sourcify API v2, returns the match,
  source, and metadata):
  `https://sourcify.dev/server/v2/contract/56/0x2D2DB4937EaC14a97c65aE8BA475B7f013886050?fields=sources,metadata,compilation`
  `BSCSCAN_API_KEY` was not available, so the BscScan API/hardhat
  path could not run; Sourcify needs no account for BSC (chainId 56).
  Sourcify's automatic push to the Etherscan-family verifier hit its
  daily limit ("Daily limit of 500 source code submissions
  reached"), so BscScan may take time to reflect the match; the
  Sourcify exact_match is the canonical verification record.
- **Frontend:** `AGENTPROOF_ADDRESS` in `index.html` is set to the
  mainnet address; the page is hosted on Netlify:
  https://agentproof-app.netlify.app/
  (mirror on GitHub Pages: https://gemblongjos3-cmyk.github.io/agentproof/)

## Status

Phase 1 (build + local tests) complete; mainnet deployment and the
first 3 agent registrations are live (see above); source verified on
Sourcify (exact_match); frontend hosted on Netlify (mirror on GitHub
Pages). Remaining:
community growth to ≥30 registered Agent ID holders, and submission
(deadline: 9 Dec 2026, 15:00 WIB / 08:00 UTC).
