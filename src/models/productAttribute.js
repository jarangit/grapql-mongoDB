import mongoose from "mongoose"

const productAttributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
})

const ProductAttribute = mongoose.model("ProductAttribute", productAttributeSchema)

export default ProductAttribute