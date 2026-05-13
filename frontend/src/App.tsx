import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import VotingJSON from './Voting.json';
import './index.css';
import Papa from 'papaparse';

declare global {
  interface Window {
    ethereum: any;
  }
}

// ⚠️ THAY ĐỊA CHỈ CONTRACT VÀO ĐÂY
const CONTRACT_ADDRESS = "0xdE7A7a7B678E4fCac8152CFea324b486b79034eB";

function App() {
  const [account, setAccount] = useState<string>("");
  const [adminAddress, setAdminAddress] = useState<string>("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [whitelistInput, setWhitelistInput] = useState("");
  const [activeTab, setActiveTab] = useState("vote");
  const [votingStatus, setVotingStatus] = useState<number>(0); 
  //const [voteLogs, setVoteLogs] = useState([]);
  
  
  // BIẾN QUAN TRỌNG: Dùng chung Hợp đồng cho toàn bộ App
  const [votingContract, setVotingContract] = useState<any>(null);

  
  // --- MỚI: Biến lưu trữ Lịch sử Giao dịch (TxHash) ---
  const [txHistory, setTxHistory] = useState<{action: string, hash: string, time: string}[]>([]);

  const [newElectionName, setNewElectionName] = useState("");
  const [newCandidateList, setNewCandidateList] = useState(""); // Chuỗi tên cách nhau bởi dấu phẩy
  const [currentElectionName, setCurrentElectionName] = useState("");
  // Hàm phụ trợ: Thêm giao dịch vào lịch sử hiển thị
  // const addTxToHistory = (action: string, hash: string) => {
  //   const time = new Date().toLocaleTimeString('vi-VN');
  //   setTxHistory(prev => [{action, hash, time}, ...prev]);
  // };

// 1. Theo dõi đổi ví và mạng (Gộp lại cho gọn)
  useEffect(() => {
    if (window.ethereum) {
      const handleReload = () => window.location.reload();
      window.ethereum.on('accountsChanged', handleReload);
      window.ethereum.on('chainChanged', handleReload);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleReload);
        window.ethereum.removeListener('chainChanged', handleReload);
      };
    }
  }, []);

  // 2. Lấy dữ liệu ban đầu
  useEffect(() => {
    loadData();
  }, [account]);

  const loadData = useCallback(async () => {
    if (!votingContract) return;

    try {
      // Thêm dòng này để log xem máy có thực sự chạy loadData không
      console.log("An tổng ơi, hệ thống đang đồng bộ dữ liệu mới nhất...");

      const [eName, data, admin, vStatus] = await Promise.all([
        votingContract.electionName(),
        votingContract.getAllCandidates(),
        votingContract.admin(),
        votingContract.status()
      ]);

      setCurrentElectionName(eName || "Hệ thống Bầu cử Điện tử");
      
      // QUAN TRỌNG: Phải tạo mảng mới hoàn toàn như vầy thì số phiếu mới nhảy
      setCandidates([...data]); 
      
      setAdminAddress(admin.toLowerCase());
      setVotingStatus(Number(vStatus));
    } catch (error) {
      console.error("Lỗi đồng bộ số phiếu:", error);
    }
  }, [votingContract]); // Chỉ tạo lại khi contract thay đổi
  
  // 3. ĐỒNG BỘ EXPLORER (Lấy lịch sử + Lắng nghe Real-time cho mọi sự kiện)
  useEffect(() => {
    if (!votingContract) return;

    const syncEverything = async () => {
      try {
        // --- PHẦN 1: LẤY LỊCH SỬ (HISTORY) ---
        // Phần này giúp khi F5 web vẫn thấy các giao dịch cũ
        const voteFilter = votingContract.filters.VoteCasted();
        const whitelistFilter = votingContract.filters.VoterWhitelisted();
        const statusFilter = votingContract.filters.StatusChanged();

        const [votes, whitelists, statuses] = await Promise.all([
          votingContract.queryFilter(voteFilter),
          votingContract.queryFilter(whitelistFilter),
          votingContract.queryFilter(statusFilter)
        ]);

        const history = [
          ...votes.map((e: any) => ({ action: `🗳️ Ví ${e.args[0].slice(0,6)}... đã vote ID: ${e.args[1]}`, hash: e.transactionHash, time: "On-chain" })),
          ...whitelists.map((e: any) => ({ action: `🔐 Cấp quyền cho: ${e.args[0].slice(0,6)}...`, hash: e.transactionHash, time: "On-chain" })),
          ...statuses.map((e: any) => ({ action: `⚙️ Trạng thái: ${Number(e.args[0]) === 1 ? "Đang diễn ra" : "Đã kết thúc"}`, hash: e.transactionHash, time: "On-chain" }))
        ].sort((a, b) => b.hash.localeCompare(a.hash)); 

        setTxHistory(history);
      } catch (error) {
        console.error("Lỗi lấy lịch sử:", error);
      }
    };

    // --- PHẦN 2: LẮNG NGHE REAL-TIME (QUAN TRỌNG) ---
    // Phần này giúp các máy khác tự nhảy số mà KHÔNG cần F5
    const handleEvent = (voter: any, id: any, event: any) => {
      // Khi có người vote, cập nhật lịch sử Explorer
      const newEntry = { 
        action: `🔥 MỚI: ${voter.slice(0,6)}... vừa vote ID: ${id}`, 
        hash: event.transactionHash, 
        time: new Date().toLocaleTimeString() 
      };
      setTxHistory(prev => [newEntry, ...prev]);
      
      // LỆNH QUAN TRỌNG NHẤT: Ép tất cả các máy đang mở web phải load lại data
      loadData(); 
    };

    const handleStatus = (newStatus: any, event: any) => {
      const statusText = Number(newStatus) === 1 ? "Đang diễn ra" : "Đã kết thúc";
      setTxHistory(prev => [{ 
        action: `📢 MỚI: Hòm phiếu đã ${statusText}`, 
        hash: event.transactionHash, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
      
      setVotingStatus(Number(newStatus));
      loadData(); 
    };

    // Gắn "tai nghe" vào Blockchain
    votingContract.on("VoteCasted", handleEvent);
    votingContract.on("StatusChanged", handleStatus);
    votingContract.on("VoterWhitelisted", loadData); // Cấp quyền xong cũng load lại data

    // Chạy đồng bộ lịch sử lần đầu
    syncEverything();
    loadData();

    // Dọn dẹp tai nghe khi thoát trang (để không bị lag máy)
    return () => {
      votingContract.off("VoteCasted", handleEvent);
      votingContract.off("StatusChanged", handleStatus);
      votingContract.off("VoterWhitelisted", loadData);
    };
  }, [votingContract, loadData]); // Hai biến này thay đổi thì useEffect sẽ chạy lại // Cực kỳ quan trọng: Lắng nghe dựa trên contract và loadData

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        // KHỞI TẠO LUÔN CONTRACT TẠI ĐÂY
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, provider);
        setVotingContract(contract); // Sử dụng hàm setVotingContract ở đây

      } catch (error) {
        console.error("Lỗi kết nối:", error);
      }
    } else {
      alert("Vui lòng cài đặt MetaMask!");
    }
  };

  

  const handleStartElection = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      const tx = await contract.startElection();
      // Bắt mã Hash và đẩy lên UI ngay lập tức
      //addTxToHistory("Mở hòm phiếu", tx.hash); 
      await tx.wait();
      alert("🟢 Đã mở hòm phiếu thành công!");
      loadData();
    } catch (error) {
      alert("Lỗi: Không thể mở hòm phiếu");
    }
  };

  const handleEndElection = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      const tx = await contract.endElection();
      //addTxToHistory("Đóng hòm phiếu", tx.hash);
      await tx.wait();
      alert("🔴 Đã đóng hòm phiếu!");
      loadData();
    } catch (error) {
      alert("Lỗi: Không thể đóng hòm phiếu");
    }
  };

  const handleWhitelist = async () => {
    if (!whitelistInput) return alert("Vui lòng nhập địa chỉ ví!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      const tx = await contract.whitelistVoter(whitelistInput);
      //addTxToHistory(`Cấp quyền Whitelist cho ${whitelistInput.slice(0,6)}...`, tx.hash);
      await tx.wait();
      alert(`✅ Đã cấp quyền biểu quyết thành công!`);
      setWhitelistInput("");
    } catch (error: any) {
      alert("❌ Lỗi: Ví này đã được cấp quyền, hoặc cuộc bầu cử đã kết thúc!");
    }
  };

  const handleStartNewElection = async () => {
    if (!newElectionName || !newCandidateList) return alert("Vui lòng nhập đủ thông tin!");
    
    const candidateArray = newCandidateList.split(",").map(name => name.trim());
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);

    try {
      alert("Đang khởi tạo nhiệm kỳ mới...");
      const tx = await contract.startNewElection(newElectionName, candidateArray);
      await tx.wait();
      alert("✨ Đã tạo cuộc bầu cử mới thành công!");
      setNewElectionName("");
      setNewCandidateList("");
      loadData(); // Tải lại giao diện
    } catch (error) {
      console.error(error);
      alert("Lỗi: Không thể khởi tạo");
    }
  };
  
