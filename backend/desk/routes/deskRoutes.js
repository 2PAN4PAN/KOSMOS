const express = require('express');
const router = express.Router();
const Desk = require('../models/Desk');
const Log = require('../../auth/models/Log');
const User = require('../../auth/models/User'); // Import User model
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
    const currentWeekRange = getCurrentWeekRange();

    for (let i = 1; i <= tableCount; i++) {
        // 기존 테이블 찾기 또는 새로 생성
        const existingTable = await Desk.findOne({ 
            tableId: i, 
            week: currentWeekRange 
        });

        if (!existingTable) {
            // 새로운 테이블 예약 생성 (유연한 스케줄 구조)
            await Desk.create({
                tableId: i,
            });
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



// 특정 테이블 예약 현황 조회 라우트
router.get('/:id', async (req, res) => {
    try {
        const tableId = parseInt(req.params.id);
        const currentWeekRange = getCurrentWeekRange();

        // 해당 테이블의 현재 활성 및 연체 로그 조회
        const activeLogs = await Log.find({
            item: tableId,
            itemModel: 'Desk',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        });

        // 로그 정보 변환
        const reservationDetails = activeLogs.map(log => ({
            userId: log.user,
            rentalDate: log.rentalDate,
            expectedReturnDate: log.expectedReturnDate,
            status: log.status
        }));

        // 테이블 기본 정보 조회 (선택적)
        const tableReservation = await Desk.findOne({ 
            tableId: tableId, 
            week: currentWeekRange 
        });

        return res.json({
            success: true,
            tableId: tableId,
            currentWeek: currentWeekRange,
            activeReservations: reservationDetails,
            tableDetails: tableReservation ? {
                week: tableReservation.week,
                schedule: tableReservation.schedule
            } : null
        });

    } catch (error) {
        console.error('테이블 예약 현황 조회 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: '테이블 예약 현황을 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// Get current user's desk reservation status
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Find all active desk rentals for the current user
        const userReservations = await Log.find({
            user: req.user._id,
            itemModel: 'Desk',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        });

        // Transform reservations into a more readable format
        const reservationDetails = userReservations.map(log => ({
            deskId: log.item,
            rentalDate: log.rentalDate,
            expectedReturnDate: log.expectedReturnDate,
            status: log.status,
            isOverdue: log.isOverdue
        }));

        res.json({
            success: true,
            reservations: reservationDetails
        });
    } catch (error) {
        console.error('Error fetching user desk reservations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve desk reservations' 
        });
    }
});

// 책상 예약 라우터
router.post('/add', authMiddleware, async (req, res) => {
    const { tableId, reservation } = req.body;

    // 입력 유효성 검사
    if (!tableId || !reservation) {
        return res.status(400).json({
            success: false,
            message: "필수 예약 정보가 누락되었습니다."
        });
    }

    try {
        // 시작 시간 파싱
        const startDate = new Date(reservation);
        
        // 종료 시간을 시작 시간 + 1시간으로 설정
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        // 기존 활성 예약 확인
        const existingActiveLog = await Log.findOne({
            user: req.user._id,
            item: tableId,
            itemModel: 'Desk',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        });

        if (existingActiveLog) {
            return res.status(400).json({
                success: false,
                message: "이미 해당 책상에 대한 활성 예약이 존재합니다."
            });
        }

        // 새 로그 생성
        const log = new Log({
            user: req.user._id,
            item: tableId,
            itemModel: 'Desk',
            rentalDate: startDate,
            expectedReturnDate: endDate,
            status: 'ACTIVE'
        });

        // 로그 저장
        await log.save();

        return res.json({
            success: true,
            message: "책상 예약이 성공적으로 완료되었습니다.",
            reservationId: log._id,
            startTime: startDate,
            endTime: endDate
        });

    } catch (error) {
        console.error('책상 예약 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: "예약 처리 중 서버 오류가 발생했습니다."
        });
    }
});

// 책상 예약 취소 라우터
router.post('/cancel', authMiddleware, async (req, res) => {
    const { tableId } = req.body;

    // 입력 유효성 검사
    if (!tableId) {
        return res.status(400).json({
            success: false,
            message: "취소할 책상 정보가 누락되었습니다."
        });
    }

    try {
        // 활성 예약 찾기
        const log = await Log.findOne({
            user: req.user._id,
            item: tableId,
            itemModel: 'Desk',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "취소할 예약을 찾을 수 없습니다."
            });
        }

        // 예약 취소 (반납 처리)
        log.actualReturnDate = new Date();
        log.status = 'RETURNED';
        await log.save();

        return res.json({
            success: true,
            message: "예약이 성공적으로 취소되었습니다."
        });

    } catch (error) {
        console.error('책상 예약 취소 중 오류:', error);
        return res.status(500).json({
            success: false,
            message: "예약 취소 중 서버 오류가 발생했습니다."
        });
    }
});

// 자동 반납 처리를 위한 크론 작업
cron.schedule('0 * * * *', async () => {
    const now = new Date();
    
    try {
        // 만료되었지만 아직 반납되지 않은 예약 찾기
        const overdueRentals = await Log.find({
            itemModel: 'Desk',
            status: { $in: ['ACTIVE', 'OVERDUE'] },
            expectedReturnDate: { $lt: now }
        });

        // 각 만료 예약에 대해 반납 처리
        for (const rental of overdueRentals) {
            rental.actualReturnDate = now;
            rental.status = 'RETURNED';
            await rental.save();

            console.log(`자동 반납 처리: 책상 ${rental.item}, 사용자 ${rental.user}`);
        }
    } catch (error) {
        console.error('자동 반납 처리 중 오류:', error);
    }
});

module.exports = router;