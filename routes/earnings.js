const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/Users");
const Transaction = require("../models/Transaction");

const router = express.Router();


/* =========================================
   GET TODAY'S DATE
========================================= */

function getTodayStart() {

    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
}


/* =========================================
   CHECK DISABLED ACCOUNT
========================================= */

function checkDisabled(user, res) {

    if (user.accountDisabled) {

        res.status(403).json({

            success: false,

            message:
                "Your account has been disabled."

        });

        return true;
    }

    return false;
}


/* =========================================
   DAILY LOGIN
========================================= */

router.post(
    "/daily-login/:id",
    async (req, res) => {

        const session =
            await mongoose.startSession();

        try {

            const userId =
                req.params.id;


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."

                });

            }


            let result;


            await session.withTransaction(
                async () => {

                    const user =
                        await User.findById(
                            userId
                        ).session(session);


                    if (!user) {

                        throw new Error(
                            "USER_NOT_FOUND"
                        );

                    }


                    if (
                        user.accountDisabled
                    ) {

                        throw new Error(
                            "ACCOUNT_DISABLED"
                        );

                    }


                    const today =
                        getTodayStart();


                    /* ALREADY CLAIMED */

                    if (
                        user.dailyLoginClaimedDate &&
                        new Date(
                            user.dailyLoginClaimedDate
                        )
                            .setHours(
                                0,
                                0,
                                0,
                                0
                            ) ===
                        today.getTime()
                    ) {

                        throw new Error(
                            "ALREADY_CLAIMED"
                        );

                    }


                    const reward = 2;


                    /* UPDATE USER */

                    user.balance =
                        Number(
                            user.balance || 0
                        ) + reward;


                    user.totalEarnings =
                        Number(
                            user.totalEarnings || 0
                        ) + reward;


                    user.loginDays =
                        Number(
                            user.loginDays || 0
                        ) + 1;


                    /* =========================================
   CALCULATE LOGIN STREAK
========================================= */

                    let newStreak = 1;

                    if (user.lastLoginDate) {

                        const lastLogin =
                            new Date(
                                user.lastLoginDate
                            );

                        lastLogin.setHours(
                            0,
                            0,
                            0,
                            0
                        );


                        const yesterday =
                            new Date(today);

                        yesterday.setDate(
                            yesterday.getDate() - 1
                        );


                        if (
                            lastLogin.getTime() ===
                            yesterday.getTime()
                        ) {

                            newStreak =
                                Number(
                                    user.currentStreak || 0
                                ) + 1;

                        }

                    }


                    user.currentStreak =
                        newStreak;


                    user.lastLoginDate =
                        new Date();


                    user.dailyLoginClaimedDate =
                        new Date();


                    await user.save({
                        session
                    });


                    /* CREATE TRANSACTION */

                    await Transaction.create(
                        [{
                            userId:
                                user._id,

                            type:
                                "Daily Login",

                            amount:
                                reward,

                            status:
                                "Completed",

                            description:
                                "Daily login reward"
                        }],
                        {
                            session
                        }
                    );


                    result = {

                        reward,

                        user: {

                            _id:
                                user._id,

                            id:
                                user._id,

                            name:
                                user.name,

                            balance:
                                user.balance,

                            totalEarnings:
                                user.totalEarnings,

                            loginDays:
                                user.loginDays,

                            currentStreak:
                                user.currentStreak,

                            dailyLoginClaimedDate:
                                user.dailyLoginClaimedDate

                        }

                    };

                }
            );


            return res.json({

                success: true,

                message:
                    "Daily login reward claimed.",

                reward:
                    result.reward,

                user:
                    result.user

            });


        } catch (error) {

            console.error(
                "Daily login error:",
                error
            );


            if (
                error.message ===
                "USER_NOT_FOUND"
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }


            if (
                error.message ===
                "ACCOUNT_DISABLED"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your account has been disabled."

                });

            }


            if (
                error.message ===
                "ALREADY_CLAIMED"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Daily login already claimed today.",

                    alreadyClaimed:
                        true

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Unable to claim daily login reward."

            });

        } finally {

            await session.endSession();

        }

    }
);


/* =========================================
   DAILY BONUS
========================================= */

