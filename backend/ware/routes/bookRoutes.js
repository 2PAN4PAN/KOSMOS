// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const Ware = require('../models/Ware');
const Log = require('../../auth/models/Log');
const User = require('../../auth/models/User');
const { authMiddleware, adminMiddleware } = require('../../auth/middleware/auth');

// 대여 가능 물품 목록 조회
router.get('/', async (req, res) => {
    try {
        const availableWares = await Ware.find({ isAvailable: true });
        res.json(availableWares);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 물품 등록 서비스 기능
router.post('/register', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { name, description, quantity } = req.body;
        const newWare = new Ware({
            name: name,
            description: description,
            quantity: quantity,
            isAvailable: quantity > 0 // If quantity is > 0, it's available
        });
        await newWare.save();
        res.status(201).json({ message: '물품 등록 성공', ware: newWare });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '물품 등록 서버 오류' });
    }
});

// 물품 대여 (물품 이름으로 Ware ID 찾아서 대여)
router.post('/borrow', authMiddleware, async (req, res) => {
    try {
        const { wareName, returnDate } = req.body; // 요청에서 물품 이름, 사용자 ID 받기

        // 물품 이름으로 물품 검색
        const ware = await Ware.findOne({ name: wareName });
        if (!ware) {
            return res.status(404).json({ message: '해당 이름의 물품을 찾을 수 없습니다.' });
        }
        const wareId = ware._id;  // 물품 ID 가져오기

        // 대여 가능 여부 확인
        if (!ware.isAvailable) {
            return res.status(400).json({ message: '대여 불가능한 물품입니다.' });
        }
        if (ware.quantity <= 0) {
            return res.status(400).json({ message: '대여 가능한 물품이 없습니다.' });
        }

        // 대여 처리
        ware.isAvailable = false;
        ware.quantity -= 1;
        await ware.save();

        // 대여 로그 저장
        const log = new Log({
            user: req.user._id,
            item: wareId,
            itemModel: 'Ware',
            expectedReturnDate: returnDate
        });
        await log.save();

        res.json({ success: true, message: '물품 대여 성공' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 물품 반납 기능 추가
router.post('/return', authMiddleware, async (req, res) => {
    try {
        const { wareName } = req.body;

        // 물품 이름으로 물품 검색
        const ware = await Ware.findOne({ name: wareName });
        if (!ware) {
            return res.status(404).json({ message: '해당 이름의 물품을 찾을 수 없습니다.' });
        }

        // 대여 로그 검색
        const log = await Log.findOne({ 
            user: req.user._id, 
            item: ware._id, 
            itemModel: 'Ware', 
            status: { $in: ['ACTIVE', 'OVERDUE'] } 
        });

        if (!log) {
            return res.status(400).json({ message: '해당 물품의 대여 기록을 찾을 수 없습니다.' });
        }

        // 반납 처리
        ware.isAvailable = true;
        ware.quantity += 1;
        await ware.save();

        // 로그 업데이트
        log.actualReturnDate = new Date();
        log.status = 'RETURNED';

        await log.save();

        res.json({ 
            success: true, 
            message: '물품 반납 성공', 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 물품 별 수량 조회
router.get('/quantities', async (req, res) => {
    try {
        const wares = await Ware.find({}); // 모든 물품 조회

        // 물품 이름과 수량을 담을 객체
        const quantities = {};

        // 물품 목록을 순회하며 수량 계산
        wares.forEach(ware => {
            quantities[ware.name] = ware.quantity;
        });

        res.json(quantities);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 사용자의 물품 대여 현황 조회
router.get('/borrowed', authMiddleware, async (req, res) => {
    try {
        // 현재 사용자의 모든 활성 및 연체 물품 대여 조회
        const userReservations = await Log.find({
            user: req.user._id,
            itemModel: 'Ware',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        }).populate('item');

        

        // 대여 정보 변환
        const reservationDetails = userReservations.map(async (log) => {
            const ware = await Ware.findById(log.item);
            return {
                wareId: log.item,
                wareName: ware.name,
                quantity: ware.quantity,
                rentalDate: log.rentalDate,
                expectedReturnDate: log.expectedReturnDate,
                status: log.status,
                isOverdue: log.isOverdue
            }
        });

        res.json({
            success: true,
            reservations: reservationDetails
        });
    } catch (error) {
        console.error('Error fetching user ware reservations:', error);
        res.status(500).json({ 
            success: false, 
            message: '물품 대여 현황을 불러오는 데 실패했습니다.' 
        });
    }
});

// 관리자 전용: 현재 대여중인 물품 대여 기록 조회
router.get('/all-rentals', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        // 현재 대여중인 물품 대여 로그 조회 (ACTIVE, OVERDUE 상태만)
        const allRentals = await Log.find({
            itemModel: 'Ware',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        })
        .sort({ rentalDate: -1 }); // 최근 대여 순으로 정렬

        // 대여 정보 변환 (사용자 정보 별도 조회)
        const rentalDetails = await Promise.all(allRentals.map(async (log) => {
            // 사용자 정보 조회
            const user = await User.findById(log.user).select('name studentId');
            const ware = await Ware.findById(log.item).select('name quantity');

            return {
                userId: log.user,
                userName: user ? user.name : '알 수 없음',
                userStudentId: user ? user.studentId : '알 수 없음',
                wareId: log.item,
                wareName: ware ? ware.name : '알 수 없음',
                wareQuantity: ware ? ware.quantity : '알 수 없음',
                rentalDate: log.rentalDate,
                expectedReturnDate: log.expectedReturnDate,
                actualReturnDate: log.actualReturnDate,
                status: log.status,
                isOverdue: log.isOverdue
            };
        }));

        res.json({
            success: true,
            totalRentals: rentalDetails.length,
            rentals: rentalDetails
        });
    } catch (error) {
        console.error('Error fetching all ware rentals:', error);
        res.status(500).json({ 
            success: false, 
            message: '물품 대여 기록을 불러오는 데 실패했습니다.' 
        });
    }
});

// 관리자 대시보드용 물품 정보 조회
router.get('/dashboard/:wareName', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { wareName } = req.params;

        // 물품 정보 조회
        const ware = await Ware.findOne({ name: wareName });
        if (!ware) {
            return res.status(404).json({ message: '해당 이름의 물품을 찾을 수 없습니다.' });
        }

        // 현재 대여 중인 수량 계산
        const borrowedCount = await Log.countDocuments({
            item: ware._id,
            itemModel: 'Ware',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        });

        // 남은 수량 계산
        const remainingQuantity = ware.quantity - borrowedCount;

        // 반납 예정일 조회 (최근 5개)
        const upcomingReturns = await Log.find({
            item: ware._id,
            itemModel: 'Ware',
            status: { $in: ['ACTIVE', 'OVERDUE'] }
        })
            .sort({ expectedReturnDate: 1 }) // 반납 예정일 오름차순 정렬
            .limit(5) // 최근 5개만
            .select('expectedReturnDate'); // expectedReturnDate만 선택

        res.json({
            name: ware.name,
            totalQuantity: ware.quantity,
            borrowedCount: borrowedCount,
            remainingQuantity: remainingQuantity,
            upcomingReturns: upcomingReturns
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;
