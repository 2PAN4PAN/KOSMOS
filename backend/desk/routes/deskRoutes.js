const express = require('express');
const router = express.Router();
const Desk = require('../models/Desk');
const Log = require('../../auth/models/Log');
const User = require('../../auth/models/User'); // Import User model
const { authMiddleware } = require('../../auth/middleware/auth');
const cron = require('node-cron');

const desknames = [
    '큰 테이블 자리',
    '모니터 자리 1',
    '모니터 자리 2',
    '모니터 자리 3'
]

async function initializeTableReservations() {

    const tableCount = 4;

    for (let i = 1; i <= tableCount; i++) {
        // 기존 테이블 찾기 또는 새로 생성
        const existingTable = await Desk.findOne({ 
            tableId: i, 
        });

        if (!existingTable) {
            // 새로운 테이블 예약 생성 (유연한 스케줄 구조)
            await Desk.create({
                tableId: i,
                tableName: desknames[i - 1],
            });
        }
    }
}
// 서버 시작 시 한 번 실행
initializeTableReservations();



// 특정 테이블 예약 현황 조회 라우트
router.get('/:id', async (req, res) => {
    try {
        const tableId = parseInt(req.params.id);
        
        // 다음 주 날짜 범위 계산
        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay() + 1));
        nextWeekStart.setHours(0, 0, 0, 0);
        
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);

        // 해당 테이블의 다음 주 활성 및 연체 로그 조회
        const activeLogs = await Log.find({
            item: tableId,
            itemModel: 'Desk',
            rentalDate: { 
                $gte: nextWeekStart, 
                $lte: nextWeekEnd 
            },
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        });

        // 로그의 사용자 정보 조회
        const userIds = activeLogs.map(log => log.user);
        const users = await User.find({ _id: { $in: userIds } });

        // 로그 정보 변환
        const reservationDetails = activeLogs.map(log => {
            const user = users.find(u => u._id.equals(log.user));
            return {
                userId: log.user,
                userName: user ? user.name : '알 수 없는 사용자',
                email: user ? user.email : '',
                rentalDate: log.rentalDate,
                expectedReturnDate: log.expectedReturnDate
            };
        });

        // 테이블 기본 정보 조회 (선택적)
        const tableReservation = await Desk.findOne({ 
            tableId: tableId
        });

        return res.json({
            success: true,
            tableId: tableId,
            currentWeek: `${nextWeekStart.toISOString().split('T')[0]} ~ ${nextWeekEnd.toISOString().split('T')[0]}`,
            activeReservations: reservationDetails,
            tableDetails: tableReservation ? {
                week: tableReservation.week,
                tableId: tableReservation.tableId
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
        const reservationDetails = await Promise.all(userReservations.map(async (log) => {
            const desk_ = await Desk.findOne({
                tableId:log.item
            });

            return {
                deskId: log.item,
                deskName: desk_.tableName,
                rentalDate: log.rentalDate,
                expectedReturnDate: log.expectedReturnDate,
                status: log.status,
                isOverdue: log.isOverdue
            }
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

    console.log(reservation)

    try {
        // 시작 시간 파싱
        const startDate = new Date(reservation);

        console.log(startDate)
        
        // 종료 시간을 시작 시간 + 1시간으로 설정
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        // 기존 활성 예약 확인
        const existingActiveLog = await Log.findOne({
            user: req.user._id,
            item: tableId,
            itemModel: 'Desk',
            rentalDate: startDate,
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
    const { tableId, reservation } = req.body;

    // 입력 유효성 검사
    if (!tableId || !reservation) {
        return res.status(400).json({
            success: false,
            message: "취소할 책상 정보 또는 예약 날짜가 누락되었습니다."
        });
    }

    try {
        // 정확한 날짜와 시간으로 예약 찾기
        const reservationDate = new Date(reservation);
        
        const log = await Log.findOne({
            user: req.user._id,
            item: tableId,
            itemModel: 'Desk',
            rentalDate: reservationDate, // 정확한 날짜와 시간 일치
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