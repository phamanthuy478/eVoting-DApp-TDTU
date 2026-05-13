🗳️ Blockchain-based E-Voting System
Hệ thống Bầu cử Điện tử Phi tập trung - Ứng dụng kết hợp sức mạnh của công nghệ Blockchain (Ethereum/Solidity) và giao diện React hiện đại để đảm bảo tính minh bạch, bảo mật và trải nghiệm người dùng Real-time.

🌟 Tính năng nổi bật
Quản lý Cuộc bầu cử (Multi-Session): Admin có thể khởi tạo nhiệm kỳ mới, đặt tên cuộc bầu cử và thiết lập danh sách ứng viên linh hoạt mà không cần deploy lại hợp đồng.

Nạp Cử tri hàng loạt (Batch Whitelist): Hỗ trợ upload file Excel/CSV để cấp quyền bầu cử cho hàng trăm sinh viên cùng lúc, tối ưu hóa phí Gas.

Đồng bộ Real-time (Ajax-style): Số lượt bình chọn và trạng thái hòm phiếu tự động cập nhật trên mọi thiết bị ngay khi có biến động trên Blockchain mà không cần tải lại trang (F5).

Blockchain Explorer (Live): Tích hợp bảng theo dõi lịch sử giao dịch trực tiếp từ mạng lưới, minh bạch hóa mọi thao tác của cử tri và admin.

Quản lý Ứng viên: Cho phép Admin thêm mới hoặc sửa tên ứng cử viên ngay trên giao diện trước khi cuộc bầu cử bắt đầu.

🛠️ Công nghệ sử dụng
Smart Contract: Solidity (v0.8.24).

Blockchain Network: Ethereum Sepolia Testnet.

Frontend: React (Vite + TypeScript), Ethers.js (v6).

Công cụ phát triển: Hardhat, Remix IDE, Vercel.

Thư viện hỗ trợ: PapaParse (Xử lý CSV), CSS Variables (Aesthetic UI).

🚀 Hướng dẫn cài đặt
1. Yêu cầu hệ thống
Node.js (v18 trở lên).

Ví MetaMask đã cấu hình mạng Sepolia và có Sepolia ETH.

2. Cài đặt Frontend
Bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện
npm install

# Chạy ứng dụng ở môi trường local
npm run dev
3. Cấu hình Smart Contract
Deploy file Voting.sol lên mạng Sepolia thông qua Remix hoặc Hardhat.

Cập nhật địa chỉ hợp đồng mới vào biến CONTRACT_ADDRESS trong file App.tsx.

Cập nhật file Voting.json (ABI) nếu có thay đổi logic contract.

📖 Hướng dẫn sử dụng
Kết nối ví
Người dùng nhấn "Kết nối ví MetaMask" để đăng nhập. Hệ thống sẽ tự động nhận diện quyền Admin dựa trên địa chỉ ví.

Khu vực Admin
Sử dụng nút Bắt đầu/Kết thúc để điều khiển hòm phiếu.

Sử dụng tính năng Nạp cử tri từ Excel để cấp quyền biểu quyết hàng loạt.

Nhập tên và danh sách mới để Reset hệ thống cho nhiệm kỳ bầu cử tiếp theo.

Khu vực Cử tri
Theo dõi danh sách ứng cử viên và số phiếu On-chain.

Nhấn Bầu chọn và xác nhận trên MetaMask (chỉ thực hiện được khi đã được Whitelist và hòm phiếu đang mở).

Lĩnh vực nghiên cứu: Software Engineering, Blockchain Technology, AI & Machine Learning.
