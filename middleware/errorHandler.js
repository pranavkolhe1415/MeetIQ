/**
 * Global Error Handler
 */

const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "ValidationError") {

        statusCode = 400;

        message = Object.values(err.errors)
            .map(e => e.message)
            .join(", ");

    }

    if (err.code === 11000) {

        statusCode = 400;

        const field = Object.keys(err.keyValue)[0];

        message = `${field} already exists`;

    }

    if (err.name === "CastError") {

        statusCode = 400;

        message = "Invalid ID";

    }

    if (err.code === "LIMIT_FILE_SIZE") {

        statusCode = 400;

        message = "Maximum upload size is 500MB.";

    }

    if (process.env.NODE_ENV === "development") {
        console.error(err);
    }

    res.status(statusCode).json({

        success: false,

        message,

        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })

    });

};

module.exports = errorHandler;