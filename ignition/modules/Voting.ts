import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {
  // 1. Chuẩn bị danh sách ứng cử viên giả định để nạp vào hệ thống lúc đầu
  const candidateNames = ["Ứng viên 1: Alpha", "Ứng viên 2: Beta", "Ứng viên 3: Gamma"];

  // 2. Lệnh deploy Smart Contract có tên "Voting" và truyền danh sách vào constructor
  const voting = m.contract("Voting", [candidateNames]);

  return { voting };
});

export default VotingModule;