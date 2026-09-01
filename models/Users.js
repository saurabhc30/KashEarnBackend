const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        inviteCode: {
            type: String,
            required: true,
            unique: true
        },

        referredBy: {
            type: String,
            default: null
        },

        referrals: {
            type: Number,
            default: 0
        },

        balance: {
            type: Number,
            default: 0
        },

        totalEarnings: {
            type: Number,
            default: 0
        },

        pendingEarnings: {
            type: Number,
            default: 0
        },

        totalAdsWatched: {
            type: Number,
            default: 0
        },

        adsWatched: {
            type: Number,
            default: 0
        },

        adsWatchedDate: {
            type: Date,
            default: null
        },

        loginDays: {
            type: Number,
            default: 0
        },

        currentStreak: {
            type: Number,
            default: 0
        },

        lastLoginDate: {
            type: Date,
            default: null
        },

        dailyBonusDate: {
            type: Date,
            default: null
        },

        dailyLoginClaimedDate: {
            type: Date,
            default: null
        },

        accountDisabled: {
            type: Boolean,
            default: false
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports =
    mongoose.model("User", userSchema);