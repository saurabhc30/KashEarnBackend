const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/Users");
const Transaction = require("../models/Transaction");

const router = express.Router();


/* =========================================
   REWARDS
========================================= */

const SIGNUP_BONUS = 25;
const REFERRAL_REWARD = 50;


/* =========================================
   CREATE UNIQUE INVITE CODE
========================================= */

async function generateInviteCode() {

    let code;
    let exists = true;

    while (exists) {

        code =
            "KE" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();

        exists =
            await User.exists({
                inviteCode: code
            });
    }

    return code;
}


/* =========================================
   SIGNUP
========================================= */

router.post("/signup", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            confirmPassword,
            inviteCode,
            termsAccepted
        } = req.body;


        /* =========================================
           REQUIRED FIELDS
        ========================================= */

        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });

        }


        /* =========================================
           TERMS
        ========================================= */

        if (termsAccepted !== true) {

            return res.status(400).json({
                success: false,
                message:
                    "You must accept the Terms and Conditions."
            });

        }


        /* =========================================
           PASSWORD MATCH
        ========================================= */

        if (password !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });

        }


        /* =========================================
           PASSWORD LENGTH
        ========================================= */

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });

        }


        /* =========================================
           EMAIL FORMAT
        ========================================= */

        const normalizedEmail =
            email.trim().toLowerCase();

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });

        }


        /* =========================================
           CHECK EXISTING USER
        ========================================= */

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });

        }


        /* =========================================
           REFERRAL
        ========================================= */

        let referredBy = null;

        if (
            inviteCode &&
            inviteCode.trim() !== ""
        ) {

            const referrer =
                await User.findOne({
                    inviteCode:
                        inviteCode.trim().toUpperCase()
                });

            if (!referrer) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid invite code."
                });

            }

            referredBy =
                referrer.inviteCode;
        }


        /* =========================================
           PASSWORD HASH
        ========================================= */

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        /* =========================================
           UNIQUE USER INVITE CODE
        ========================================= */

        const newInviteCode =
            await generateInviteCode();


        /* =========================================
           CREATE USER
           
           EVERY NEW USER GETS ₹25
        ========================================= */

        const user =
            await User.create({

                name:
                    name.trim(),

                email:
                    normalizedEmail,

                passwordHash,

                inviteCode:
                    newInviteCode,

                referredBy,

                // Signup bonus
                balance:
                    SIGNUP_BONUS,

                totalEarnings:
                    SIGNUP_BONUS

            });


        /* =========================================
           SIGNUP BONUS TRANSACTION
           
           This appears in the new user's
           transaction history.
        ========================================= */

        await Transaction.create({

            userId:
                user._id,

            type:
                "Signup Bonus",

            amount:
                SIGNUP_BONUS,

            status:
                "Completed",

            description:
                "Signup bonus for creating a new account"

        });


        /* =========================================
           UPDATE REFERRER
           
           REFERRER GETS ₹50
        ========================================= */

        if (referredBy) {

            const referrer =
                await User.findOne({
                    inviteCode: referredBy
                });

            if (referrer) {

                referrer.referrals =
                    Number(referrer.referrals || 0) +
                    1;

                referrer.balance =
                    Number(referrer.balance || 0) +
                    REFERRAL_REWARD;

                referrer.totalEarnings =
                    Number(referrer.totalEarnings || 0) +
                    REFERRAL_REWARD;

                await referrer.save();


                /* =========================================
                   REFERRAL TRANSACTION
                   
                   This appears in the referrer's
                   transaction history.
                ========================================= */

                await Transaction.create({

                    userId:
                        referrer._id,

                    type:
                        "Referral",

                    amount:
                        REFERRAL_REWARD,

                    status:
                        "Completed",

                    description:
                        "Referral reward"

                });

            }
        }


        /* =========================================
           SUCCESS RESPONSE
        ========================================= */

        return res.status(201).json({

            success: true,

            message:
                `Account created successfully. ₹${SIGNUP_BONUS} signup bonus added.`,

            signupBonus:
                SIGNUP_BONUS,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                inviteCode:
                    user.inviteCode,

                balance:
                    user.balance,

                totalEarnings:
                    user.totalEarnings,

                referrals:
                    user.referrals

            }

        });

    } catch (error) {

        console.error(
            "Signup error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to create account."

        });

    }

});


/* =========================================
   LOGIN
========================================= */

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password,
            termsAccepted
        } = req.body;


        /* =========================================
           REQUIRED FIELDS
        ========================================= */

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });

        }


        /* =========================================
           TERMS
        ========================================= */

        if (termsAccepted !== true) {

            return res.status(400).json({
                success: false,
                message:
                    "Please accept the Terms and Conditions."
            });

        }


        /* =========================================
           FIND USER
        ========================================= */

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });

        }


        /* =========================================
           CHECK DISABLED ACCOUNT
        ========================================= */

        if (user.accountDisabled) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account has been disabled."
            });

        }


        /* =========================================
           CHECK PASSWORD
        ========================================= */

        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.passwordHash
            );

        if (!passwordCorrect) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });

        }


        /* =========================================
           LOGIN SUCCESS
        ========================================= */

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                inviteCode:
                    user.inviteCode,

                referrals:
                    user.referrals,

                balance:
                    user.balance,

                totalEarnings:
                    user.totalEarnings,

                adsWatched:
                    user.adsWatched,

                loginDays:
                    user.loginDays,

                currentStreak:
                    user.currentStreak

            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to login."

        });

    }

});


module.exports = router;