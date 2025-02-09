import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminPage() {
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [remainingItems, setRemainingItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: 0 });

  useEffect(() => {
    fetchItems();
    fetchRemainingItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/ware/all-rentals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.rentals);
    } catch (error) {
      console.error("복지물품 사용현황 데이터를 불러오는 중 오류:", error);
    }
  };

  const fetchRemainingItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/ware/quantities");
      setRemainingItems(Object.entries(response.data));
    } catch (error) {
      console.error("남은 물품 데이터를 불러오는 중 오류:", error);
    }
  };

  const handleItemSubmit = async () => {
    if (!newItem.name || !newItem.quantity) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/ware/register", newItem, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.message === "물품 등록 성공") {
        alert("물품 등록이 완료되었습니다!");
        setRemainingItems([...remainingItems, [newItem.name, newItem.quantity]]);
      } else {
        alert("물품 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("서버 통신 오류:", error);
      alert("물품 등록 서버 통신 오류");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">관리자 대시보드</h2>
      
      <div className="mb-4">
        <h4>복지물품 사용현황</h4>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>학번(아이디)</th>
                <th>물품명</th>
                <th>반납 예정일</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.userStudentId}</td>
                  <td>{item.wareName}</td>
                  <td>{item.expectedReturnDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-4">
        <h4>남은 물품</h4>
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>물품명</th>
                <th>수량</th>
              </tr>
            </thead>
            <tbody>
              {remainingItems.map((item, index) => (
                <tr key={index}>
                  <td>{item[0]}</td>
                  <td>{item[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-4">
        <h4>물품 등록</h4>
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="물품명"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="수량"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <button className="btn btn-primary w-100" onClick={handleItemSubmit}>
              물품 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
