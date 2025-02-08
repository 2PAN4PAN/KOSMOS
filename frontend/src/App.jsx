// (App.jsx)
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/Login";
import MainPage from "./pages/Main";
import RentalPage from "./pages/Rental";  // 물품 대여 페이지
import ReservationPage from "./pages/Reservation";  // 자리 예약 페이지
import AdminPage from "./pages/Admin";  // 관리자 페이지

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
  
    
      <Routes>
        {/* 로그인 안 하면 로그인 페이지로 이동 */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/main" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route
          path="/main"
          element={isAuthenticated ? <MainPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />}
        />
        <Route
          path="/rental"
          element={isAuthenticated ? <RentalPage /> : <Navigate to="/" />}
        />
        <Route
          path="/reservation"
          element={isAuthenticated ? <ReservationPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminPage /> : <Navigate to="/" />}
        />
      </Routes>
    
    
  );
}