// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title GotBaseYet - Daily check-in contract
/// @notice Minimal contract for recording daily check-ins onchain
/// @dev Emits event only - cheapest possible onchain action
contract GotBaseYet {
    /// @notice Emitted when a user checks in
    /// @param user The address of the user checking in
    /// @param timestamp Block timestamp of the check-in
    event CheckedIn(address indexed user, uint256 timestamp);

    /// @notice Record a check-in for the caller
    /// @dev Simply emits an event, no storage writes for minimal gas
    function checkIn() external {
        emit CheckedIn(msg.sender, block.timestamp);
    }
}
