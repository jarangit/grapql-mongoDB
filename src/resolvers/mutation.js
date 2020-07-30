import bcrypt from "bcrypt" 
import User from "../models/user"
import Product from '../models/product'
import CartItem from "../models/cartItem"


const Mutation = {
    signup: async (parent, args, context, info) => {

        //Trim and lower case email
        const email = args.email.trim().toLowerCase()

        //Check if email already exist in database
        const currentUsers =  await User.find({})
        const isEmailExist = currentUsers.findIndex(user => user.emit === email) > -1

        if (isEmailExist) {
            throw new Error('Email already exist.')
        }

        //Validate password
        if(args.password.trim().length < 6) {
            throw new Error ('Password must be at least 6 characters.')
        }

        //Hash password
        const password =  await bcrypt.hash(args.password, 10)

        return User.create({...args, email, password})
    },

    createProduct: async (parent, args, context, info) => {
        const userId = "5e410a922cf6d113c47d3886"


        if (!args.description || !args.price || !args.imageUrl){
            throw new Error('Please provide all required fields.')
        }

        const product = await Product.create({...args, user: userId})
        const user = await User.findById(userId)
        console.log(user.products)

        if(!user.products){
            user.products = [product]
        } else {
            user.products.push(product)
        }

        await user.save()

        return Product.findById(product.id).populate({
            path: "user",
            populate: { path: "products" }
        })
    },
    updateProduct : async (parent, args, context, info) => {
        const {id, description, price, imageUrl} = args

        //Check if user logged in

        //Find product in database
        const product = await Product.findById(id)

        //Check if user is the owner of the product
        const userId = "5e410a922cf6d113c47d3886"
        if(userId !== product.user.toString()){
            throw new Error('You are not authorized')
        }

        // Form updated information
        const updateInfo = {
            description: !!description ? description : product.description,
            price: !!price ? price : product.price,
            imageUrl: !!imageUrl ? imageUrl : product.imageUrl
        }

        //Update product in database
        await  Product.findByIdAndUpdate(id, updateInfo)

        //Find the update product 
        const updatedProduct =  await Product.findById(id).populate({path: "user"})

        return updatedProduct

    },

    addToCart : async (parent, args, context, info) => {
        //this id is  productId
        const {id} = args

        try{
            //หา user ที่ต้อง cart
            const userId = "5e425f9c424d30217cb184b6"

            //เช็คว่ามีการเพิ่มสินค้าหรือยัง
            const user =  await User.findById(userId).populate({
                path: "carts",
                populate: { path: "product" }
            })

            const findCartItemIndex = user.carts.findIndex(
                cartItem => cartItem.populate.id === id
            )

            if (findCartItemIndex > -1) {
            // A. The new addToCart item is already in cart
                // A.1 Find the cart from database
                user.carts[findCartItemIndex].quantity += 1 

                await CartItem.findByIdAndUpdate(user.carts[findCartItemIndex].id, {
                    quantity: user.carts[findCartItemIndex].quantity
                })
                // A.2 Update quantity od that cartItem ---> increase
                const updatedCartItem = await CartItem.findById(
                    user.carts[findCartItemIndex].id
                )
                .populate({ path: "product" })
                .populate({ path: "user" })

                return updatedCartItem

            }else{
                // B. The new addToCart item is not in cart yet
                    // B.1 Create new cartItem
                    const cartItem = await CartItem.create({
                        product: id,
                        quantity: 1,
                        user: userId
                    })
                    // find new cartItem
                    const newCartItem = await CartItem.findById(cartItem.id)
                    .populate({ path: "product" })
                    .populate({ path: "user" })
                    // B.2 Update user.carts
                    await User.findByIdAndUpdate(userId, {
                        carts: [...user.carts, newCartItem]
                    })
  
                    return newCartItem

            }
           


        } catch(error){
            console.log(error)
        }
    },
    deleteCart: async (parent, args, context, info) => {
        const { id } = args


        // Find cart from give id 
        const cart = await CartItem.findById(id)

        // check logged

        // Find user id from request ---> Find user
        const userId = ""

        const user = await User.findById(userId)

        // Check owner ship of the cart 
        if (cart.user.toString() !== userId){
            throw new Error('Not authorized')
        }

        // Delete cart 
        const deletedCart =  await CartItem.findOneAndRemove(id)

        const updatedUserCart =  user.carts.filter(
                cartId => cartId.toString() !== deleteCart.id.toString()
            )
            await User,findByIdAndUpdate(userId, {carts: updatedUserCart})

            return deletedCart
    }

}

export default Mutation