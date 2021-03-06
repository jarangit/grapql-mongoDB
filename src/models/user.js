import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    providerId: {
        type: String
    },
    resetPasswordToken:  {
        type: String
    },
    resetTokenExpiry: {
        type: Number
    },
    carts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CartItem"
        }
    ],
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ],
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
})

const User = mongoose.model("User", userSchema)

export default User