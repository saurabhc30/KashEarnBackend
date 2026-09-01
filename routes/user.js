const express = require("express");

const User = require("../models/Users");

const router = express.Router();


/* =========================================
   GET USER
   GET /api/user/:id
========================================= */

router.get("/:id", async (req, res) => {

    try {

        const user = await User.findById(req.params.id)
            .select("-passwordHash");


        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        /* =========================================
           DAILY AD RESET
        ========================================= */

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        if (
            user.adsWatchedDate &&
            new Date(user.adsWatchedDate)
                .setHours(0, 0, 0, 0) !==
            today.getTime()
        ) {

            user.adsWatched = 0;

            user.adsWatchedDate = null;

            await user.save();

        }


        /* =========================================
           RETURN USER
        ========================================= */

        return res.json({

            success: true,

            user: user

        });


    } catch (error) {

        console.error(
            "Get user error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Unable to load user."

        });

    }

});


/* =========================================
   UPDATE PROFILE
   PUT /api/user/:id
========================================= */

router.put("/:id", async (req, res) => {

    try {

        const name =
            typeof req.body.name === "string"
                ? req.body.name.trim()
                : "";


        /* =========================================
           VALIDATE NAME
        ========================================= */

        if (!name) {

            return res.status(400).json({

                success: false,

                message: "Name is required."

            });

        }


        if (name.length > 50) {

            return res.status(400).json({

                success: false,

                message:
                    "Name cannot be longer than 50 characters."

            });

        }


        /* =========================================
           FIND USER
        ========================================= */

        const user =
            await User.findById(req.params.id);


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        /* =========================================
           UPDATE ONLY NAME
        ========================================= */

        user.name = name;

        await user.save();


        /* =========================================
           RETURN UPDATED USER
        ========================================= */

        return res.json({

            success: true,

            message: "Profile updated successfully.",

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                inviteCode: user.inviteCode,

                referrals: user.referrals,

                balance: user.balance,

                totalEarnings: user.totalEarnings

            }

        });


    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update profile."

        });

    }

});


module.exports = router;

