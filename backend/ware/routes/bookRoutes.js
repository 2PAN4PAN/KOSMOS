// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const Ware = require('../models/Ware');
const User = require('../../auth/models/User'); // User 모델 추가

// 물품 대여 페이지 (렌더링 가정)
router.get('/ware', (req, res) => {
    // TODO: 물품 대여 페이지 렌더링 (템플릿 엔진 사용)
    res.send('물품 대여 페이지');
});

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
router.post('/register', async (req, res) => {
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
router.post('/borrow', async (req, res) => {
    try {
        const { wareName, userId, returnDate } = req.body; // 요청에서 물품 이름, 사용자 ID 받기

        // 사용자 ID 유효성 검사 (User 모델을 사용하여 확인)
        const user = await User.findOne({ studentId: userId });
        if (!user) {
            return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
        }

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
        ware.borrower = user._id;  // 사용자 ID 저장
        ware.borrowedDate = new Date();
        ware.returnDate = returnDate; // 반납일 설정
        await ware.save();

        res.json({ success: true, message: '물품 대여 성공' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;