// --- MỚI: Cấp quyền hàng loạt từ Excel ---
  const handleBatchWhitelist = async (voters: string[]) => {
    if (!votingContract) return alert("Hợp đồng chưa sẵn sàng!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      alert(`Đang nạp ${voters.length} ví... đợi chút nhé!`);
      const tx = await contract.batchWhitelist(voters);
      await tx.wait();
      alert("✅ Đã nạp danh sách cử tri thành công!");
    } catch (error) {
      alert("Lỗi: Không thể nạp hàng loạt.");
    }
  };

  // --- MỚI: Thêm 1 ứng cử viên ---
  const handleAddCandidate = async (name: string) => {
    if (!name) return alert("Nhập tên ứng viên đi bạn ơi!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      const tx = await contract.addCandidate(name);
      await tx.wait();
      alert(`✨ Đã thêm ứng viên: ${name}`);
      loadData(); // Tải lại danh sách
    } catch (error) {
      alert("Lỗi: Chỉ có thể thêm khi hòm phiếu chưa bắt đầu!");
    }
  };

  // --- MỚI: Sửa tên ứng cử viên ---
  const handleEditCandidate = async (id: number) => {
    const newName = prompt("Nhập tên mới cho ứng cử viên:");
    if (!newName) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      const tx = await contract.updateCandidate(id, newName);
      await tx.wait();
      alert("✅ Đã cập nhật tên ứng viên!");
      loadData();
    } catch (error) {
      alert("Lỗi: Không thể sửa tên.");
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (results) => {
        // Ép kiểu sang string[] để fix lỗi TypeScript
        const addresses = results.data
          .flat()
          .map((addr: any) => String(addr).trim())
          .filter((addr: string) => addr.startsWith("0x")) as string[];
        
        if (addresses.length > 0) {
          alert(`Đã tìm thấy ${addresses.length} địa chỉ ví. Đang tiến hành cấp quyền...`);
          await handleBatchWhitelist(addresses);
        } else {
          alert("Không tìm thấy địa chỉ ví 0x nào trong file!");
        }
      }
    });
  };

  const vote = async (id: number) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingJSON, signer);
    try {
      alert("Đang gửi phiếu bầu lên Blockchain...");
      const tx = await contract.vote(id);
      //addTxToHistory(`Bầu chọn cho ứng viên ID: ${id}`, tx.hash);
      await tx.wait(); 
      alert("🎉 Bỏ phiếu thành công!");
      loadData(); 
    } catch (error: any) {
      alert("❌ Lỗi: Hòm phiếu đang đóng, chưa được cấp quyền, hoặc bạn đã vote rồi!");
    }
  };

  if (!account) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <div className="logo-icon">🗳️</div>
          <div className="logo-title">BlockVote DApp</div>
          <p style={{textAlign:'center', color:'var(--muted)', marginTop:'8px'}} className="mono">Decentralized E-Voting System</p>
          <button className="btn-primary" onClick={connectWallet}>🦊 Kết nối ví MetaMask</button>
        </div>
      </div>
    );
  }

  const isAdmin = account.toLowerCase() === adminAddress;

  return (
    <div>
      <div className="header">
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{fontSize:'24px'}}>🗳️</div>
          <div style={{fontWeight:'bold', fontSize:'18px', color:'var(--accent)'}}>BlockVote</div>
        </div>
        <div className="wallet-badge">🦊 {account.slice(0,6)}...{account.slice(-4)}</div>
      </div>

      <div className="nav">
        <button className={`nav-btn ${activeTab === 'vote' ? 'active' : ''}`} onClick={() => setActiveTab('vote')}>🗳️ Khu vực Bỏ phiếu</button>
        {isAdmin && (
          <button className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>⚙️ Quản lý (Admin)</button>
        )}
      </div>

      <div className="main">
        {activeTab === 'vote' && (
          <div>
            <div className="card">
              <div className="card-title">{currentElectionName}</div>
              <p style={{color:'var(--muted)', fontSize:'14px', marginBottom:'20px'}}>
                Trạng thái: 
                {votingStatus === 0 ? <span style={{color:'orange', marginLeft:'5px'}}>🟡 Chưa bắt đầu (Đóng)</span> : 
                 votingStatus === 1 ? <span style={{color:'var(--green)', marginLeft:'5px'}}>🟢 Đang diễn ra</span> : 
                 <span style={{color:'gray', marginLeft:'5px'}}>⚫ Đã kết thúc</span>}
                <br/>Mạng: Ethereum Sepolia
              </p>
              
              {candidates.map((cand, index) => (
                <div key={index} className="candidate-card">
                  <div>
                    <div className="candidate-name">{cand.name}</div>
                    <div className="candidate-votes">Số phiếu On-chain: {cand.voteCount.toString()}</div>
                  </div>
                  <button 
                    className="btn-vote" 
                    onClick={() => vote(cand.id)}
                    disabled={votingStatus !== 1}
                    style={{ opacity: votingStatus !== 1 ? 0.3 : 1, cursor: votingStatus !== 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Bầu chọn
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div>
            <div className="card" style={{border: '1px dashed var(--accent)'}}>
              <div className="card-title">🆕 Thiết lập Nhiệm kỳ Mới</div>
              <div className="input-group" style={{flexDirection: 'column', gap: '10px'}}>
                <input 
                  type="text" 
                  placeholder="Tên cuộc bầu cử (VD: Bầu Lớp Phó Học Tập)" 
                  value={newElectionName}
                  onChange={(e) => setNewElectionName(e.target.value)}
                />
                <textarea 
                  placeholder="Tên các ứng viên, cách nhau bằng dấu phẩy (VD: An, Bình, Chi)"
                  value={newCandidateList}
                  onChange={(e) => setNewCandidateList(e.target.value)}
                  style={{background: '#000', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '8px'}}
                />
                <button className="btn-admin" onClick={handleStartNewElection} style={{width: '100%'}}>
                  Xác nhận Reset & Tạo mới
                </button>
              </div>
            </div>
            <div className="card" style={{borderColor: 'var(--accent)'}}>
              <div className="card-title">🕹️ Điều Khiển Hòm Phiếu</div>
              <p style={{color:'var(--muted)', fontSize:'14px', marginBottom:'16px'}}>
                Khởi động hoặc kết thúc cuộc bầu cử.
              </p>
              <div style={{display:'flex', gap:'10px'}}>
                <button 
                  onClick={handleStartElection} 
                  disabled={votingStatus !== 0}
                  style={{padding:'12px', background: votingStatus===0 ? '#00ff88' : '#333', color:'#000', fontWeight:'bold', border:'none', borderRadius:'8px', cursor: votingStatus===0 ? 'pointer' : 'not-allowed', flex: 1}}
                >
                  🟢 Bắt Đầu
                </button>
                <button 
                  onClick={handleEndElection} 
                  disabled={votingStatus !== 1}
                  style={{padding:'12px', background: votingStatus===1 ? '#ff4757' : '#333', color:'#fff', fontWeight:'bold', border:'none', borderRadius:'8px', cursor: votingStatus===1 ? 'pointer' : 'not-allowed', flex: 1}}
                >
                  🔴 Kết Thúc
                </button>
              </div>
            </div>

            <div className="card">
  <div className="card-title">📝 Quản lý Ứng cử viên</div>
  <div className="input-group">
    <input id="newCandNameInput" type="text" placeholder="Nhập tên ứng viên mới..." />
    <button className="btn-admin" onClick={() => {
      const input = document.getElementById('newCandNameInput') as HTMLInputElement;
      handleAddCandidate(input.value);
      input.value = "";
    }}>Thêm</button>
  </div>
  
  <div style={{marginTop: '15px'}}>
    {candidates.map((cand, idx) => (
      <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333'}}>
        <span>#{cand.id.toString()} - <strong>{cand.name}</strong></span>
        <button onClick={() => handleEditCandidate(cand.id)} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'}}>✏️</button>
      </div>
    ))}
  </div>
</div>

{/* THÊM KHU VỰC UPLOAD EXCEL Ở ĐÂY */}
<div className="card">
  <div className="card-title">📂 Nạp Cử tri từ Excel (CSV)</div>
  <input type="file" accept=".csv" onChange={handleFileUpload} className="mono" style={{fontSize: '12px'}} />
</div>
            

            <div className="card">
              <div className="card-title">🔐 Phân Quyền Cử Tri (Whitelist)</div>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Nhập địa chỉ ví (0x...)" 
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                />
                <button className="btn-admin" onClick={handleWhitelist}>Cấp quyền</button>
              </div>
            </div>
          </div>
        )}

        

        {/* --- MỚI: BẢNG HIỂN THỊ LỊCH SỬ GIAO DỊCH (BLOCKCHAIN EXPLORER) --- */}
        <div className="card" style={{ marginTop: '30px', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div className="card-title" style={{color: 'var(--text)'}}>⛓️ Blockchain Explorer (Live)</div>
          <p style={{color:'var(--muted)', fontSize:'12px', marginBottom:'15px'}}>
            Mỗi thao tác hợp lệ đều được ghi thành một Block không thể tẩy xóa.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {txHistory.length === 0 ? (
              <div style={{textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '20px'}}>
                Chưa có giao dịch nào được ghi nhận trong phiên này.
              </div>
            ) : (
              txHistory.map((tx, idx) => (
                <div key={idx} style={{ background: 'var(--card)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--green)' }}>{tx.action}</span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--muted)' }}>⏱ {tx.time}</span>
                  </div>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--accent)', wordBreak: 'break-all' }}>
                    TxHash: {tx.hash}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;