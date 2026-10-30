import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: [
                "resident",
                "representative",
                "electricity_staff",
                "admin",
            ],
            default: "resident",
            required: true,
        },

        accountStatus: {
            type: String,
            enum: ["pending", "active", "suspended"],
            default: "active",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const bcrypt = await import("bcryptjs");

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    const bcrypt = await import("bcryptjs");
    
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;