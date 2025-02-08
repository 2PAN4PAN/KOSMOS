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

  useEffect(() => {
    const fetchReservationStatus = async (seatId) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/desk/${seatId}`);
        if (response.data.success) {
          const status = response.data.reservationStatus;
          console.log('Fetched Status:', status);
          
          // 요일과 시간 인덱스 변환
          const convertedStatus = {};
          Object.keys(status).forEach(day => {
            convertedStatus[day] = times.map((time, index) => {
              // 시간 인덱스를 문자열로 변환 (1부터 시작)
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
  }, [selectedDay]);

  const handleReserve = (seatId, time) => {
    const timeIndex = times.indexOf(time);
    const currentStatus = reservationStatus[seatId]?.[dayMapping[selectedDay]]?.[timeIndex];
    
    console.log('Current Status:', {
      seatId, 
      day: dayMapping[selectedDay], 
      time, 
      timeIndex, 
      status: currentStatus
    });

    // 예약 가능 상태일 경우 예약을 진행
    if (currentStatus === "사용 가능") {
      const name = prompt("예약자명을 입력하세요:");
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
          <Card key={seat.id} className="card">
            <CardContent>
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
                          currentStatus === "예약됨" ? "reserved" : ""
                        }`}
                        onClick={() => {
                          if (currentStatus === "사용 가능") {
                            handleReserve(seat.id, time);
                          } else {
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

