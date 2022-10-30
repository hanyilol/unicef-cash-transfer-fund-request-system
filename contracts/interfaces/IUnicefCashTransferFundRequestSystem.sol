// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IUnicefCashTransferFundRequestSystem {

  enum RequestStatus{ Undefined, Pending, Approved, Rejected, FundReleased }

  function requestFund(uint amount, string memory purpose, uint deadline) external returns (bytes32);
  function approveRequest(bytes32 requestId) external;
  function rejectRequest(bytes32 requestId) external;
  // This is just a dummy method to mimic the cash settlement behavior (We use physical cash)
  function releaseFund(bytes32 requestId) external;
  function checkRequestStatus(bytes32 requestId) external view returns (RequestStatus);
}