import jwt from "jsonwebtoken";
import crypto from "crypto";
import UserSession from "../models/UserSession";

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
        }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex")
};

export const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

export const getRefreshTokenExpiry = () => {
    const expirationDays = Number(
        process.env.REFRESH_TOKEN_EXPIRES_IN?.replace("d", "") || 7
    );

    return new Date(
        Date.now() + expirationDays * 24 * 60 * 60 * 1000
    );
};


export const createUserSession = async (user) => {
    const refreshToken = generateRefreshToken();

    const now = Date.now();

    const absoluteExpiryDays = Number(
        process.env.SESSION_ABSOLUTE_EXPIRES_IN?.replace("d", "") || 30
    );

    const absoluteExpiresAt = new Date(
        now + absoluteExpiryDays * 24 * 60 * 60 * 1000
    );

    const refreshExpiry = getRefreshTokenExpiry();

    const expiresAt = new Date(
        Math.min(
            refreshExpiry.getTime(),
            absoluteExpiresAt.getTime()
        )
    );

    const session = await UserSession.create({
        user: user._id,
        currentRefreshTokenHash: hashRefreshToken(refreshToken),
        usedRefreshTokenHashes: [],
        expiresAt,
        absoluteExpiresAt,
    });

    return {
        session,
        refreshToken,
    };
};


export const rotateRefreshToken = async (refreshToken) => {
    const oldTokenHash = hashRefreshToken(refreshToken);

    const session = await UserSession.findOne({
        currentRefreshTokenHash: oldTokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
        absoluteExpiresAt: { $gt: new Date() },
    });

    if (!session) {
        const reusedSession = await UserSession.findOne({
            usedRefreshTokenHashes: oldTokenHash,
        });

        if (reusedSession) {
            await UserSession.updateOne(
                {
                    _id: reusedSession._id,
                    revokedAt: null,
                },
                {
                    $set: { revokedAt: new Date() },
                }
            );

            return { reuseDetected: true };
        }

        return null;
    }

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    const now = Date.now();

    const refreshExpiry = getRefreshTokenExpiry();

    const expiresAt = new Date(
        Math.min(
            refreshExpiry.getTime(),
            session.absoluteExpiresAt.getTime()
        )
    );

    const updatedSession = await UserSession.findOneAndUpdate(
        {
            _id: session._id,
            currentRefreshTokenHash: oldTokenHash,
            revokedAt: null,
            expiresAt: { $gt: new Date(now) },
            absoluteExpiresAt: { $gt: new Date(now) },
        },
        {
            $set: {
                currentRefreshTokenHash: newTokenHash,
                expiresAt,
            },
            $addToSet: {
                usedRefreshTokenHashes: oldTokenHash,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedSession) {
        return { reuseDetected: true };
    }

    return {
        session: updatedSession,
        refreshToken: newRefreshToken,
    };
};