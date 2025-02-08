// (Login.jsx)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LoginPage({ setIsAuthenticated }) {
  const [studentId, setId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


  const handleLogin = async () => {
    try {
      // 1️⃣ 로그인 요청
      const loginResponse = await axios.post("http://localhost:5000/api/auth/login", { studentId, password });


      if (loginResponse.data.success) {
        const token = loginResponse.data.token;

        // ✅ JWT 토큰만 저장 (유저 정보는 별도로 요청)
        localStorage.setItem("token", token);

        // 2️⃣ 관리자 여부 조회 요청 (토큰 포함)
        const userResponse = await axios.post("http://localhost:5000/api/auth/", {},{
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.data.success) {
          const { studentId, name, isAdmin } = userResponse.data.user;

          // ✅ 사용자 정보 저장
          localStorage.setItem("isAdmin", isAdmin);
          localStorage.setItem("studentId", studentId);
          localStorage.setItem("name", name);

          setIsAuthenticated(true);
          navigate("/main");
        } else {
          alert("사용자 정보를 가져오지 못했습니다.");
        }
      } else {
        alert("로그인 실패: " + loginResponse.data.message);
      }
    } catch (error) {
      console.error("로그인 요청 실패:", error);
      alert("서버와 연결할 수 없습니다. 네트워크 상태를 확인하세요.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg" style={{ width: "24rem" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">로그인</h2>
          <div className="mb-3">
            <label className="form-label">학번 (ID)</label>
            <input type="text" className="form-control" value={studentId} onChange={(e) => setId(e.target.value)} placeholder="학번을 입력하세요" />
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
