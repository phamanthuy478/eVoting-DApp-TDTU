import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// LẤY PRIVATE KEY CỦA VÍ ADMIN MỚI BƠM TIỀN DÁN VÀO ĐÂY
// ⚠️ Nhớ giữ lại chữ 0x ở đầu nhé (ví dụ: "0x123abc...")
const ADMIN_PRIVATE_KEY = "0x507c0ee61c90964034881122d8d558373edbf6e7581c2cb69066468d8ccdd223";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com", 
      accounts: [ADMIN_PRIVATE_KEY]   
    } as any
  }
};

export default config;