// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MockAgentID
/// @notice TEST-ONLY minimal stand-in for the SPACE ID Agent ID ERC-721.
///         AgentProof only calls `balanceOf(address)`, so this mock
///         implements exactly that surface plus a free `mint` for tests.
///         NEVER deploy this to mainnet as a credential source.
contract MockAgentID {
    string public name = "SPACE ID Agent ID (Mock)";
    string public symbol = "AI";

    mapping(address => uint256) private _balances;

    function mint(address to) external {
        _balances[to] += 1;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }
}
