import { ethers } from "hardhat";

async function main() {

  const UnicefCashTransferApprovalSystem = await ethers.getContractFactory("UnicefCashTransferApprovalSystem");

  const unicefCashTransferApprovalSystem = await UnicefCashTransferApprovalSystem.deploy();

  await unicefCashTransferApprovalSystem.deployed();

  console.log(`deployed UnicefCashTransferApprovalSystem to ${unicefCashTransferApprovalSystem.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
