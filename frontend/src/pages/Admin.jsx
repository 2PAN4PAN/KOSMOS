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

// 남은 물품 데이터
const remainingItems = [
  { item: '전공서적', quantity: 1 },
  { item: '우산', quantity: 5 },
  { item: '충전기 및 USB 허브', quantity: 3 }
];

// 드롭다운 항목들
const booksForTextbooks = [
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
  '통계학개론 (제5개정판)'
];

const booksForChargers = [
  'C 타입 레노버 충전기',
  'C 타입 허브',
  'USB 허브'
];

// 드롭다운 상태 관리
const [openDropdown, setOpenDropdown] = useState({ textbook: false, charger: false });
const [selectedTextbook, setSelectedTextbook] = useState('');
const [selectedCharger, setSelectedCharger] = useState('');

// 드롭다운 열기/닫기 함수
const toggleDropdown = (type) => {
  setOpenDropdown(prevState => ({ ...prevState, [type]: !prevState[type] }));
};

// 드롭다운 항목 선택 시 드롭다운 닫기
const handleSelectItem = (item, type) => {
  if (type === 'textbook') setSelectedTextbook(item);
  else if (type === 'charger') setSelectedCharger(item);
  setOpenDropdown(prevState => ({ ...prevState, [type]: false }));
};

// 드롭다운 외부 클릭 시 닫힘
useEffect(() => {
  const closeDropdownOnClickOutside = (e) => {
    if (!e.target.closest('.dropdown-container')) {
      setOpenDropdown({ textbook: false, charger: false });
    }
  };
  document.addEventListener('click', closeDropdownOnClickOutside);
  return () => {
    document.removeEventListener('click', closeDropdownOnClickOutside);
  };
}, []);

return (
  <div className='App'>
    <div className='black-nav'>관리자 대쉬보드</div>
    <div className='list'>복지물품 사용현황</div>

    <table className="table">
      <thead>
        <tr>
          <th>학번(아이디)</th>
          <th>이름</th>
          <th>물품명</th>
          <th>수량</th>
          <th>반납 예정일</th>
          <th>연체 횟수</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td>{item.num}</td>
            <td>{item.name}</td>
            <td>{item.item}</td>
            <td>{item.quantity}</td>
            <td>{item.returnDate}</td>
            <td>{item.overdueCount}</td>
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
            <td>
              {item.item === '전공서적' ? (
                <div className="dropdown-container" onClick={() => toggleDropdown('textbook')}>
                  <span>{selectedTextbook || '전공서적 선택'}</span>
                  <span className="dropdown-arrow">&#9660;</span>
                  {openDropdown.textbook && (
                    <div className="dropdown">
                      {booksForTextbooks.map((book, i) => (
                        <div key={i} onClick={() => handleSelectItem(book, 'textbook')} className="dropdown-item">
                          {book}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : item.item === '충전기 및 USB 허브' ? (
                <div className="dropdown-container" onClick={() => toggleDropdown('charger')}>
                  <span>{selectedCharger || '충전기 선택'}</span>
                  <span className="dropdown-arrow">&#9660;</span>
                  {openDropdown.charger && (
                    <div className="dropdown">
                      {booksForChargers.map((charger, i) => (
                        <div key={i} onClick={() => handleSelectItem(charger, 'charger')} className="dropdown-item">
                          {charger}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                item.item
              )}
            </td>
            <td>{item.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className='list3'>회원 가입</div>

    <div className="input-container">
      <input  className="input-field1" placeholder="학번을 입력하세요" />
      <input  className="input-field2" placeholder="비밀번호를 입력하세요" />
    </div>
  </div>
);
}

