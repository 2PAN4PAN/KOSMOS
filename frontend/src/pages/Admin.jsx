// AdminPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import './Admin.css';


export default function AdminPage() {
  const token = localStorage.getItem("token");
  // 복지물품 사용현황 데이터 상태 관리
  const [items, setItems] = useState([
    { num: '20243000', name: '홍길동', item: '우산', quantity: 1, returnDate: '2025-02-14', overdueCount: 1 }
  ]);

  // 남은 물품 데이터 (책 33개, 우산, 충전기)
  const [remainingItems, setRemainingItems] = useState([]);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 0,
  });

  useEffect(() => {
    fetchItems();
    fetchRemainingItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ware/all-rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(response.data);
      setItems(response.data.rentals);
    } catch (error) {
      console.error('복지물품 사용현황 데이터를 불러오는 중 오류:', error);
    }
  };

  const fetchRemainingItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ware/quantities');
      setRemainingItems(Object.entries(response.data)); 
    } catch (error) {
      console.error('남은 물품 데이터를 불러오는 중 오류:', error);
    }
  };

  // 물품 등록 함수
  const handleItemSubmit = async () => {
    if (!newItem.name || !newItem.quantity) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    const requestData = {
      name: newItem.name,
      description: "",
      quantity: newItem.quantity,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/ware/register', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.message === '물품 등록 성공') {
        alert('물품 등록이 완료되었습니다!');
        const newWare = response.data.ware;
        setRemainingItems([...remainingItems, newWare]); // 새로운 물품 추가
      } else {
        alert('물품 등록에 실패했습니다. 서버 오류.');
      }
    } catch (error) {
      console.error('서버 통신 오류:', error);
      alert('물품 등록 서버 통신 오류');
    }
  };

  return (
    <div className='App'>
      <div className='black-nav'>관리자 대쉬보드</div>
      <div className='list'>복지물품 사용현황</div>

      <table className="table">
        <thead>
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

      <div className='list2'>남은 물품</div>
      <table className="table2">
        <thead>
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



      <div className='list4'>물품 등록</div>
      <div className="input-container-item">
        <input
          className="input-field-item"
          placeholder="물품명"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          className="input-field-item"
          placeholder="수량"
          type="number"
          value={newItem.quantity}
          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
        />
        <button className="confirm-button-item" onClick={handleItemSubmit}>
          물품 등록
        </button>
      </div>
    </div>
  );
}

