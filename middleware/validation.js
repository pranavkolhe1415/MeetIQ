/**
 * Validation Middleware
 */

const { body, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({

            success: false,

            errors: errors.array()

        });

    }

    next();

};

const signupValidation = [

    body("name")
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("email")
        .isEmail()
        .withMessage("Enter a valid email")
        .normalizeEmail(),

    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),

    handleValidation

];

const loginValidation = [

    body("email")
        .isEmail()
        .withMessage("Invalid Email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    handleValidation

];

const profileValidation = [

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }),

    body("company")
        .optional()
        .trim()
        .isLength({ max: 150 }),

    body("jobTitle")
        .optional()
        .trim()
        .isLength({ max: 150 }),

    body("phone")
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage("Phone number must contain exactly 10 digits"),

    handleValidation

];

const chatValidation = [

    body("meetingId")
        .isMongoId()
        .withMessage("Invalid Meeting ID"),

    body("message")
        .trim()
        .notEmpty()
        .isLength({ max: 1000 })
        .withMessage("Message cannot exceed 1000 characters"),

    handleValidation

];

module.exports = {

    signupValidation,

    loginValidation,

    profileValidation,

    chatValidation,

    handleValidation

};