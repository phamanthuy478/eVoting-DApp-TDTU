// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool isWhitelisted;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    // --- MỚI: Định nghĩa 3 trạng thái của cuộc bầu cử ---
    enum VotingStatus { NotStarted, InProgress, Ended }
    VotingStatus public status; 

    string public electionName;
    uint256 public electionId; // Số thứ tự cuộc bầu cử
    address public admin;
    mapping(uint256 => mapping(address => Voter)) public electionVoters;
    Candidate[] public candidates;
    
    event VoterWhitelisted(address voter);
    event VoteCasted(address voter, uint256 candidateId);
    event StatusChanged(VotingStatus newStatus);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Loi: Chi Admin moi co quyen nay!");
        _;
    }

    constructor(string[] memory _candidateNames) {
        admin = msg.sender;
        status = VotingStatus.NotStarted; // Mặc định vừa tạo xong là Chưa Bắt Đầu

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: _candidateNames[i],
                voteCount: 0
            }));
        }
    }

    // --- MỚI: Hàm mở hòm phiếu (Chỉ Admin) ---
    function startElection() public onlyAdmin {
        require(status == VotingStatus.NotStarted, "Loi: Cuoc bau cu da bat dau hoac da ket thuc");
        status = VotingStatus.InProgress;
        emit StatusChanged(status);
    }

    // --- MỚI: Hàm đóng hòm phiếu (Chỉ Admin) ---
    function endElection() public onlyAdmin {
        require(status == VotingStatus.InProgress, "Loi: Cuoc bau cu chua bat dau hoac da ket thuc roi");
        status = VotingStatus.Ended;
        emit StatusChanged(status);
    }

    function whitelistVoter(address _voter) public onlyAdmin {
        require(status != VotingStatus.Ended, "Loi: Cuoc bau cu da ket thuc, khong the them cu tri");
        // Thay "voters" bằng "electionVoters[electionId]"
        require(!electionVoters[electionId][_voter].isWhitelisted, "Loi: Cu tri nay da duoc them tu truoc");
        
        electionVoters[electionId][_voter].isWhitelisted = true;
        emit VoterWhitelisted(_voter);
    }

    function vote(uint256 _candidateId) public {
        require(status == VotingStatus.InProgress, "Loi: Hien tai khong trong thoi gian bo phieu");
        // Kiểm tra đúng kho lưu trữ của nhiệm kỳ hiện tại
        require(electionVoters[electionId][msg.sender].isWhitelisted, "Loi: Ban khong co quyen bau cu");
        require(!electionVoters[electionId][msg.sender].hasVoted, "Loi: Ban da bo phieu roi!");
        require(_candidateId < candidates.length, "Loi: Ung cu vien khong hop le");

        electionVoters[electionId][msg.sender].hasVoted = true;
        electionVoters[electionId][msg.sender].votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount += 1;

        emit VoteCasted(msg.sender, _candidateId);
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }
    function startNewElection(string memory _name, string[] memory _candidateNames) public onlyAdmin {
        electionId++; // Nhảy sang nhiệm kỳ mới
        electionName = _name;
        status = VotingStatus.NotStarted;
        
        delete candidates; // Xóa danh sách ứng viên cũ

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: _candidateNames[i],
                voteCount: 0
            }));
        }
    }

    // 1. Thêm ứng cử viên mới vào cuộc bầu cử hiện tại
    function addCandidate(string memory _name) public onlyAdmin {
        require(status == VotingStatus.NotStarted, "Loi: Khong the them khi dang bau cu");
        candidates.push(Candidate({
            id: candidates.length,
            name: _name,
            voteCount: 0
        }));
    }

    // 2. Sửa tên ứng cử viên (Phòng trường hợp gõ sai tên)
    function updateCandidate(uint256 _id, string memory _newName) public onlyAdmin {
        require(_id < candidates.length, "Loi: ID khong ton tai");
        candidates[_id].name = _newName;
    }

    // 3. Cấp quyền Whitelist hàng loạt (Dùng cho tính năng Excel)
    function batchWhitelist(address[] memory _voters) public onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            if (!electionVoters[electionId][voter].isWhitelisted) {
                electionVoters[electionId][voter].isWhitelisted = true;
                emit VoterWhitelisted(voter);
            }
        }
    }
}