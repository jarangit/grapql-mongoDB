import mongoose from "mongoose"

const FavItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  quantity: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => Date.now()
  }
})

const FavItem = mongoose.model("FavItem", FavItemSchema)

export default FavItem
