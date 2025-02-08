// (Main.jsx)
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function MainPage({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);  // 인증 상태를 false로 변경
    navigate("/");  // 로그인 페이지로 이동
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <h1 className="mb-4">KOSMOS</h1>
      <h6 className="mb-4">KOSS 물품 및 자리 예약 시스템</h6>
      <div className="d-flex gap-3 mb-3">
        <Link to="/rental" className="btn btn-primary btn-lg">물품 대여</Link>
        <Link to="/reservation" className="btn btn-success btn-lg">자리 예약</Link>
      </div>
      <Link to="/admin" className="text-muted small">관리자 페이지</Link>
      <Link to="/" className="text-muted small" onClick={handleLogout}>로그아웃</Link>
    </div>
  );
}