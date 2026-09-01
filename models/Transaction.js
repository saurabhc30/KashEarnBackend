const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            required: true,
            enum: [
                "Watch Ad",
                "Daily Login",
                "Daily Bonus",
                "Referral",
                "Achievement",
                "Withdrawal"
            ]
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "Completed",
                "Pending",
                "Rejected"
            ],
            default: "Completed"
        },

        description: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Transaction",
        transactionSchema
    );