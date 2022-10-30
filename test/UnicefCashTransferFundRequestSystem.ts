import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("UnicefCashTransferFundRequestSystem", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAndInitializeFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, fundManager, nonFundManager, whitelistedIp, nonWhitelistedIP] = await ethers.getSigners();
    const initialFund = "1000000000000000000"
    const UnicefCashTransferFundRequestSystem = await ethers.getContractFactory("UnicefCashTransferFundRequestSystem");
    const unicefCashTransferFundRequestSystem = await UnicefCashTransferFundRequestSystem.deploy({ value: initialFund });

    await unicefCashTransferFundRequestSystem.addIP(whitelistedIp.address);
    await unicefCashTransferFundRequestSystem.addFundManager(fundManager.address);

    // create requets
    const tx = await unicefCashTransferFundRequestSystem.connect(whitelistedIp).requestFund("1", "request fund for testing", "1767143720");
    const result = await tx.wait();
    const requestId = result.events?.[0].args?.requestId;

    return { unicefCashTransferFundRequestSystem, initialFund, owner, fundManager, nonFundManager, whitelistedIp, nonWhitelistedIP, requestId };
  }

  describe("Deployment", function () {
    it("Should be able to deploy", async function () {
        await loadFixture(deployAndInitializeFixture);
    });

    it("Should have right initial amount of fund", async function () {
      const { unicefCashTransferFundRequestSystem, initialFund } = await loadFixture(deployAndInitializeFixture);
      expect(await ethers.provider.getBalance(unicefCashTransferFundRequestSystem.address)).to.equal(initialFund);
    });
  });

  describe("Requests", function () {
    describe("IP", function () {
      it("Whitelisted IP should be able to create request", async function () {
        const { unicefCashTransferFundRequestSystem, whitelistedIp } = await loadFixture(deployAndInitializeFixture);
        await expect(unicefCashTransferFundRequestSystem.connect(whitelistedIp).requestFund("1", "request fund for testing", "1767143720")).not.to.be.reverted;
      });

      it("non whitelisted IP should NOT be able to create request", async function () {
        const { unicefCashTransferFundRequestSystem, nonWhitelistedIP } = await loadFixture(deployAndInitializeFixture);
        await expect(unicefCashTransferFundRequestSystem.connect(nonWhitelistedIP).requestFund("1", "request fund for testing", "1767143720")).to.be.reverted;
      });

      it("Invalid request should fail", async function () {
        const { unicefCashTransferFundRequestSystem, whitelistedIp } = await loadFixture(deployAndInitializeFixture);
        await expect(unicefCashTransferFundRequestSystem.connect(whitelistedIp).requestFund("1", "request fund for testing", "0")).to.be.reverted;
      });
    });

    describe("Fund Manager", function () {
      it("Should be able to approve request", async function () {
        const { unicefCashTransferFundRequestSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);

        await expect(unicefCashTransferFundRequestSystem.connect(fundManager).approveRequest(requestId)).not.to.be.reverted;
      });

      it("Should be able to reject request", async function () {
        const { unicefCashTransferFundRequestSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);

        await expect(unicefCashTransferFundRequestSystem.connect(fundManager).rejectRequest(requestId)).not.to.be.reverted;      
      });

      it("Should be able to release fund", async function () {
        const { unicefCashTransferFundRequestSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);

        await expect(unicefCashTransferFundRequestSystem.connect(fundManager).approveRequest(requestId)).not.to.be.reverted;
        await expect(unicefCashTransferFundRequestSystem.connect(fundManager).releaseFund(requestId)).not.to.be.reverted;      
      });
    });

    describe("View", function () {
      it("Should be able to check request status", async function () {
        const { unicefCashTransferFundRequestSystem, fundManager, requestId } = await loadFixture(deployAndInitializeFixture);
        
        expect(await unicefCashTransferFundRequestSystem.checkRequestStatus(requestId)).to.equal(1); // pending
        
        await expect(unicefCashTransferFundRequestSystem.connect(fundManager).approveRequest(requestId)).not.to.be.reverted;

        expect(await unicefCashTransferFundRequestSystem.checkRequestStatus(requestId)).to.equal(2); // approved

      });
    });
  });
});
