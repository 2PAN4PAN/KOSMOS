const express = require('express');
const router = express.Router();

// 책 예약 페이지
router.get('/desk', (요청, 응답) => {
    응답.render('desk.ejs');
});

// 특정 책 예약 페이지
router.get('/desk/:id', (요청, 응답) => {
    응답.render('book.ejs');
});

module.exports = router;