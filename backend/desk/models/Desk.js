const mongoose = require('mongoose');

// Define the schema for a single time slot
const TimeSlotSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['T', 'F'], // T: Available, F: Reserved
        default: 'T'
    }
}, { _id: false });

// Define the schedule for a single day
const DayScheduleSchema = new mongoose.Schema({
    '1': TimeSlotSchema,
    '2': TimeSlotSchema,
    '3': TimeSlotSchema,
    '4': TimeSlotSchema,
    '5': TimeSlotSchema,
    '6': TimeSlotSchema,
    '7': TimeSlotSchema,
    '8': TimeSlotSchema,
    '9': TimeSlotSchema,
    '10': TimeSlotSchema,
    '11': TimeSlotSchema,
    '12': TimeSlotSchema,
    '13': TimeSlotSchema,
    '14': TimeSlotSchema,
    '15': TimeSlotSchema,
    '16': TimeSlotSchema,
    '17': TimeSlotSchema,
    '18': TimeSlotSchema,
    '19': TimeSlotSchema,
    '20': TimeSlotSchema
}, { _id: false });

// Main Desk Reservation Schema
const DeskSchema = new mongoose.Schema({
    tableId: {
        type: Number,
        required: true,
        unique: true
    },
    week: {
        type: String,
        required: true
    },
    schedule: {
        Monday: DayScheduleSchema,
        Tuesday: DayScheduleSchema,
        Wednesday: DayScheduleSchema,
        Thursday: DayScheduleSchema,
        Friday: DayScheduleSchema,
        Saturday: DayScheduleSchema,
        Sunday: DayScheduleSchema
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create an index on tableId for faster queries
DeskSchema.index({ tableId: 1 });

const Desk = mongoose.model('Desk', DeskSchema);

module.exports = Desk;