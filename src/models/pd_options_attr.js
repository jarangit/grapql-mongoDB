import mongoose from "mongoose"

const pd_options_attrSchema = new mongoose.Schema({
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
    opVal: {
        type: String,
        required: true,
        trim: true
    },
    parentName: {
        type: String,
        required: true,
        trim: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    quantity: {
        type: Number
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductAttribute",
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
})

const PD_options_attr = mongoose.model("PD_options_attr", pd_options_attrSchema)

export default PD_options_attr