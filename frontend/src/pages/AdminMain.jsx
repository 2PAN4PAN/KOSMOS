// AdminMain.jsx
import React, { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminMain() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const token = localStorage.getItem("token");

  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      alert("관리자만 접근 가능합니다.");
      navigate("/main"); // 메인 페이지로 리다이렉트
    }
  }, [isAdmin, navigate]);

  return (
    <div className="container mt-5 text-center">
      <h1 className="mb-4">관리자 페이지</h1>

      <div className="d-grid gap-3">
        <button className="btn btn-primary" onClick={() => navigate("/admin")}>
          물품 관리
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/manage-members")}>
          회원 관리
        </button>
      </div>
    </div>
  );
}