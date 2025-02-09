import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RentalPage() {
  const [availableItems, setAvailableItems] = useState([]);
  const [borrowedItems, setBorrowedItems] = useState([]); // 초기값을 빈 배열로 설정
  const [returnDate, setReturnDate] = useState("");

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
        fetchBorrowedItems(token); // 토큰을 넘겨서 대여한 물품을 가져옵니다.
      })
      .catch(error => console.error("사용자 정보를 가져오는 중 오류 발생:", error));

    axios.get("http://localhost:5000/api/ware")
      .then(response => {
        const itemsArray = Object.values(response.data);
        setAvailableItems(itemsArray);
      })
      .catch(error => console.error("물품 목록을 가져오는 중 오류 발생:", error));
  }, []);

  const fetchBorrowedItems = (token) => {
    axios.get("http://localhost:5000/api/ware/borrowed", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (response.data.success) {
          const borrowedItems = response.data.reservations;

          // 서버에서 반환된 데이터 구조에 맞춰서 필요한 데이터만 추출하여 상태에 업데이트
          const filteredItems = borrowedItems.map(item => ({
            name: item.name, // 물품 이름
            expectedReturnDate: item.expectedReturnDate.split("T")[0], // 예상 반납 날짜
          }));

          setBorrowedItems(filteredItems); // 대여 목록 상태 업데이트
        }
      })
      .catch(error => console.error("대여 현황을 가져오는 중 오류 발생:", error));
  };

  const handleBorrow = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token || !returnDate) {
      alert("반납 예정일을 선택해주세요.");
      return;
    }

    axios.post("http://localhost:5000/api/books/borrow", {
      wareName: wareName,
      returnDate: returnDate
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        alert(response.data.message);
        fetchBorrowedItems(token); // 대여 후 다시 대여 목록 갱신
      })
      .catch(error => console.error("대여 요청 중 오류 발생:", error));
  };

  const handleReturn = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.post("http://localhost:5000/api/books/return", { wareName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (response.data.success) {
          alert(response.data.message); // '물품 반납 성공' 메시지 처리
          fetchBorrowedItems(token); // 반납 후 대여 목록 갱신
        } else {
          alert("반납 처리에 실패했습니다.");
        }
      })
      .catch(error => {
        alert("반납 요청 중 오류 발생.");
        console.error("반납 요청 중 오류 발생:", error);
      });
  };

  return (
    <div className="container mt-4">
      <nav className="navbar navbar-dark bg-dark mb-4">
        <span className="navbar-brand mx-auto">복지 물품 대여</span>
      </nav>

      <div className="alert alert-info text-center">*복지물품은 최대 일주일 간 사용 가능합니다.</div>

      <h2 className="mb-3">대여 가능한 물품</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>물품 이름</th>
            <th>남은 수량</th>
            <th>반납 예정일</th>
            <th>대여</th>
          </tr>
        </thead>
        <tbody>
          {availableItems.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>
                <input
                  type="date"
                  className="form-control"
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </td>
              <td>
                <button className="btn btn-primary btn-sm" onClick={() => handleBorrow(item.name)} disabled={item.quantity === 0}>
                  대여
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-3">내가 대여한 물품</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>물품 이름</th>
            <th>반납 예정일</th>
            <th>반납</th>
          </tr>
        </thead>
        <tbody>
          {borrowedItems.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">대여한 물품이 없습니다.</td>
            </tr>
          ) : (
            borrowedItems.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.expectedReturnDate}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReturn(item.name)}>
                    반납
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
