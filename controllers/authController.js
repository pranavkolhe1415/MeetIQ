const User = require("../models/User");
const Settings = require("../models/Settings");
const Notification = require("../models/Notification");
const { generateToken } = require("../config/jwt");

/*
==========================================
Signup
==========================================
*/

exports.signup = async (req, res, next) => {

    try {

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });

        }

        const user = await User.create({
            name,
            email,
            password
        });

        await Settings.create({
            user: user._id
        });

        await Notification.create({
            user: user._id,
            type: "info",
            title: "Welcome",
            message: "Welcome to MeetIQ"
        });

        const token = generateToken(user._id);

        res.status(201).json({

            success: true,

            message: "Account created successfully",

            data: {

                user,

                token

            }

        });

    } catch (error) {

        next(error);

    }

};

/*
==========================================
Login
==========================================
*/

exports.login = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({
            email
        }).select("+password");

        if (!user) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password"

            });

        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password"

            });

        }

        user.lastLogin = new Date();

        await user.save();

        const token = generateToken(user._id);

        res.json({

            success: true,

            message: "Login successful",

            data: {

                user,

                token

            }

        });

    } catch (error) {

        next(error);

    }

};

/*
==========================================
Profile
==========================================
*/

exports.getProfile = async (req, res, next) => {

    try {

        const user = await User.findById(req.user._id);

        const settings = await Settings.findOne({

            user: req.user._id

        });

        res.json({

            success: true,

            data: {

                user,

                settings

            }

        });

    } catch (error) {

        next(error);

    }

};

exports.updateProfile = async (req, res, next) => {

    try {

        const updates = {};

        const allowed = [

            "name",

            "company",

            "jobTitle",

            "phone",

            "timezone",

            "profileImage"

        ];

        allowed.forEach(field => {

            if (req.body[field] !== undefined)

                updates[field] = req.body[field];

        });

        const user = await User.findByIdAndUpdate(

            req.user._id,

            updates,

            {

                new: true,

                runValidators: true

            }

        );

        res.json({

            success: true,

            message: "Profile updated",

            data: {

                user

            }

        });

    } catch (error) {

        next(error);

    }

};

/*
==========================================
Password
==========================================
*/

exports.updatePassword = async (req, res, next) => {

    try {

        const {

            currentPassword,

            newPassword

        } = req.body;

        if (!currentPassword || !newPassword) {

            return res.status(400).json({

                success: false,

                message: "Both passwords required"

            });

        }

        const user = await User.findById(

            req.user._id

        ).select("+password");

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {

            return res.status(401).json({

                success: false,

                message: "Current password incorrect"

            });

        }

        user.password = newPassword;

        await user.save();

        const token = generateToken(user._id);

        res.json({

            success: true,

            message: "Password updated",

            data: {

                token

            }

        });

    } catch (error) {

        next(error);

    }

};

/*
==========================================
Settings
==========================================
*/

exports.updateSettings = async (req, res, next) => {

    try {

        const settings = await Settings.findOneAndUpdate(

            {

                user: req.user._id

            },

            {

                $set: req.body

            },

            {

                new: true,

                upsert: true,

                runValidators: true

            }

        );

        res.json({

            success: true,

            data: {

                settings

            }

        });

    } catch (error) {

        next(error);

    }

};