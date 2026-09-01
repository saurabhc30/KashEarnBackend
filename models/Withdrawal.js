const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 300
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
                "Completed"
            ],
            default: "Pending"
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports =
    mongoose.model("Withdrawal", withdrawalSchema);