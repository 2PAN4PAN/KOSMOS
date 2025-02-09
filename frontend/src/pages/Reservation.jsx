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
        const response = await axios.get(`http://localhost:5000/api/desk/${seatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const reservationStatus = {};
          
          // 각 요일별 예약 상태 초기화
          days.forEach(day => {
            reservationStatus[dayMapping[day]] = Array(16).fill("사용 가능");
          });

          // 활성 예약들을 순회하며 상태 업데이트
          response.data.activeReservations.forEach(reservation => {
            const rentalDate = new Date(reservation.rentalDate);
            const day = rentalDate.toLocaleDateString('ko-KR', { weekday: 'short' });
            const timeIndex = rentalDate.getHours() - 8;

            // 8시부터 23시 사이의 예약만 처리
            if (timeIndex >= 0 && timeIndex < 16) {
              reservationStatus[dayMapping[day]][timeIndex] = reservation.userName || "예약됨";
            }
          });

          setReservationStatus((prevStatus) => ({
            ...prevStatus,
            [seatId]: reservationStatus
          }));
        }
      } catch (error) {
        console.error("예약 상태를 불러오는 데 실패했습니다.", error);
      }
    };

    const fetchMyReservations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/api/desk", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const updatedReservations = response.data.reservations.map(reservation => {
            const seat = seats.find(seat => seat.id === reservation.deskId);
            const rentalDate = new Date(reservation.rentalDate);

            return {
              id: reservation.id,
              seatName: seat ? seat.name : "알 수 없음",
              time: `${String(rentalDate.getHours()).padStart(2, "0")}:00`,
              day: rentalDate.toISOString().split("T")[0],
              tableId: reservation.deskId
            };
          });

          setMyReservations(updatedReservations);
        }
      } catch (error) {
        console.error("내 예약 현황을 불러오는 데 실패했습니다.", error);
      }
    };

    seats.forEach((seat) => {
      fetchReservationStatus(seat.id);
    });

    fetchMyReservations();
  }, [selectedDay]);

  const handleReserve = (seatId, time) => {
    const timeIndex = times.indexOf(time);
    const currentStatus = reservationStatus[seatId]?.[dayMapping[selectedDay]]?.[timeIndex];

    if (currentStatus === "사용 가능") {
      const name = localStorage.getItem("studentId");
      if (name) {
        const key = `${seatId}-${selectedDay}-${time}`;
        
        setReservations((prev) => ({ ...prev, [key]: true }));
        setNames((prev) => ({ ...prev, [key]: name }));
        addReservation(seatId, time, name); 
      }
    } else {
      alert("예약할 수 없는 시간입니다.");
    }
  };

  const addReservation = async (seatId, time, name) => {
    const timeIndex = times.indexOf(time);
    const token = localStorage.getItem("token");

    // 선택된 날짜와 시간을 결합한 Date 객체 생성
    const reservationDate = new Date();
    reservationDate.setDate(reservationDate.getDate() + days.indexOf(selectedDay) - reservationDate.getDay());
    reservationDate.setHours(timeIndex + 8, 0, 0, 0);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/desk/add",
        {
          tableId: seatId,
          reservation: reservationDate  // Date 객체 그대로 전송
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert("예약이 완료되었습니다.");

        // 예약 상태 업데이트
        setReservationStatus((prevStatus) => {
          const updatedStatus = { ...prevStatus };
          const dayKey = dayMapping[selectedDay];
          
          if (updatedStatus[seatId] && updatedStatus[seatId][dayKey]) {
            updatedStatus[seatId][dayKey][timeIndex] = name;
          }
          
          return updatedStatus;
        });

        // 내 예약 목록 업데이트
        setMyReservations((prevReservations) => [
          ...prevReservations,
          {
            id: response.data.reservationId,
            seatName: seats.find(seat => seat.id === seatId).name,
            time: time,
            day: reservationDate.toISOString().split('T')[0],
            tableId: seatId
          }
        ]);
      } else {
        alert(response.data.message || "예약에 실패했습니다.");
      }
    } catch (error) {
      console.error("예약 중 오류가 발생했습니다.", error);
      alert("예약 중 오류가 발생했습니다.");
    }
  };

const handleCancelReservation = async (tableId, reservationDate) => {
    try {
        // 예약 취소 시 사용되는 날짜를 ISO 8601 형식으로 변환
        const formattedReservationDate = new Date(reservationDate).toISOString();
        
        // 예약 취소 요청
        const response = await axios.post('http://localhost:5000/api/desk/cancel', {
            tableId: tableId,
            reservation: formattedReservationDate  // ISO 8601 형식으로 날짜 전달
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // 토큰이 필요한 경우
            }
        });

        const data = response.data;

        if (data.success) {
            alert('예약이 취소되었습니다.');
        } else {
            alert('예약 취소 실패:', data.message);
        }
    } catch (error) {
        console.error('예약 취소 중 오류:', error);
    }
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
            <option key={day} value={day}>{day}</option>
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
                const currentStatus = reservationStatus[seat.id]?.[dayMapping[selectedDay]]?.[timeIndex] || "사용 가능";  

                return (
                  <div key={time}>
                    <Button
                      className={`reservation-button ${currentStatus === "예약됨" ? "reserved-time" : "available"}`}
                      onClick={() => {
                        if (currentStatus === "사용 가능") {
                          handleReserve(seat.id, time);
                        }
                      }}
                    >
                      {currentStatus === "사용 가능" ? time : currentStatus}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-12 mt-5">
          <h2>내 예약 현황</h2>
          {myReservations.length > 0 ? (
            <table className="table table-striped">
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
                  <tr key={reservation.tableId}>
                    <td>{reservation.seatName}</td>
                    <td>{reservation.day}</td>
                    <td>{reservation.time}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelReservation(reservation.tableId, reservation.day+'T'+reservation.time)}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-muted">현재 예약된 자리가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
