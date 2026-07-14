/**
 * User Model
 * Handles user authentication, profile, preferences, and account management
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ==========================
    // Basic Information
    // ==========================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    // ==========================
    // Profile
    // ==========================

    profileImage: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    // ==========================
    // Account
    // ==========================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    loginProvider: {
      type: String,
      enum: ["email", "google", "microsoft"],
      default: "email",
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // ==========================
    // Preferences
    // ==========================

    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "dark",
      },

      language: {
        type: String,
        default: "English",
      },

      notifications: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================
    // Statistics
    // ==========================

    meetingsCount: {
      type: Number,
      default: 0,
    },

    totalMeetingMinutes: {
      type: Number,
      default: 0,
    },

    lastMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },

    // ==========================
    // OTP Verification
    // ==========================

    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    // ==========================
    // Forgot Password
    // ==========================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// Indexes
// ==========================



// ==========================
// Virtual
// ==========================

userSchema.virtual("displayName").get(function () {
  return this.name;
});

// ==========================
// Hash Password Before Save
// ==========================

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==========================
// Compare Password
// ==========================

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ==========================
// Hide Sensitive Data
// ==========================

userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;

  return obj;
};

module.exports = mongoose.model("User", userSchema);