// models/Ware.js
const mongoose = require('mongoose');

const wareSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // 필수 입력
    },
    description: {
        type: String,
    },
    imageUrl: {
        type: String, // 이미지 URL
    },
    quantity: {
        type: Number,
        default: 0, // 기본값 0
    },
    isAvailable: {
        type: Boolean,
        default: true, // 기본적으로 대여 가능
    },
});

const Ware = mongoose.model('Ware', wareSchema);

module.exports = Ware;