import React, { useState, useEffect } from "react";
import { Button } from "../components/Button";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Reservation.css";

const seats = [
  { id: 1, name: "큰 테이블 자리" },
  { id: 2, name: "모니터 자리 1" },
  { id: 3, name: "모니터 자리 2" },
  { id: 4, name: "모니터 자리 3" },
];

const times = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`); // "08:00" ~ "23:00"
const days = ["월", "화", "수", "목", "금", "토", "일"];

const dayMapping = {
  "월": "Monday",
  "화": "Tuesday", 
  "수": "Wednesday", 
  "목": "Thursday", 
  "금": "Friday", 
  "토": "Saturday", 
  "일": "Sunday"
};

const getTodayDay = () => {
  const todayIndex = new Date().getDay(); // 0(일) ~ 6(토)
  return days[todayIndex === 0 ? 6 : todayIndex - 1]; // 일요일(0)은 배열의 마지막(6)으로 설정
};

export default function Reservation() {
  const [reservations, setReservations] = useState({});
  const [names, setNames] = useState({});
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [reservationStatus, setReservationStatus] = useState({});
  const [myReservations, setMyReservations] = useState([]);

  useEffect(() => {
    const fetchReservationStatus = async (seatId) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/desk/${seatId}`);
        if (response.data.success) {
          const status = response.data.reservationStatus;
          
          // 요일과 시간 인덱스 변환
          const convertedStatus = {};
          Object.keys(status).forEach(day => {
            convertedStatus[day] = times.map((time, index) => {
              return status[day][String(index + 1)] || "사용 가능";
            });
          });

          setReservationStatus((prevStatus) => ({
            ...prevStatus,
            [seatId]: convertedStatus,
          }));
        }
      } catch (error) {
        console.error("예약 상태를 불러오는 데 실패했습니다.", error);
      }
    };

    // 모든 자리에 대해 예약 상태를 가져오기
    seats.forEach((seat) => {
      fetchReservationStatus(seat.id);
    });

    // 로그인된 사용자의 예약 현황 가져오기
    const fetchMyReservations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/api/desk", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const updatedReservations = response.data.reservations.map(reservation => {
            const seat = seats.find(seat => seat.id === reservation.deskId);

            // 날짜와 시간을 원하는 형식으로 변환
            const rentalDate = new Date(reservation.rentalDate);
            const formattedDate = rentalDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식으로 변환
            const formattedTime = `${String(rentalDate.getHours()).padStart(2, "0")}:${String(rentalDate.getMinutes()).padStart(2, "0")}`; // HH:mm 형식

            // 예약된 날짜와 시간을 포함한 객체 반환
            return {
              id: reservation.id,
              seatName: seat ? seat.name : "알 수 없음",
              time: formattedTime,
              day: formattedDate, // 예약된 날짜 추가
            };
          });
          setMyReservations(updatedReservations);
        }
      } catch (error) {
        console.error("내 예약 현황을 불러오는 데 실패했습니다.", error);
      }
    };

    fetchMyReservations();

  }, [selectedDay]);

  const handleReserve = (seatId, time) => {
    const timeIndex = times.indexOf(time);
    const currentStatus = reservationStatus[seatId]?.[dayMapping[selectedDay]]?.[timeIndex];

    if (currentStatus === "사용 가능") {
      const name = localStorage.getItem("studentId");
      if (name) {
        const key = `${seatId}-${selectedDay}-${time}`;
        
        // 예약 상태를 업데이트
        setReservations((prev) => ({ ...prev, [key]: true }));
        setNames((prev) => ({ ...prev, [key]: name }));
        addReservation(seatId, time, name); // 예약 추가 요청
      }
    } else if (currentStatus === "예약됨") {
      alert("이미 예약된 시간입니다.");
    } else {
      alert("예약 가능한 시간이 아닙니다.");
    }
  };

  const addReservation = async (seatId, time, name) => {
    const timeIndex = times.indexOf(time);
    const reservationKey = `${seatId}-${selectedDay}-${time}`;
    const reservationsToAdd = [`${dayMapping[selectedDay]}-${timeIndex + 1}`];

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/desk/add", {
        tableId: seatId,
        reservation: reservationsToAdd,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        alert("예약이 완료되었습니다.");
        
        // 로컬 상태 업데이트
        setReservationStatus((prevStatus) => {
          const updatedStatus = { ...prevStatus };
          if (updatedStatus[seatId] && updatedStatus[seatId][dayMapping[selectedDay]]) {
            updatedStatus[seatId][dayMapping[selectedDay]][timeIndex] = "예약됨";
          }
          return updatedStatus;
        });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("예약 추가에 실패했습니다.", error);
    }
  };

  const handleCancelReservation = (reservationId) => {
    const token = localStorage.getItem("token");
    axios.post("http://localhost:5000/api/desk/cancel", { reservationId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      if (response.data.success) {
        alert("예약이 취소되었습니다.");
        setMyReservations(prev => prev.filter(res => res.id !== reservationId));
      }
    })
    .catch(error => {
      console.error("예약 취소에 실패했습니다.", error);
    });
  };

  return (
    <div className="container">
      <div className="header" style={{ textAlign: "left" }}>
        <h1 className="title">Koss 동아리방 자리 예약 시스템</h1>
      </div>
      <p className="subtitle">* 모든 예약은 일주일 단위로 가능합니다.</p>

      <div className="day-selector">
        <label>예약할 요일:</label>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div className="grid">
        {seats.map((seat) => (
          <div key={seat.id} className="card">
            <h2 className="seat-name">{seat.name}</h2>
            <div className="time-grid">
              {times.map((time) => {
                const key = `${seat.id}-${selectedDay}-${time}`;
                const timeIndex = times.indexOf(time);
                const currentStatus = reservationStatus[seat.id]?.[dayMapping[selectedDay]]?.[timeIndex];

                return (
                  <div key={time}>
                    <Button
                      className={`reservation-button ${
                        currentStatus === "예약됨" ? "reserved-time" : "available"
                      }`}
                      onClick={() => {
                        if (currentStatus === "사용 가능") {
                          handleReserve(seat.id, time);
                        } else if (currentStatus === "예약됨") {
                          alert("이미 예약된 시간입니다.");
                        }
                      }}
                    >
                      {names[key] || time}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 className="my-reservations-title">내 예약 현황</h2>
      <table className="table">
        <thead>
          <tr>
            <th>자리명</th>
            <th>예약 날짜</th>
            <th>예약 시간</th>
            <th>예약 취소</th>
          </tr>
        </thead>
        <tbody>
          {myReservations.map((reservation) => (
            <tr key={reservation.id}>
              <td>{reservation.seatName}</td>
              <td>{reservation.day}</td>
              <td>{reservation.time}</td>
              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancelReservation(reservation.id)}
                >
                  취소
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
