cat << 'EOF' > README.md
# 🗳️Blockchain-based E-Voting System

Ứng dụng giải quyết bài toán minh bạch trong bầu cử bằng công nghệ Blockchain, hỗ trợ đa nhiệm kỳ và đồng bộ dữ liệu Real-time.

## 🌟 Tính năng cốt lõi

* **Quản lý Đa nhiệm kỳ (Multi-Session):** Cho phép Admin khởi tạo các cuộc bầu cử mới (Lớp trưởng, Lớp phó, Đoàn khoa...) trên cùng một Smart Contract mà không cần deploy lại.
* **Cấp quyền hàng loạt (Batch Whitelist):** Tích hợp tính năng Upload file Excel/CSV để nạp danh sách hàng trăm ví cử tri cùng lúc, giúp tiết kiệm thời gian và phí Gas.
* **Đồng bộ Real-time (Ajax-style):** Sử dụng cơ chế lắng nghe Event từ Blockchain để cập nhật số phiếu và trạng thái hòm phiếu ngay lập tức trên mọi thiết bị mà không cần F5.
* **Blockchain Explorer tích hợp:** Theo dõi lịch sử giao dịch trực tiếp (TxHash) ngay trên giao diện, đảm bảo tính công khai và minh bạch.
* **Quản trị linh hoạt:** Admin có quyền thêm mới hoặc chỉnh sửa tên ứng cử viên ngay cả khi cuộc bầu cử chưa bắt đầu.

## 🛠️ Công nghệ sử dụng

* **Smart Contract:** Solidity (v0.8.24) triển khai trên mạng Ethereum Sepolia.
* **Frontend:** React (Vite + TypeScript) giúp tối ưu hiệu năng và quản lý kiểu dữ liệu chặt chẽ.
* **Thư viện kết nối:** Ethers.js (v6) để giao tiếp với mạng lưới Blockchain.
* **Xử lý dữ liệu:** PapaParse hỗ trợ đọc và phân tách địa chỉ ví từ file CSV/Excel.
* **Giao diện:** CSS Modern với biến số (Variables) tạo môi trường digital minimalist và thẩm mỹ.

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### 1. Chuẩn bị
* Cài đặt **Node.js** (v18+) và ví **MetaMask**.
* Đảm bảo ví có một ít **Sepolia ETH** để làm phí giao dịch.

### 2. Cài đặt môi trường
\`\`\`bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện cần thiết
npm install
\`\`\`

### 3. Cấu hình Smart Contract
* Deploy file `Voting.sol` lên Remix IDE (chọn môi trường Injected Provider - MetaMask).
* Copy địa chỉ hợp đồng sau khi deploy thành công.
* Mở file `src/App.tsx`, tìm biến `CONTRACT_ADDRESS` và dán địa chỉ mới vào.
* Cập nhật nội dung ABI trong file `src/Voting.json` từ Remix.

### 4. Khởi chạy
\`\`\`bash
# Chạy ở môi trường phát triển
npm run dev
\`\`\`

## 📖 Hướng dẫn sử dụng cho Admin

1.  **Thiết lập:** Nhập tên cuộc bầu cử và danh sách ứng viên (cách nhau bởi dấu phẩy) rồi nhấn **Xác nhận Reset**.
2.  **Cấp quyền:** Chọn file CSV chứa danh sách ví để thực hiện **Batch Whitelist**.
3.  **Điều khiển:** Nhấn nút **Bắt đầu** để mở hòm phiếu. Khi kết thúc thời gian bình chọn, nhấn **Kết thúc** để đóng hòm và chốt kết quả.

## 👤 Thông tin tác giả

* **Tác giả:** Nhóm 11
* **Đơn vị:** Khoa Công nghệ thông tin - Đại học Tôn Đức Thắng (TDTU)
* **Lĩnh vực nghiên cứu:** Software Engineering, Blockchain Technology, AI & Machine Learning.

---
*Dự án được thực hiện với mục tiêu minh bạch hóa quy trình bầu cử trong môi trường giáo dục.*
EOF
