// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/IUnicefCashTransferApprovalSystem.sol";


contract UnicefCashTransferApprovalSystem is IUnicefCashTransferApprovalSystem, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct Request {
        bytes32 requestId; // unique identifier for the request
        IUnicefCashTransferApprovalSystem.RequestStatus requestStatus;
        uint256 timestamp; // time when this request is received
        address ip; // address of implementing partner who sent the request
        uint256 amount; // amount of fund requested. Here we assume the unit is in WEI.
        string purpose; // purpose of the fund
        uint256 deadline; // if the fund need to be received before some deadline
    }
    // only whitelisted implementing patners can request funds.
    mapping(address => bool) public whitelistedIPs;
    // only fund manager can approve/reject/release fund
    mapping(address => bool) public fundManagers;
    // mapping between requestId and request for all received requests
    mapping(bytes32 => Request) private requests;
    // mapping between implementing partner and requests they've sent
    mapping(address => bytes32[]) private requestsByIP;
    // an increasing sequence number for request Id generating (to avoid collision)
    uint256 nonce = 0;

    constructor() payable {
        // make owner the first fund manager
        fundManagers[owner()] = true;
    }
    
    modifier onlyFundManager() {
        require(fundManagers[msg.sender], "only fund manager can operate on requests");
        _;
    }

    function requestFund(uint amount, string memory purpose, uint deadline) 
        external 
        override 
        returns (bytes32) 
    {
        validateRequest(amount, purpose, deadline, msg.sender);
        bytes32 requestId = keccak256(abi.encodePacked(amount, purpose, deadline, msg.sender, block.timestamp, nonce++));
        // create Request
        Request storage request = requests[requestId];
        request.requestId = requestId;
        request.requestStatus = IUnicefCashTransferApprovalSystem.RequestStatus.Pending;
        request.timestamp = block.timestamp;
        request.ip = msg.sender;
        request.amount = amount;
        request.purpose = purpose;
        request.deadline = deadline;
        // add requestId to the IP's requests list
        requestsByIP[msg.sender].push(requestId);

        emit RequestCreated(requestId, msg.sender);

        return requestId;
    }

    // a set of rules validating the request.
    // throw error if it's not a valid request.
    function validateRequest(uint amount, string memory purpose, uint deadline, address implementingPartner) 
        internal
        view
    {
        require(whitelistedIPs[implementingPartner], "only whitelisted IPs can send request");
        require(amount > 0, "requested fund amount must be larger than 0");
        require(bytes(purpose).length > 0, "please state the purpose for the fund");
        require(deadline - block.timestamp > 7 * 24 * 60 * 60, "deadline too close: we need at least 7 days to process you request");
    }

    function approveRequest(bytes32 requestId) external onlyFundManager {
        Request storage request = requests[requestId];
        require(request.requestStatus == IUnicefCashTransferApprovalSystem.RequestStatus.Pending, "request is not pending");
        request.requestStatus = IUnicefCashTransferApprovalSystem.RequestStatus.Approved;

        emit RequestApproved(requestId, msg.sender);
    }

    function rejectRequest(bytes32 requestId) external onlyFundManager {
        Request storage request = requests[requestId];
        require(
            request.requestStatus == IUnicefCashTransferApprovalSystem.RequestStatus.Pending || 
            request.requestStatus == IUnicefCashTransferApprovalSystem.RequestStatus.Approved, 
            "request must be in pending or approved state"
        );
        request.requestStatus = IUnicefCashTransferApprovalSystem.RequestStatus.Rejected;

        emit RequestRejected(requestId, msg.sender);
    }

    // This is just a dummy method to mimic the cash settlement behavior (We use physical cash)
    function releaseFund(bytes32 requestId) external onlyFundManager nonReentrant {
        Request storage request = requests[requestId];
        require(request.requestStatus == IUnicefCashTransferApprovalSystem.RequestStatus.Approved, "request is not approved");
        request.requestStatus = IUnicefCashTransferApprovalSystem.RequestStatus.FundReleased;

        // dummy implementation for sending fund to IP;
        
        // address payable ip = payable(request.ip);
        // bool success = ip.send(request.amount);
        // require(success, "Failed to send fund");

        emit FundReleased(requestId, msg.sender);
    }

    // check request status.
    // for request that doesn't exist, the status would be IUnicefCashTransferApprovalSystem.RequestStatus.Undefined
    function checkRequestStatus(bytes32 requestId) external view returns (RequestStatus) {
        return requests[requestId].requestStatus;
    }

    /* ========== Access Control ========== */
    function addIP(address ip) external onlyOwner {
        require(!whitelistedIPs[ip], "ip already whitelisted");
        whitelistedIPs[ip] = true;

        emit IPAdded(ip);
    }

    function removeIP(address ip) external onlyOwner {
        require(whitelistedIPs[ip], "ip not whitelisted");
        whitelistedIPs[ip] = false;
        // we keep history requets from this ip in requestsByIP for auditing purpose

        emit IPRemoved(ip);
    }

    function addFundManager(address fundManager) external onlyOwner {
        require(!fundManagers[fundManager], "already a fund manager");
        fundManagers[fundManager] = true;

        emit FundManagerAdded(fundManager);
    }

    function removeFundManager(address fundManager) external onlyOwner {
        require(fundManagers[fundManager], "not a fund manager");
        fundManagers[fundManager] = false;

        emit FundManagerRemoved(fundManager);
    }

    /* ========== EVENTS ========== */
    event RequestCreated(bytes32 indexed requestId, address indexed ip);
    event RequestApproved(bytes32 indexed requestId, address indexed fundManager);
    event RequestRejected(bytes32 indexed requestId, address indexed fundManager);
    event FundReleased(bytes32 indexed requestId, address indexed fundManager);

    event IPAdded(address indexed ip);
    event IPRemoved(address indexed ip);
    event FundManagerAdded(address indexed fundManager);
    event FundManagerRemoved(address indexed fundManager);

}
