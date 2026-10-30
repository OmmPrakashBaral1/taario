import User from "../models/User.js";


export const registerUser = async (req, res) => {
    try{
        const {fullName, email, password, role} = req.body;


        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and password are required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        const allowedRoles = [
            "resident",
            "representative",
            "electricity_staff",
        ];

        const selectedRole = role || "resident";

        if (!allowedRoles.includes(selectedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration role.",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const accountStatus =
            selectedRole === "resident" ? "active" : "pending";

        const user = await User.create({
            fullName,
            email,
            password,
            role: selectedRole,
            accountStatus,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
            },
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "An error occurred during registration.",
        });
    }
};