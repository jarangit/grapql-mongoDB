import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }, 
  description: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  reason_sell: {
    type: String,
    trim: true
  },
  shipping: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  pd_life: {
    type: Number,
    required: true
  },
  integrity: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
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

const Product = mongoose.model("Product", productSchema)

export default Product