// (Login.jsx)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LoginPage({ setIsAuthenticated }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    
      if (id === "test123" && password === "password123") {
        setIsAuthenticated(true);
        navigate("/main");
      } else {
        alert("로그인 실패: 잘못된 학번 또는 비밀번호입니다.");
      }
    };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg" style={{ width: "24rem" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">로그인</h2>
          <div className="mb-3">
            <label className="form-label">학번 (ID)</label>
            <input type="text" className="form-control" value={id} onChange={(e) => setId(e.target.value)} placeholder="학번을 입력하세요" />
          </div>
          <div className="mb-3">
            <label className="form-label">비밀번호</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" />
          </div>
          <button className="btn btn-primary w-100" onClick={handleLogin}>로그인</button>
        </div>
      </div>
    </div>
  );
}
