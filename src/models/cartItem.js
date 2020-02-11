import mongoose from "mongoose"

const cartItemSchema = new mongoose.Schema({


    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    products: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    quantity: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
})

const User = mongoose.model("User", cartItemSchema)

export default cartItem