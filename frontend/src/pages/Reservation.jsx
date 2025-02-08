// ReservationPage.jsx
import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import axios from "axios";
import "./Reservation.css";

const seats = [
  { id: 1, name: "큰 테이블 자리" },
  { id: 2, name: "모니터 자리 1" },
  { id: 3, name: "모니터 자리 2" },
  { id: 4, name: "모니터 자리 3" },
];

const times = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Reservation() {
  const [reservations, setReservations] = useState({});
  const [names, setNames] = useState({});
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedSeatId, setSelectedSeatId] = useState(1); // 기본값은 첫 번째 자리

  // **1️⃣ 예약 현황 가져오기 (백엔드 연동)**
  useEffect(() => {
    axios.get('http://localhost:5000/api/book/desk') // 책상 목록 가져오기
      .then(response => {
        // 책상 목록을 처리하는 로직
      })
      .catch(error => console.error("책상 데이터 불러오기 실패:", error));

    // 예약 현황 가져오기
    seats.forEach((seat) => {
      axios.get(`http://localhost:5000/api/book/desk/${seat.id}`)
        .then((response) => {
          // 예약 현황을 상태에 반영
          response.data.forEach((reservation) => {
            const key = `${seat.id}-${reservation.day}-${reservation.time}`;
            setReservations(prev => ({ ...prev, [key]: true }));
            setNames(prev => ({ ...prev, [key]: reservation.name }));
          });
        })
        .catch((error) => console.error("예약 현황 불러오기 실패:", error));
    });
  }, []);

  // **2️⃣ 예약 요청 함수**
  const handleReserve = (seatId, time) => {
    const key = `${seatId}-${selectedDay}-${time}`;
    
    if (!reservations[key]) {
      const name = prompt("예약자명을 입력하세요:");
      if (name) {
        const reservationData = {
          tableId: seatId.toString(),
          reservation: [`${selectedDay}-${time}`], // 예: ["Monday-10"]
        };

        axios.post(`http://localhost:5000/api/book/desk/${seatId}`, reservationData)
          .then((response) => {
            if (response.data.success) {
              setReservations((prev) => ({ ...prev, [key]: true }));
              setNames((prev) => ({ ...prev, [key]: name }));
              alert(response.data.message);
            } else {
              alert(response.data.message);
            }
          })
          .catch((error) => console.error("예약 실패:", error));
      }
    }
  };

  // **3️⃣ 예약 취소 요청 함수**
  const handleCancel = (seatId, time) => {
    const key = `${seatId}-${selectedDay}-${time}`;
    
    const cancelData = {
      tableId: seatId.toString(),
      reservation: [`${selectedDay}-${time}`], // 예: ["Monday-10"]
    };

    axios.post(`http://localhost:5000/api/book/desk/dismiss/${seatId}`, cancelData)
      .then((response) => {
        if (response.data.success) {
          setReservations((prev) => {
            const newReservations = { ...prev };
            delete newReservations[key];
            return newReservations;
          });
          setNames((prev) => {
            const newNames = { ...prev };
            delete newNames[key];
            return newNames;
          });
          alert(response.data.message);
        } else {
          alert(response.data.message);
        }
      })
      .catch((error) => console.error("예약 취소 실패:", error));
  };

  return (
    <div className="container">
      <div className="header" style={{ textAlign: "left" }}>
        <h1 className="title">KOSS 동아리방 자리 예약 시스템</h1>
      </div>
      <p className="subtitle">* 모든 예약은 일주일 단위로 가능합니다.</p>

      {/* 요일 선택 */}
      <div className="day-selector">
        <label>예약할 요일:</label>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
          {days.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* 책상 예약 표시 */}
      <div className="grid">
        {seats.map((seat) => (
          <Card key={seat.id} className="card">
            <CardContent>
              <h2 className="seat-name">{seat.name}</h2>
              <div className="time-grid">
                {times.map((time) => {
                  const key = `${seat.id}-${selectedDay}-${time}`;
                  return (
                    <Button
                      key={time}
                      className={`reservation-button ${reservations[key] ? "reserved" : ""}`}
                      onClick={() => reservations[key] ? handleCancel(seat.id, time) : handleReserve(seat.id, time)}
                    >
                      {reservations[key] ? `${names[key]} (취소)` : time}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
