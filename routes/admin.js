const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/Users");

const router = express.Router();


/* =========================================
   ADMIN AUTHENTICATION
========================================= */

function checkAdmin(req, res, next) {

    const adminKey =
        req.headers["x-admin-key"];

    if (
        !process.env.ADMIN_KEY ||
        adminKey !== process.env.ADMIN_KEY
    ) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        });

    }

    next();
}


/* =========================================
   ADMIN DASHBOARD STATS
========================================= */

router.get(
    "/dashboard",
    checkAdmin,
    async (req, res) => {

        try {

            const users =
                await User.find({})
                    .select(
                        "balance totalEarnings"
                    )
                    .lean();


            let totalEarnings = 0;

            let totalBalance = 0;


            users.forEach(
                function (user) {

                    totalEarnings +=
                        Number(
                            user.totalEarnings || 0
                        );

                    totalBalance +=
                        Number(
                            user.balance || 0
                        );

                }
            );


            return res.json({

                success: true,

                totalUsers:
                    users.length,

                totalEarnings:
                    totalEarnings,

                totalBalance:
                    totalBalance

            });


        } catch (error) {

            console.error(
                "Admin dashboard error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load dashboard."
            });

        }

    }
);


/* =========================================
   GET ALL USERS
========================================= */

router.get(
    "/users",
    checkAdmin,
    async (req, res) => {

        try {

            const search =
                String(
                    req.query.search || ""
                ).trim();


            let query = {};


            if (search) {

                const safeSearch =
                    search.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    );


                const regex =
                    new RegExp(
                        safeSearch,
                        "i"
                    );


                query = {

                    $or: [

                        {
                            name:
                                regex
                        },

                        {
                            email:
                                regex
                        },

                        {
                            inviteCode:
                                regex
                        }

                    ]

                };

            }


            const users =
                await User.find(query)
                    .select(
                        "-passwordHash"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            return res.json({

                success: true,

                users:
                    users

            });


        } catch (error) {

            console.error(
                "Admin users error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load users."
            });

        }

    }
);


/* =========================================
   GET SINGLE USER
========================================= */

router.get(
    "/users/:userId",
    checkAdmin,
    async (req, res) => {

        try {

            const userId =
                req.params.userId;


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
                await User.findById(
                    userId
                )
                    .select(
                        "-passwordHash"
                    )
                    .lean();


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."
                });

            }


            return res.json({

                success: true,

                user:
                    user

            });


        } catch (error) {

            console.error(
                "Admin user details error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load user."
            });

        }

    }
);

/* =========================================
   ADMIN - ENABLE / DISABLE USER
========================================= */

router.patch(
    "/users/:userId/status",
    checkAdmin,
    async (req, res) => {

        try {

            const userId =
                req.params.userId;

            const {
                disabled
            } = req.body;


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID."
                });

            }


            if (
                typeof disabled !== "boolean"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "disabled must be true or false."
                });

            }


            const user =
                await User.findById(
                    userId
                );


            if (!user) {

                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });

            }


            user.accountDisabled =
                disabled;


            await user.save();


            return res.json({

                success: true,

                message:
                    disabled
                        ? "User account disabled."
                        : "User account enabled.",

                accountDisabled:
                    user.accountDisabled

            });


        } catch (error) {

            console.error(
                "Admin user status error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to update user status."

            });

        }

    }
);

module.exports = router;