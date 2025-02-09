import React, { useEffect, useState } from "react";
import axios from "axios";
import './Rental.css';

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

    axios.get('http://localhost:5000/api/auth/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setUser(response.data.user);
        fetchBorrowedItems();
      })
      .catch(error => console.error('사용자 정보를 가져오는 중 오류 발생:', error));

    axios.get('http://localhost:5000/api/ware')
      .then(response => setAvailableItems(response.data))
      .catch(error => console.error('물품 목록을 가져오는 중 오류 발생:', error));
  }, []);

  const fetchBorrowedItems = () => {
    const token = localStorage.getItem("token");
    axios.get('http://localhost:5000/api/ware/borrowed', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => setBorrowedItems(response.data))
      .catch(error => console.error('대여 현황을 가져오는 중 오류 발생:', error));
  };

  const handleBorrow = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.post('http://localhost:5000/api/ware/borrow', {
      wareName,
      returnDate: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        alert(response.data.message);
        fetchBorrowedItems();
      })
      .catch(error => console.error('대여 요청 중 오류 발생:', error));
  };

  const handleReturn = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.post('http://localhost:5000/api/ware/return', { wareName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        alert(response.data.message);
        fetchBorrowedItems();
      })
      .catch(error => console.error('반납 요청 중 오류 발생:', error));
  };

  return (
    <div className="App">
      <div className="black-nav">
        <h4>복지 물품 대여</h4>
      </div>
      <div className="list-container">
        <p className="list1">*복지물품은 최대 일주일 간 사용 가능합니다.</p>
      </div>

      <h2>대여 가능한 물품</h2>
      <ul>
        {availableItems.map((item, index) => (
          <li key={index}>
            {item.wareName}
            <button onClick={() => handleBorrow(item.wareName)}>대여</button>
          </li>
        ))}
      </ul>

      <h2>내가 대여한 물품</h2>
      <ul>
        {borrowedItems.map((item, index) => (
          <li key={index}>
            {item.wareName} (반납 예정일: {item.returnDate})
            <button onClick={() => handleReturn(item.wareName)}>반납</button>
          </li>
        ))}
      </ul>
    </div>
  );
}