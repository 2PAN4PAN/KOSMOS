import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ManageMembers() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const token = localStorage.getItem("token");

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      alert("관리자만 접근 가능합니다.");
      navigate("/main");
    } else {
      fetchMembers();
    }
  }, [isAdmin, navigate]);

  // 회원 목록 불러오기
  const fetchMembers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(response.data.data || []); // API 응답 구조 반영
    } catch (error) {
      setMessage("회원 목록을 불러오는 데 실패했습니다.");
    }
  };

  // 회원 추가 요청
  const handleAddMember = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/add",
        { studentId, password, isAdmin: isUserAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message);
      if (response.data.success) {
        setStudentId("");
        setPassword("");
        setIsUserAdmin(false);
        fetchMembers();
      }
    } catch (error) {
      setMessage("회원 추가 실패: " + (error.response?.data?.message || error.message));
    }
  };

  // 회원 삭제 요청
  const handleDeleteMember = async (id) => {
    try {
      const response = await axios.delete("http://localhost:5000/api/auth/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { studentId: id },
      });
      
      setMessage(response.data.message);
      if (response.data.success) {
        fetchMembers();
      }
    } catch (error) {
      setMessage("회원 삭제 실패: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">관리자 페이지</h1>
      {message && <div className="alert alert-info">{message}</div>}

      {/* 회원 추가 */}
      <div className="card p-4 mb-3 shadow">
        <h4>회원 추가</h4>
        <div className="mb-2">
          <label className="form-label">학번</label>
          <input
            type="text"
            className="form-control"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">비밀번호</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="isAdmin"
            checked={isUserAdmin}
            onChange={(e) => setIsUserAdmin(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="isAdmin">
            관리자 권한 부여
          </label>
        </div>
        <button className="btn btn-primary w-100" onClick={handleAddMember}>
          회원 추가
        </button>
      </div>

      {/* 회원 목록 */}
      <div className="card p-4 shadow">
        <h4>회원 목록</h4>
        <ul className="list-group">
          {members.map((member) => (
            <li key={member._id} className="list-group-item d-flex justify-content-between align-items-center">
              {member.studentId} ({member.isAdmin ? "관리자" : "일반 사용자"})
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMember(member.studentId)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
