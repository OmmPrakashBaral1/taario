import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        currentRefreshTokenHash: {
            type: String,
            required: true,
            unique: true
        },
        usedRefreshTokenHashes:{
            type: [String],
            default: []
        },
        expiresAt:{
            type: Date,
            required: true
        },
        absoluteExpiresAt:{
            type: Date,
            required: true
        },
        revokedAt:{
            type: Date,
            default: null
        },
        userAgent:{
            type: String,
            default: null
        },
        ipAddress:{
            type: String,
            default: null
        },
    },
    {
        timestamps: true,
    }
);

userSessionSchema.index({ user: 1 });

const UserSession = mongoose.model("UserSession", userSessionSchema);

export default UserSession;