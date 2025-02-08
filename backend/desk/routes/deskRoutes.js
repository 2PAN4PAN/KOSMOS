const express = require('express');
const router = express.Router();
const Desk = require('../models/Desk');
const Log = require('../../auth/models/Log');
const { authMiddleware } = require('../../auth/middleware/auth');
const cron = require('node-cron');

// Function to get the current week range
function getCurrentWeekRange() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // Calculate the start of the week (Monday)
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    // Calculate the end of the week (Sunday)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Format the date range
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    return `${formatDate(monday)} ~ ${formatDate(sunday)}`;
}

async function initializeTableReservations() {
    const tableCount = 5;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeSlots = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10","11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];

    // Get the current week range
    const currentWeekRange = getCurrentWeekRange();

    for (let i = 1; i <= tableCount; i++) {
        // Find or update the existing table reservation for the current week
        const existingTable = await Desk.findOne({ tableId: i, week: currentWeekRange });

        if (!existingTable) {
            // 예약 일정 기본값 (T: 예약 가능)
            const schedule = {};
            days.forEach(day => {
                schedule[day] = {};
                timeSlots.forEach(time => {
                    schedule[day][time] = { type: "T" }; // Use new schema structure
                });
            });

            // 테이블 예약 정보 삽입 또는 업데이트
            await Desk.findOneAndUpdate(
                { tableId: i },
                {
                    tableId: i,
                    week: currentWeekRange,
                    schedule: schedule
                },
                { upsert: true, new: true }
            );

            console.log(`✅ 테이블 ${i}번 예약 정보 업데이트됨. 주간: ${currentWeekRange}`);
        }
    }
}

// 매주 월요일 자정에 테이블 예약 초기화
cron.schedule('0 0 * * 1', () => {
    console.log('매주 월요일 테이블 예약 초기화 시작');
    initializeTableReservations();
});

// 서버 시작 시 한 번 실행
initializeTableReservations();

router.post('/add', authMiddleware, async (req, res) => {
    const { tableId, reservation } = req.body;

    if (!reservation || reservation.length === 0) {
        return res.status(400).json({
            success: false,
            message: "예약할 시간을 선택해주세요."
        });
    }

    const updateQuery = {};
    const currentWeekRange = getCurrentWeekRange();

    // Find the first and last time slots
    const firstSlot = reservation[0].split('-');
    const lastSlot = reservation[reservation.length - 1].split('-');
    const firstDay = firstSlot[0];
    const firstTimeSlot = firstSlot[1];
    const lastDay = lastSlot[0];
    const lastTimeSlot = lastSlot[1];

    // Construct update query
    reservation.forEach(slot => {
        const [day, time] = slot.split('-');
        updateQuery[`schedule.${day}.${time}.type`] = 'F';
    });

    // Update desk reservation
    await Desk.findOneAndUpdate(
        { 
            tableId: tableId, 
            week: currentWeekRange 
        },
        { $set: updateQuery }
    );

    // Create log with first and last time slot dates
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const currentDate = new Date();
    const firstDayIndex = days.indexOf(firstDay);
    const lastDayIndex = days.indexOf(lastDay);
    
    // Calculate rental and return dates based on the day of the week
    const rentalDate = new Date(currentDate);
    rentalDate.setDate(currentDate.getDate() - currentDate.getDay() + firstDayIndex + 1);
    rentalDate.setHours(parseInt(firstTimeSlot), 0, 0, 0);

    const expectedReturnDate = new Date(currentDate);
    expectedReturnDate.setDate(currentDate.getDate() - currentDate.getDay() + lastDayIndex + 1);
    expectedReturnDate.setHours(parseInt(lastTimeSlot), 0, 0, 0);

    new Log({
        user: req.user._id,
        item: parseInt(tableId),
        itemModel: "Desk",
        rentalDate: rentalDate,
        expectedReturnDate: expectedReturnDate
    }).save();

    return res.json({
        success: true
    })
});

router.post('/cancel', authMiddleware, async (req, res) => {
    const { tableId, reservation } = req.body;

    if (!reservation || reservation.length === 0) {
        return res.status(400).json({
            success: false,
            message: "취소할 시간을 선택해주세요."
        });
    }

    const updateQuery = {};
    const currentWeekRange = getCurrentWeekRange();

    // Construct update query
    reservation.forEach(slot => {
        const [day, time] = slot.split('-');
        updateQuery[`schedule.${day}.${time}.type`] = 'T';
    });

    // Update desk reservation
    await Desk.findOneAndUpdate(
        { 
            tableId: tableId, 
            week: currentWeekRange 
        },
        { $set: updateQuery }
    );

    return res.json({
        success: true
    })
});

// 특정 테이블 예약 현황 조회 라우트
router.get('/:id', async (req, res) => {
    try {
        const tableId = parseInt(req.params.id);
        const currentWeekRange = getCurrentWeekRange();

        // 현재 주의 특정 테이블 예약 정보 조회
        const tableReservation = await Desk.findOne({ 
            tableId: tableId, 
            week: currentWeekRange 
        });

        if (!tableReservation) {
            return res.status(404).json({
                success: false,
                message: '해당 테이블의 예약 정보를 찾을 수 없습니다.'
            });
        }

        // 예약 현황 가공
        const reservationStatus = {};
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const timeSlots = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10","11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];

        days.forEach(day => {
            reservationStatus[day] = {};
            timeSlots.forEach(time => {
                const slotStatus = tableReservation.schedule[day][time].type;
                reservationStatus[day][time] = slotStatus === 'F' ? '예약됨' : '사용 가능';
            });
        });

        res.json({
            success: true,
            tableId: tableId,
            week: tableReservation.week,
            reservationStatus: reservationStatus
        });
    } catch (error) {
        console.error('테이블 예약 현황 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;