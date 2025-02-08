// models/Ware.js
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const wareSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true
    },
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
    }
}, { 
    _id: false, // Disable default _id generation
});

// Add auto-increment plugin
wareSchema.plugin(AutoIncrement, { 
    id: 'ware_counter', // Unique identifier for this counter
    inc_field: '_id' // The field to increment
});

const Ware = mongoose.model('Ware', wareSchema);

module.exports = Ware;