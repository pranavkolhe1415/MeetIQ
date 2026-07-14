/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const User = require("../models/User");
const { verifyToken } = require("../config/jwt");

const auth = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = verifyToken(token);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // Check account status
        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support."
            });
        }

        // Enable after Email OTP is implemented
        /*
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first."
            });
        }
        */

        req.user = user;

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });

    }
};

const optionalAuth = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {

            const token = authHeader.split(" ")[1];

            const decoded = verifyToken(token);

            const user = await User.findById(decoded.id).select("-password");

            if (user && user.status === "active") {
                req.user = user;
            }

        }

    } catch (error) {
        // Continue without authentication
    }

    next();
};

module.exports = {
    auth,
    optionalAuth
};