const mongoose = require('mongoose');

// Main Desk Reservation Schema
const DeskSchema = new mongoose.Schema({
    tableId: {
        type: Number,
        required: true,
        unique: true
    },
    tableName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Desk = mongoose.model('Desk', DeskSchema);

module.exports = Desk;