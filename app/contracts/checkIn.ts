// Minimal CheckIn contract for "Got $BASE Yet?" app
// This contract emits an event when user checks in - cheapest possible onchain action

export const CHECK_IN_CONTRACT_ADDRESS = "0x0D7718E9529758868C8541C0271802092541C700" as const;

// Minimal ABI - just the checkIn function that emits an event
export const CHECK_IN_ABI = [
  {
    type: "function",
    name: "checkIn",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
      },
    ],
  },
] as const;

// Solidity contract source (for reference/deployment):
/*
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GotBaseYet {
    event CheckedIn(address indexed user, uint256 timestamp);
    
    function checkIn() external {
        emit CheckedIn(msg.sender, block.timestamp);
    }
}
*/
