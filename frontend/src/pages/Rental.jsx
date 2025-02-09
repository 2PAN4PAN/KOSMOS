import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RentalPage() {
  const [availableItems, setAvailableItems] = useState([]);
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [returnDate, setReturnDate] = useState("");
  const [message, setMessage] = useState("");
  const [borrowedItemsLoading, setBorrowedItemsLoading] = useState(true);

  // 물품 목록과 대여한 물품 목록 불러오기
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
        fetchBorrowedItems();
      })
      .catch(error => console.error("사용자 정보를 가져오는 중 오류 발생:", error));

    axios.get("http://localhost:5000/api/ware")
      .then(response => {
        const itemsArray = Object.values(response.data);
        setAvailableItems(itemsArray);
      })
      .catch(error => console.error("물품 목록을 가져오는 중 오류 발생:", error));
  }, []);

  // 대여한 물품 목록 조회
  const fetchBorrowedItems = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/ware/borrowed", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (response.data.success) {
          setBorrowedItems(response.data.reservations || []);
        } else {
          console.error("대여 목록을 가져오는 데 실패했습니다.");
          setBorrowedItems([]);
        }
      })
      .catch(error => {
        console.error("대여 현황을 가져오는 중 오류 발생:", error);
        setBorrowedItems([]);
      })
      .finally(() => {
        setBorrowedItemsLoading(false);
      });
  };

  // 물품 대여 처리
  const handleBorrow = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token || !returnDate) {
      alert("반납 예정일을 선택해주세요.");
      return;
    }

    axios.post("http://localhost:5000/api/ware/borrow", {
      wareName: wareName,
      returnDate: returnDate
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setMessage(response.data.message);
        fetchBorrowedItems();
        updateAvailableItems();
      })
      .catch(error => console.error("대여 요청 중 오류 발생:", error));
  };

  // 물품 반납 처리
  const handleReturn = (wareName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.post("http://localhost:5000/api/ware/return", { wareName: wareName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setMessage(response.data.message);
        fetchBorrowedItems();
        updateAvailableItems();
      })
      .catch(error => console.error("반납 요청 중 오류 발생:", error));
  };

  // 물품 목록 업데이트
  const updateAvailableItems = () => {
    axios.get("http://localhost:5000/api/ware")
      .then(response => {
        const itemsArray = Object.values(response.data);
        setAvailableItems(itemsArray);
      })
      .catch(error => console.error("물품 목록을 가져오는 중 오류 발생:", error));
  };

  return (
    <div className="container mt-4">
      <nav className="navbar navbar-dark bg-dark mb-4">
        <span className="navbar-brand mx-auto">물품 대여 시스템</span>
      </nav>

      <div className="alert alert-info text-center">*물품은 최대 일주일 간 사용 가능합니다.</div>

      {/* 물품 대여 목록 */}
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
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleBorrow(item.name)}
                  disabled={item.quantity === 0}
                >
                  대여
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 대여한 물품 목록 */}
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
          {borrowedItemsLoading ? (
            <tr>
              <td colSpan="3" className="text-center">Loading...</td>
            </tr>
          ) : borrowedItems.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">대여한 물품이 없습니다.</td>
            </tr>
          ) : (
            borrowedItems.map((item, index) => (
              <tr key={index}>
                <td>{item.wareName}</td>
                <td>{item.expectedReturnDate ? item.expectedReturnDate.split("T")[0] : ''}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReturn(item.wareName)}
                  >
                    반납
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}