router.post(
    "/daily-bonus/:id",
    async (req, res) => {

        const session =
            await mongoose.startSession();

        try {

            const userId =
                req.params.id;


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."

                });

            }


            let result;


            await session.withTransaction(
                async () => {

                    const user =
                        await User.findById(
                            userId
                        ).session(session);


                    if (!user) {

                        throw new Error(
                            "USER_NOT_FOUND"
                        );

                    }


                    if (
                        user.accountDisabled
                    ) {

                        throw new Error(
                            "ACCOUNT_DISABLED"
                        );

                    }


                    const today =
                        getTodayStart();


                    /* ALREADY CLAIMED */

                    if (
                        user.dailyBonusDate &&
                        new Date(
                            user.dailyBonusDate
                        )
                            .setHours(
                                0,
                                0,
                                0,
                                0
                            ) ===
                        today.getTime()
                    ) {

                        throw new Error(
                            "ALREADY_CLAIMED"
                        );

                    }


                    const reward = 5;


                    /* UPDATE USER */

                    user.balance =
                        Number(
                            user.balance || 0
                        ) + reward;


                    user.totalEarnings =
                        Number(
                            user.totalEarnings || 0
                        ) + reward;


                    user.dailyBonusDate =
                        new Date();


                    await user.save({
                        session
                    });


                    /* CREATE TRANSACTION */

                    await Transaction.create(
                        [{
                            userId:
                                user._id,

                            type:
                                "Daily Bonus",

                            amount:
                                reward,

                            status:
                                "Completed",

                            description:
                                "Daily bonus reward"
                        }],
                        {
                            session
                        }
                    );


                    result = {

                        reward,

                        user: {

                            _id:
                                user._id,

                            id:
                                user._id,

                            name:
                                user.name,

                            balance:
                                user.balance,

                            totalEarnings:
                                user.totalEarnings,

                            dailyBonusDate:
                                user.dailyBonusDate

                        }

                    };

                }
            );


            return res.json({

                success: true,

                message:
                    "Daily bonus claimed.",

                reward:
                    result.reward,

                user:
                    result.user

            });


        } catch (error) {

            console.error(
                "Daily bonus error:",
                error
            );


            if (
                error.message ===
                "USER_NOT_FOUND"
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }


            if (
                error.message ===
                "ACCOUNT_DISABLED"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your account has been disabled."

                });

            }


            if (
                error.message ===
                "ALREADY_CLAIMED"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Daily bonus already claimed today.",

                    alreadyClaimed:
                        true

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Unable to claim daily bonus."

            });

        } finally {

            await session.endSession();

        }

    }
);


/* =========================================
   WATCH AD + CLAIM REWARD
========================================= */

router.post(
    "/watch-ad/:id",
    async (req, res) => {

        const session =
            await mongoose.startSession();

        try {

            const userId =
                req.params.id;


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."

                });

            }


            let result;


            await session.withTransaction(
                async () => {

                    const user =
                        await User.findById(
                            userId
                        ).session(session);


                    if (!user) {

                        throw new Error(
                            "USER_NOT_FOUND"
                        );

                    }


                    if (
                        user.accountDisabled
                    ) {

                        throw new Error(
                            "ACCOUNT_DISABLED"
                        );

                    }


                    const today =
                        getTodayStart();


                    /* =========================================
                       RESET DAILY AD COUNT
                    ========================================= */

                    if (
                        user.adsWatchedDate &&
                        new Date(
                            user.adsWatchedDate
                        )
                            .setHours(
                                0,
                                0,
                                0,
                                0
                            ) !==
                        today.getTime()
                    ) {

                        user.adsWatched =
                            0;

                        user.adsWatchedDate =
                            null;

                    }


                    /* =========================================
                       MAXIMUM 10 ADS PER DAY
                    ========================================= */

                    if (
                        Number(
                            user.adsWatched || 0
                        ) >= 10
                    ) {

                        throw new Error(
                            "DAILY_LIMIT"
                        );

                    }


                    const reward = 5;


                    /* =========================================
                       UPDATE USER
                    ========================================= */

                    user.adsWatched =
                        Number(
                            user.adsWatched || 0
                        ) + 1;


                    user.totalAdsWatched =
                        Number(
                            user.totalAdsWatched || 0
                        ) + 1;


                    user.balance =
                        Number(
                            user.balance || 0
                        ) + reward;


                    user.totalEarnings =
                        Number(
                            user.totalEarnings || 0
                        ) + reward;


                    user.adsWatchedDate =
                        new Date();


                    await user.save({
                        session
                    });


                    /* =========================================
                       CREATE TRANSACTION
                    ========================================= */

                    await Transaction.create(
                        [{
                            userId:
                                user._id,

                            type:
                                "Watch Ad",

                            amount:
                                reward,

                            status:
                                "Completed",

                            description:
                                "Advertisement watch reward"
                        }],
                        {
                            session
                        }
                    );


                    result = {

                        reward,

                        user: {

                            _id:
                                user._id,

                            id:
                                user._id,

                            name:
                                user.name,

                            balance:
                                user.balance,

                            totalEarnings:
                                user.totalEarnings,

                            adsWatched:
                                user.adsWatched,

                            totalAdsWatched:
                                user.totalAdsWatched,

                            adsWatchedDate:
                                user.adsWatchedDate

                        }

                    };

                }
            );


            return res.json({

                success: true,

                message:
                    "Ad reward claimed successfully.",

                reward:
                    result.reward,

                user:
                    result.user

            });


        } catch (error) {

            console.error(
                "Watch ad error:",
                error
            );


            if (
                error.message ===
                "USER_NOT_FOUND"
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }


            if (
                error.message ===
                "ACCOUNT_DISABLED"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your account has been disabled."

                });

            }


            if (
                error.message ===
                "DAILY_LIMIT"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "You have completed all 10 ads today."

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Unable to claim ad reward."

            });

        } finally {

            await session.endSession();

        }

    }
);

/* =========================================
   GET USER TRANSACTION HISTORY
========================================= */

router.get(
    "/transactions/:id",
    async (req, res) => {

        try {

            const userId =
                req.params.id;


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."

                });

            }


            const user =
                await User.findById(userId)
                    .select("_id accountDisabled");


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }


            if (user.accountDisabled) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your account has been disabled."

                });

            }


            const transactions =
                await Transaction.find({
                    userId: userId
                })
                    .sort({
                        createdAt: -1
                    })
                    .limit(100);


            return res.json({

                success: true,

                count:
                    transactions.length,

                transactions:
                    transactions

            });


        } catch (error) {

            console.error(
                "Transaction history error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load transaction history."

            });

        }

    }
);


module.exports =
    router;
