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

    seats.forEach((seat) => {
      fetchReservationStatus(seat.id);
    });

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
            const formattedDate = rentalDate.toISOString().split("T")[0]; 
            const formattedTime = `${String(rentalDate.getHours()).padStart(2, "0")}:${String(rentalDate.getMinutes()).padStart(2, "0")}`;

            return {
              id: reservation.id,
              seatName: seat ? seat.name : "알 수 없음",
              time: formattedTime,
              day: formattedDate,
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
        
        setReservations((prev) => ({ ...prev, [key]: true }));
        setNames((prev) => ({ ...prev, [key]: name }));
        addReservation(seatId, time, name); 
      }
    } else {
      alert("예약할 수 없는 시간입니다.");
    }
  };

  const addReservation = async (seatId, time, name) => {
    const timeIndex = times.indexOf(time); // 시간 인덱스
    const reservationKey = `${seatId}-${selectedDay}-${time}`;
    const dayString = dayMapping[selectedDay]; // 선택한 요일을 영어로 변환
  
    // 예약할 시간에 해당하는 요일과 시간을 결합한 배열을 생성
    const reservationsToAdd = [`${dayString}-${timeIndex + 1}`]; // 예약 상태를 나타낼 키 값
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/desk/add", {
        tableId: seatId,
        reservation: reservationsToAdd,  // 예약 형식에 맞게 수정
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.success) {
        alert("예약이 완료되었습니다.");
  
        // 예약 현황 업데이트
        setReservationStatus((prevStatus) => {
          const updatedStatus = { ...prevStatus };
          if (updatedStatus[seatId] && updatedStatus[seatId][dayString]) {
            updatedStatus[seatId][dayString][timeIndex] = "예약됨";
          }
          return updatedStatus;
        });
  
        // 내 예약 현황 업데이트
        setMyReservations((prevReservations) => [
          ...prevReservations,
          {
            seatName: seats.find(seat => seat.id === seatId).name,
            time,
            day: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
          }
        ]);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("예약 추가에 실패했습니다.", error);
    }
  };


  const handleCancelReservation = async (reservation) => {
    const token = localStorage.getItem("token");
    
    const timeIndex = times.indexOf(reservation.time); // 예약 시간 인덱스
    const dayString = dayMapping[reservation.day]; // 월, 화, 수 등의 요일을 영어로 변환
  
    // 예약 취소할 키 값 (요일-시간 인덱스)
    const reservationToCancel = [`${dayString}-${timeIndex + 1}`];
    
    try {
      const response = await axios.post("http://localhost:5000/api/desk/cancel", {
        tableId: reservation.tableId,  // 예약 취소 시 필요한 tableId
        reservation: reservationToCancel,  // 취소할 예약의 시간
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.data.success) {
        alert("예약이 취소되었습니다.");
  
        // 내 예약 현황에서 취소된 예약 제거
        setMyReservations(prev => prev.filter(res => res.id !== reservation.id));
  
        // 예약 상태 갱신
        setReservationStatus(prevStatus => {
          const updatedStatus = { ...prevStatus };
          updatedStatus[reservation.tableId][dayString][timeIndex] = "사용 가능";
          return updatedStatus;
        });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("예약 취소에 실패했습니다.", error);
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
                const currentStatus = reservationStatus[seat.id]?.[dayMapping[selectedDay]]?.[timeIndex] || "사용 가능";  // 수정된 부분

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
                  onClick={() => handleCancelReservation(reservation)}
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
