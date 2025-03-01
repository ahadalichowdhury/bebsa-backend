const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true
    },

}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});


const User = mongoose.model('User', userSchema);

module.exports = User; 