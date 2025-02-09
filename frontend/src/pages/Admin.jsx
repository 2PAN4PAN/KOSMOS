// AdminPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import './Admin.css';


export default function AdminPage() {
  // 복지물품 사용현황 데이터 상태 관리
  const [items, setItems] = useState([
    { num: '20243000', name: '홍길동', item: '우산', quantity: 1, returnDate: '2025-02-14', overdueCount: 1 }
  ]);

  // 남은 물품 데이터 (책 33개, 우산, 충전기)
  const [remainingItems, setRemainingItems] = useState([
    { item: '우산', quantity: 5 },
    { item: 'C 타입 레노버 충전기', quantity: 3 },
    { item: 'C 타입 허브', quantity: 3 },
    { item: 'USB 허브', quantity: 3 },
    ...[
      '뇌를 자극하는 C++ STL',
      '거침없이 배우는 라즈베리 파이',
      '컴퓨팅 사고력을 키우는 이산수학',
      '친절한 SQL 튜닝',
      '레트로의 유니티 게임 프로그래밍 에센스',
      '스튜어트 미적분학',
      '자바의 정석 1',
      '자바의 정석 2',
      'NGINX 쿡북',
      '텐서플로 라이트를 활용한 안드로이드 딥러닝',
      'elementary linear algebra',
      '안드로이드 스튜디오를 활용한 실전 앱 만들기',
      '미분적분학 2 다변수 함수와 벡터 해석',
      '실전 ! 텐서플로2를 활용한 딥러닝 컴퓨터 비전',
      'NGINX HTTP SERVER',
      'Do IT! 안드로이드 앱 프로그래밍',
      '최신선형대수',
      'SQL 전문가 가이드',
      '컴퓨터 구조 및 설계',
      '윤성우의 열혈 자료구조',
      '정보처리기사 실기 1',
      '정보처리기사 실기 2',
      '초보자를 위한 JavaScript 200제',
      '백견불여일타 파이어베이스',
      '초보자를 위한 Node.js 200제',
      '스프링으로 하는 마이크로서비스 구축',
      'Operating System Concepts',
      '자연과학 / 공학계열 글쓰기',
      '글쓰기 이공계열',
      '알기 쉬운 선형대수 제12판',
      '응용이 보이는 선형대수학:파이선과 함께하는 선형대수학 이론과 응용',
      '4차 산업혁명 시대의 이산수학',
      '통계학개론 (제5개정판)',
    ].map(item => ({ item, quantity: 1 }))
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 0,
  });

  // 물품 등록 함수
  const handleItemSubmit = async () => {
    if (!newItem.name || !newItem.description || !newItem.quantity) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    const requestData = {
      name: newItem.name,
      description: newItem.description,
      quantity: newItem.quantity,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/books/register', requestData);

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
              <td>{item.num}</td>
              <td>{item.item}</td>
              <td>{item.returnDate}</td>
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
              <td>{item.item}</td>
              <td>{item.quantity}</td>
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

