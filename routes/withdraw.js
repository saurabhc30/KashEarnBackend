const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/Users");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");

const router = express.Router();


/* =========================================
   WITHDRAWAL REQUIREMENTS
========================================= */

const MIN_WITHDRAWAL = 30;
const MIN_REFERRALS = 5;
const MIN_ADS = 10;
const MIN_LOGIN_DAYS = 7;


/* =========================================
   CREATE WITHDRAWAL
========================================= */

router.post("/", async (req, res) => {

    try {

        const {
            userId,
            amount
        } = req.body;


        if (
            !userId ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });

        }


        const withdrawalAmount =
            Number(amount);


        if (
            !Number.isFinite(withdrawalAmount) ||
            withdrawalAmount < MIN_WITHDRAWAL
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Minimum withdrawal amount is ₹300."
            });

        }


        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }

        const existingPendingWithdrawal =
            await Withdrawal.findOne({
                userId: user._id,
                status: {
                    $in: ["Pending", "Approved"]
                }
            });

        if (existingPendingWithdrawal) {

            return res.status(400).json({
                success: false,
                message:
                    "You already have a withdrawal request being processed."
            });

        }

        /* =========================================
           CHECK BALANCE
        ========================================= */

        if (
            Number(user.balance || 0) <
            withdrawalAmount
        ) {

            return res.status(400).json({
                success: false,
                message: "Insufficient balance."
            });

        }


        /* =========================================
           CHECK REFERRALS
        ========================================= */

        if (
            Number(user.referrals || 0) <
            MIN_REFERRALS
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You need at least 5 referrals."
            });

        }


        /* =========================================
           CHECK LIFETIME ADS
        ========================================= */

        if (
            Number(user.totalAdsWatched || 0) <
            MIN_ADS
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You need to watch at least 10 ads."
            });

        }


        /* =========================================
           CHECK LOGIN DAYS
        ========================================= */

        if (
            Number(user.loginDays || 0) <
            MIN_LOGIN_DAYS
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You need at least 7 login days."
            });

        }


        /* =========================================
           CREATE WITHDRAWAL
        ========================================= */

        const withdrawal =
            new Withdrawal({

                userId:
                    user._id,

                amount:
                    withdrawalAmount,

                status:
                    "Pending"

            });


        await withdrawal.save();

        await Transaction.create({
            userId: user._id,
            type: "Withdrawal",
            amount: withdrawalAmount,
            status: "Pending",
            description: "Withdrawal request"
        });

        /* =========================================
           RESERVE / DEDUCT BALANCE
        ========================================= */

        user.balance =
            Number(user.balance || 0) -
            withdrawalAmount;


        await user.save();

        await Transaction.create({

            userId: user._id,

            type: "Withdrawal",

            amount: withdrawalAmount,

            status: "Pending",

            description: "Withdrawal request"

        });


        return res.status(201).json({

            success: true,

            message:
                "Withdrawal request submitted successfully.",

            withdrawal: {

                id:
                    withdrawal._id,

                amount:
                    withdrawal.amount,

                status:
                    withdrawal.status,

                createdAt:
                    withdrawal.createdAt
            },

            balance:
                user.balance

        });


    } catch (error) {

        console.error(
            "Withdrawal error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to process withdrawal."
        });

    }

});


/* =========================================
   USER WITHDRAWAL HISTORY
========================================= */

router.get("/:userId", async (req, res) => {

    try {

        const userId =
            req.params.userId;


        if (
            !mongoose.Types.ObjectId.isValid(userId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid user ID."
            });

        }


        const withdrawals =
            await Withdrawal.find({
                userId: userId
            })
                .sort({
                    createdAt: -1
                });


        return res.json({

            success: true,

            withdrawals:
                withdrawals

        });


    } catch (error) {

        console.error(
            "Withdrawal history error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load withdrawal history."
        });

    }

});


/* =========================================
   ADMIN - GET ALL WITHDRAWALS
========================================= */

router.get("/admin/all", async (req, res) => {

    try {

        const adminKey =
            req.headers["x-admin-key"];


        if (
            !process.env.ADMIN_KEY ||
            adminKey !== process.env.ADMIN_KEY
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized."
            });

        }


        const withdrawals =
            await Withdrawal.find()
                .populate(
                    "userId",
                    "name email inviteCode"
                )
                .sort({
                    createdAt: -1
                });


        return res.json({

            success: true,

            withdrawals:
                withdrawals

        });


    } catch (error) {

        console.error(
            "Admin withdrawal list error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load withdrawals."
        });

    }

});


/* =========================================
   ADMIN - UPDATE WITHDRAWAL STATUS
========================================= */

router.patch("/admin/:withdrawalId", async (req, res) => {

    try {

        const adminKey =
            req.headers["x-admin-key"];


        if (
            !process.env.ADMIN_KEY ||
            adminKey !== process.env.ADMIN_KEY
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized."
            });

        }


        const withdrawalId =
            req.params.withdrawalId;


        if (
            !mongoose.Types.ObjectId.isValid(
                withdrawalId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid withdrawal ID."
            });

        }


        const {
            status
        } = req.body;


        const allowedStatuses = [
            "Pending",
            "Approved",
            "Rejected",
            "Completed"
        ];


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid withdrawal status."
            });

        }


        const withdrawal =
            await Withdrawal.findById(
                withdrawalId
            );


        if (!withdrawal) {

            return res.status(404).json({

                success: false,

                message:
                    "Withdrawal not found."
            });

        }


        const oldStatus =
            withdrawal.status;


        /* =========================================
           PREVENT UNNECESSARY CHANGES
        ========================================= */

        if (
            oldStatus === status
        ) {

            return res.json({

                success: true,

                message:
                    "Status is already " +
                    status + ".",

                withdrawal:
                    withdrawal

            });

        }


        /* =========================================
           REJECTED WITHDRAWAL
           RETURN MONEY TO USER
        ========================================= */

        if (
            status === "Rejected" &&
            oldStatus !== "Rejected"
        ) {

            const user =
                await User.findById(
                    withdrawal.userId
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."
                });

            }


            user.balance =
                Number(user.balance || 0) +
                Number(withdrawal.amount || 0);


            await user.save();

        }


        /* =========================================
           PREVENT DOUBLE REFUND
        ========================================= */

        if (
            oldStatus === "Rejected" &&
            status !== "Rejected"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A rejected withdrawal cannot be reopened."
            });

        }


        /* =========================================
           UPDATE STATUS
        ========================================= */

        withdrawal.status =
            status;


        await withdrawal.save();

        const transactionUpdateStatus =
            status === "Approved"
                ? "Pending"
                : status;

        await Transaction.findOneAndUpdate(
            {
                userId: withdrawal.userId,
                type: "Withdrawal",
                amount: withdrawal.amount,
                status: oldStatus
            },
            {
                status: status
            },
            {
                sort: { createdAt: -1 }
            }
        );
        return res.json({

            success: true,

            message:
                "Withdrawal status updated.",

            withdrawal:
                withdrawal

        });


    } catch (error) {

        console.error(
            "Admin withdrawal update error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update withdrawal."
        });

    }

});


module.exports = router;