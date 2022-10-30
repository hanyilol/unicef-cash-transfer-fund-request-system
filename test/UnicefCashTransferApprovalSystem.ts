import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("UnicefCashTransferApprovalSystem", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAndInitializeFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, fundManager, nonFundManager, whitelistedIp, nonWhitelistedIP] = await ethers.getSigners();
    const initialFund = "1000000000000000000"
    const UnicefCashTransferApprovalSystem = await ethers.getContractFactory("UnicefCashTransferApprovalSystem");
    const unicefCashTransferApprovalSystem = await UnicefCashTransferApprovalSystem.deploy({ value: initialFund });

    await unicefCashTransferApprovalSystem.addIP(whitelistedIp.address);
    await unicefCashTransferApprovalSystem.addFundManager(fundManager.address);

    // create requets
    const tx = await unicefCashTransferApprovalSystem.connect(whitelistedIp).requestFund("1", "request fund for testing", "1767143720");
    const result = await tx.wait();
    const requestId = result.events?.[0].args?.requestId;

    return { unicefCashTransferApprovalSystem, initialFund, owner, fundManager, nonFundManager, whitelistedIp, nonWhitelistedIP, requestId };
  }

  describe("Deployment", function () {
    it("Should be able to deploy", async function () {
        await loadFixture(deployAndInitializeFixture);
    });

    it("Should have right initial amount of fund", async function () {
      const { unicefCashTransferApprovalSystem, initialFund } = await loadFixture(deployAndInitializeFixture);
      expect(await ethers.provider.getBalance(unicefCashTransferApprovalSystem.address)).to.equal(initialFund);
    });
  });

  describe("Requests", function () {
    describe("IP", function () {
      it("Whitelisted IP should be able to create request", async function () {
        const { unicefCashTransferApprovalSystem, whitelistedIp } = await loadFixture(deployAndInitializeFixture);
        await expect(unicefCashTransferApprovalSystem.connect(whitelistedIp).requestFund("1", "request fund for testing", "1767143720")).not.to.be.reverted;
      });

      it("non whitelisted IP should NOT be able to create request", async function () {
        const { unicefCashTransferApprovalSystem, nonWhitelistedIP } = await loadFixture(deployAndInitializeFixture);
        await expect(unicefCashTransferApprovalSystem.connect(nonWhitelistedIP).requestFund("1", "request fund for testing", "1767143720")).to.be.reverted;
      });

      it("Invalid request should fail", async function () {
        const { unicefCashTransferApprovalSystem, whitelistedIp } = await loadFixture(deployAndInitializeFixture);
        await expect(unicefCashTransferApprovalSystem.connect(whitelistedIp).requestFund("1", "request fund for testing", "0")).to.be.reverted;
      });
    });

    describe("Fund Manager", function () {
      it("Should be able to approve request", async function () {
        const { unicefCashTransferApprovalSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);

        await expect(unicefCashTransferApprovalSystem.connect(fundManager).approveRequest(requestId)).not.to.be.reverted;
      });

      it("Should be able to reject request", async function () {
        const { unicefCashTransferApprovalSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);

        await expect(unicefCashTransferApprovalSystem.connect(fundManager).rejectRequest(requestId)).not.to.be.reverted;      
      });

      it("Should be able to release fund", async function () {
        const { unicefCashTransferApprovalSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);

        await expect(unicefCashTransferApprovalSystem.connect(fundManager).approveRequest(requestId)).not.to.be.reverted;
        await expect(unicefCashTransferApprovalSystem.connect(fundManager).releaseFund(requestId)).not.to.be.reverted;      
      });
    });

    describe("View", function () {
      it("Should be able to check request status", async function () {
        const { unicefCashTransferApprovalSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);
        
        expect(await unicefCashTransferApprovalSystem.checkRequestStatus(requestId)).to.equal(1); // pending
        
        await expect(unicefCashTransferApprovalSystem.connect(fundManager).approveRequest(requestId)).not.to.be.reverted;

        expect(await unicefCashTransferApprovalSystem.checkRequestStatus(requestId)).to.equal(2); // approved

      });
    });
  });
});
