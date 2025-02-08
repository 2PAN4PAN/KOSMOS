const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const url = 'mongodb+srv://2pan4pan:2pan4pan@2pan4pan.xq7l6.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(url);

async function initializeTableReservations() {
    await client.connect();
    const db = client.db('2pan4pan');
    const collection = db.collection('reservations');

    // 테이블 개수 설정 (예: 5개 테이블)
    const tableCount = 5;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeSlots = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10","11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]; // 더 추가 가능

    for (let i = 1; i <= tableCount; i++) {
        const existingTable = await collection.findOne({ tableId: i });

        if (!existingTable) {
            // 예약 일정 기본값 (T: 예약 가능)
            const schedule = {};
            days.forEach(day => {
                schedule[day] = {};
                timeSlots.forEach(time => {
                    schedule[day][time] = "T"; // 기본적으로 모든 시간 예약 가능
                });
            });

            // 테이블 예약 정보 삽입
            await collection.insertOne({
                tableId: i,
                week: "2024-02-12 ~ 2024-02-18", // 매주 업데이트 가능하도록
                schedule: schedule
            });

            console.log(`✅ 테이블 ${i}번 예약 정보 추가됨.`);
        }
    }
}

// 서버 실행 시 한 번만 실행 (기본 데이터 추가)
initializeTableReservations();

// 특정 테이블 예약 현황 가져오기
async function getTableReservations(tableId) {
    await client.connect();
    const db = client.db('2pan4pan');
    const collection = db.collection('reservations');

    // 특정 테이블 예약 정보 조회
    const reservation = await collection.findOne({ tableId: parseInt(tableId) });
    return reservation ? reservation.schedule : null;
}

router.get('/desk', (요청, 응답) => {
    응답.render('desk.ejs');
});


// router.get('/desk/:id', (요청, 응답) => {
//     응답.render('book.ejs');
// });

router.get('/desk/:id', async (요청, 응답) => {
    const tableId = 요청.params.id; // URL에서 테이블 ID 가져옴
    const schedule = await getTableReservations(tableId); // 해당 테이블의 예약 데이터를 가져옴

    if (!schedule) {
        return 응답.status(404).send('해당 테이블의 예약 정보가 없습니다.');
    }

    // `book.ejs` 파일을 렌더링할 때, `tableId`와 `schedule`을 넘겨줌
    응답.render('book.ejs', { tableId, schedule });
});


router.get('/desk/reserve/:id', async (요청, 응답) => {
    const tableId = 요청.params.id;
    
    // 예약 정보를 가져옴
    const schedule = await getTableReservations(tableId);

    if (!schedule) {
        return 응답.status(404).send("해당 테이블의 예약 정보가 없습니다.");
    }

    응답.render("reserve.ejs", { tableId, schedule });
});
  
router.get('/desk/dismiss/:id', async (요청, 응답) => {
    const tableId = 요청.params.id;
    
    // 예약 정보를 가져옴
    const schedule = await getTableReservations(tableId);

    if (!schedule) {
        return 응답.status(404).send("해당 테이블의 예약 정보가 없습니다.");
    }

    응답.render("dismiss.ejs", { tableId, schedule });
});

router.post('/add', async (req, res) => {
    const { tableId, reservation } = req.body;

    if (!reservation) {
        return res.status(400).send("예약할 시간을 선택해주세요.");
    }

    const db = client.db("2pan4pan");
    const collection = db.collection("reservations");

    const updateQuery = {};
    if (Array.isArray(reservation)) {
        reservation.forEach(slot => {
            const [day, time] = slot.split("-");
            updateQuery[`schedule.${day}.${time}`] = "F"; // 예약 상태 변경
        });
    } else {
        const [day, time] = reservation.split("-");
        updateQuery[`schedule.${day}.${time}`] = "F";
    }

    await collection.updateOne(
        { tableId: parseInt(tableId) },
        { $set: updateQuery }
    );

    res.redirect(`/api/book/desk/${tableId}`);
});

router.post('/cancel', async (req, res) => {
    const { tableId, reservation } = req.body;

    if (!reservation) {
        return res.status(400).send("취소 할 시간을 선택해주세요.");
    }

    const db = client.db("2pan4pan");
    const collection = db.collection("reservations");

    const updateQuery = {};
    if (Array.isArray(reservation)) {
        reservation.forEach(slot => {
            const [day, time] = slot.split("-");
            updateQuery[`schedule.${day}.${time}`] = "T"; // 예약 상태 변경
        });
    } else {
        const [day, time] = reservation.split("-");
        updateQuery[`schedule.${day}.${time}`] = "T";
    }

    await collection.updateOne(
        { tableId: parseInt(tableId) },
        { $set: updateQuery }
    );

    res.redirect(`/api/book/desk/${tableId}`);
});



module.exports = router;