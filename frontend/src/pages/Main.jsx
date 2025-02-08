// (Main.jsx)
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function MainPage({ setIsAuthenticated }) {
  const isAdmin = JSON.parse(localStorage.getItem("isAdmin") || "false"); // ✅ JSON.parse 사용

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("studentId");
    localStorage.removeItem("name");

    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <h1 className="mb-4">KOSMOS</h1>
      <h6 className="mb-4">KOSS 물품 및 자리 예약 시스템</h6>
      
      <div className="d-flex gap-3 mb-3">
        <Link to="/rental" className="btn btn-primary btn-lg">물품 대여</Link>
        <Link to="/reservation" className="btn btn-success btn-lg">자리 예약</Link>
      </div>

      {isAdmin && <Link to="/admin-main" className="text-muted small">관리자 페이지</Link>}

      <button onClick={handleLogout} className="text-muted small border-0 bg-transparent">
        로그아웃
      </button>
    </div>
  );
}
