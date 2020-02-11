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
    carts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cartitem"
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