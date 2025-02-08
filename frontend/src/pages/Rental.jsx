// RentalPage.jsx
import React, { useEffect, useState } from "react";
import './Rental.css';


export default function RentalPage() {
  const [dropdownStates, setDropdownStates] = useState(Array(4).fill(false));
  const [selectedBooks, setSelectedBooks] = useState(Array(4).fill(''));
  const [quantities, setQuantities] = useState(['0', '0', '0']);
  const [remainingQuantities, setRemainingQuantities] = useState(['1', '5', '3']);
  const [returnDates, setReturnDates] = useState(['2025-02-07', '2025-02-07', '2025-02-07']);

  const data = [
    ['물품명', '대여 수량', '남은 수량', '반납 예정일'],
    ['전공서적', '1', '0', '2025-02-07'],
    ['우산', '5', '0', '2025-02-07'],
    ['충전기 및 USB 허브', '3', '0', '2025-02-07'],
  ];

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
    '통계학개론 (제5개정판)',
  ];

  const booksForChargers = [
    'C 타입 레노버 충전기',
    'C 타입 허브',
    'USB 허브',
  ];

  const toggleDropdown = (index) => {
    const newDropdownStates = [...dropdownStates];
    // 다른 드롭다운은 닫기
    newDropdownStates.forEach((_, i) => {
      if (i !== index) newDropdownStates[i] = false;
    });
    // 해당 드롭다운 상태만 토글
    newDropdownStates[index] = !newDropdownStates[index];
    setDropdownStates(newDropdownStates);
  };

  const handleSelectBook = (book, index) => {
    const newSelectedBooks = [...selectedBooks];
    newSelectedBooks[index] = book;
    setSelectedBooks(newSelectedBooks);
    const newDropdownStates = [...dropdownStates];
    newDropdownStates[index] = false;
    setDropdownStates(newDropdownStates);
  };

  const handleQuantityChange = (index, value) => {
    const newQuantities = [...quantities];
    newQuantities[index] = value;
    setQuantities(newQuantities);

    let newRemainingQuantities = [...remainingQuantities];
    const quantity = parseInt(value, 10);
    if (data[index + 1][0] === '전공서적') {
      newRemainingQuantities[index] = (1 - quantity).toString();
    } else if (data[index + 1][0] === '우산') {
      newRemainingQuantities[index] = (5 - quantity).toString();
    } else if (data[index + 1][0] === '충전기 및 USB 허브') {
      newRemainingQuantities[index] = (3 - quantity).toString();
    }
    setRemainingQuantities(newRemainingQuantities);
  };

  const handleDateChange = (index, e) => {
    const newReturnDates = [...returnDates];
    newReturnDates[index] = e.target.value;
    setReturnDates(newReturnDates);
  };

  const handleConfirm = () => {
    console.log('반납 예정일: ', returnDates);
  };

  return (
    <div className="App">
      <div className="black-nav">
        <h4>복지 물품 대여</h4>
      </div>
      <div className="list-container">
        <p className="list1">*복지물품은 최대 일주일 간 사용가능합니다.</p>
      </div>

      <table className="table">
        <thead>
          <tr>
            {data[0].map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, index) => (
            <tr key={index}>
              {row.map((cell, idx) => (
                <td key={idx} onClick={idx === 0 && row[0] !== '우산' ? () => toggleDropdown(index) : null}>
                  {idx === 0 ? (
                    <div className="dropdown-container">
                      <span>
                        {selectedBooks[index] || cell}
                      </span>
                      {row[0] !== '우산' && (
                        <span className={`dropdown-arrow ${dropdownStates[index] ? 'up' : 'down'}`}>&#9660;</span>
                      )}
                      {dropdownStates[index] && row[0] !== '우산' && (
                        <div className="dropdown">
                          {row[0] === '전공서적' ? (
                            booksForTextbooks.map((book, i) => (
                              <div key={i} onClick={() => handleSelectBook(book, index)}>
                                {book}
                              </div>
                            ))
                          ) : row[0] === '충전기 및 USB 허브' ? (
                            booksForChargers.map((book, i) => (
                              <div key={i} onClick={() => handleSelectBook(book, index)}>
                                {book}
                              </div>
                            ))
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : idx === 1 ? (
                    <select
                      value={quantities[index]}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                    >
                      {row[0] === '전공서적' && (
                        <>
                          <option value="0">0</option>
                          <option value="1">1</option>
                        </>
                      )}
                      {row[0] === '우산' && (
                        <>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </>
                      )}
                      {row[0] === '충전기 및 USB 허브' && (
                        <>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </>
                      )}
                    </select>
                  ) : idx === 2 ? (
                    remainingQuantities[index]
                  ) : idx === 3 ? (
                    <input
                      type="date"
                      value={returnDates[index]}
                      onChange={(e) => handleDateChange(index, e)}
                    />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="button-container">
        <button onClick={handleConfirm} className="confirm-button">확인</button>
      </div>
    </div>
  );
}

