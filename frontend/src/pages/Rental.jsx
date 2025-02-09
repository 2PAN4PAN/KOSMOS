import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RentalPage() {
  const [availableItems, setAvailableItems] = useState([]);
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    axios.post("http://localhost:5000/api/auth/", {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setUser(response.data.user);
        fetchBorrowedItems();
      })
      .catch(error => console.error("사용자 정보를 가져오는 중 오류 발생:", error));

    axios.get("http://localhost:5000/api/ware")
      .then(response => setAvailableItems(response.data))
      .catch(error => console.error("물품 목록을 가져오는 중 오류 발생:", error));
  }, []);

  const fetchBorrowedItems = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/ware/borrowed", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => setBorrowedItems(response.data))
      .catch(error => console.error("대여 현황을 가져오는 중 오류 발생:", error));
  };

  const handleBorrow = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.post("http://localhost:5000/api/ware/borrow", {
      wareName: wareName,
      returnDate: new Date().toISOString().split("T")[0]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        alert(response.data.message);
        fetchBorrowedItems();
      })
      .catch(error => console.error("대여 요청 중 오류 발생:", error));
  };

  const handleReturn = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.post("http://localhost:5000/api/ware/return", { wareName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        alert(response.data.message);
        fetchBorrowedItems();
      })
      .catch(error => console.error("반납 요청 중 오류 발생:", error));
  };

  return (
    <div className="container mt-4">
      <nav className="navbar navbar-dark bg-dark mb-4">
        <span className="navbar-brand mx-auto">복지 물품 대여</span>
      </nav>

      <div className="alert alert-info text-center">*복지물품은 최대 일주일 간 사용 가능합니다.</div>

      <h2 className="mb-3">대여 가능한 물품</h2>
      <ul className="list-group mb-4">
        {availableItems.map((item, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            {item.name}
            <button className="btn btn-primary btn-sm" onClick={() => handleBorrow(item.name)}>대여</button>
          </li>
        ))}
      </ul>

      <h2 className="mb-3">내가 대여한 물품</h2>
      <ul className="list-group">
        {borrowedItems.map((item, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            {item.item.name} (반납 예정일: {item.expectedReturnDate.split("T")[0]})
            <button className="btn btn-danger btn-sm" onClick={() => handleReturn(item.item.name)}>반납</button>
          </li>
        ))}
      </ul>
    </div>
  );
}