// Sources flattened with hardhat v2.29.2 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/AgentProof.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal surface of the SPACE ID Agent ID contract (ERC-721).
///         AgentProof only ever READS balances — it never transfers,
///         approves, or holds any asset.
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title AgentProof
/// @notice On-chain registry + attestation layer exclusively for Agent ID
///         holders. Holding an Agent ID (a name.ai identity NFT) is the one
///         and only credential: only holders can register a profile, and
///         only holders can attest to — or receive attestations from —
///         other holders.
/// @dev This contract holds NO user funds, has NO transfer/trade/approval
///      functions for user assets, and has NO owner/admin functions at all.
///      The Agent ID contract address is fixed at deployment (immutable).
contract AgentProof {
    /// @notice The official Agent ID contract on BNB Chain
    ///         (0x60b9262456de011f7d15a54cdd8c48baaa8b022f on mainnet).
    IAgentID public immutable agentId;

    struct Profile {
        string displayName;
        string skills;
        string endpointURI;
        bool exists;
    }

    struct Attestation {
        address from;
        uint8 category;
        string noteURI;
        uint256 timestamp;
    }

    mapping(address => Profile) private _profiles;
    address[] private _agents;
    mapping(address => Attestation[]) private _attestations;

    event ProfileRegistered(address indexed agent, string displayName);
    event ProfileUpdated(address indexed agent);
    event Attested(
        address indexed from,
        address indexed target,
        uint8 category,
        string noteURI
    );

    constructor(address agentIdAddress) {
        require(agentIdAddress != address(0), "AgentProof: zero address");
        agentId = IAgentID(agentIdAddress);
    }

    /// @notice True if `account` currently holds at least one Agent ID.
    function isAgent(address account) public view returns (bool) {
        return agentId.balanceOf(account) > 0;
    }

    modifier onlyAgent() {
        require(
            isAgent(msg.sender),
            "AgentProof: caller does not hold an Agent ID"
        );
        _;
    }

    /// @notice Register your agent profile, or update it if you already
    ///         have one. One profile per address. Agent ID holders only.
    /// @param displayName  Human-readable name of the agent.
    /// @param skills       Comma-separated skill tags.
    /// @param endpointURI  Off-chain pointer (URL / IPFS) to the agent's
    ///                     service description or contact endpoint.
    function registerProfile(
        string calldata displayName,
        string calldata skills,
        string calldata endpointURI
    ) external onlyAgent {
        bool isNew = !_profiles[msg.sender].exists;
        _profiles[msg.sender] = Profile({
            displayName: displayName,
            skills: skills,
            endpointURI: endpointURI,
            exists: true
        });
        if (isNew) {
            _agents.push(msg.sender);
            emit ProfileRegistered(msg.sender, displayName);
        } else {
            emit ProfileUpdated(msg.sender);
        }
    }

    /// @notice Attest to another Agent ID holder. Both the giver and the
    ///         target must hold an Agent ID. Self-attestation is rejected.
    /// @param target    Address receiving the attestation.
    /// @param category  Free-form category code (0-255), interpreted by
    ///                  frontends (e.g. 0=general, 1=delivered-work,
    ///                  2=collaboration, 3=reliability).
    /// @param noteURI   Off-chain pointer (URL / IPFS) to the attestation
    ///                  note or evidence.
    function attest(
        address target,
        uint8 category,
        string calldata noteURI
    ) external onlyAgent {
        require(target != msg.sender, "AgentProof: cannot attest yourself");
        require(
            isAgent(target),
            "AgentProof: target does not hold an Agent ID"
        );
        _attestations[target].push(
            Attestation({
                from: msg.sender,
                category: category,
                noteURI: noteURI,
                timestamp: block.timestamp
            })
        );
        emit Attested(msg.sender, target, category, noteURI);
    }

    /// @notice Read a profile. `exists` is false for unregistered addresses.
    function getProfile(
        address account
    )
        external
        view
        returns (
            string memory displayName,
            string memory skills,
            string memory endpointURI,
            bool exists
        )
    {
        Profile storage p = _profiles[account];
        return (p.displayName, p.skills, p.endpointURI, p.exists);
    }

    /// @notice How many attestations an address has received.
    function attestationCount(
        address account
    ) external view returns (uint256) {
        return _attestations[account].length;
    }

    /// @notice All attestations received by an address (newest last).
    function getAttestations(
        address account
    ) external view returns (Attestation[] memory) {
        return _attestations[account];
    }

    /// @notice Number of registered agent profiles.
    function totalAgents() external view returns (uint256) {
        return _agents.length;
    }

    /// @notice All registered agent addresses (registration order).
    function getAgents() external view returns (address[] memory) {
        return _agents;
    }
}
