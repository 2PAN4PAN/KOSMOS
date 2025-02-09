// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const Ware = require('../models/Ware');
const Log = require('../../auth/models/Log');
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
        if (!ware.isAvailable || ware.quantity <= 0) {
            return res.status(400).json({ message: '대여 불가능한 물품입니다.' });
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

// routes/bookRoutes.js

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


// routes/bookRoutes.js

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

// routes/bookRoutes.js

// 사용자가 대여한 물품 목록 조회
router.get('/borrowed', authMiddleware, async (req, res) => {
    try {
      //const userId = req.user._id; // authMiddleware를 통해 사용자 ID를 얻음
  
      // Log 모델에서 사용자 ID와 상태(ACTIVE, OVERDUE)를 기준으로 대여 로그 검색
      const borrowedItems = await Log.find({
        user: req.user._id,
        status: { $in: ['ACTIVE', 'OVERDUE'] }
      })
        .populate({
          path: 'item',
          model: 'Ware' // 'Ware' 또는 'Desk' 모델을 동적으로 지정
        }); // 대여 물품 정보 연결
  
      res.json(borrowedItems);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: '서버 오류' });
    }
  });

module.exports = router;

