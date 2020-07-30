import User from "../models/user"
import bcrypt from "bcrypt" 
import Product from '../models/product'


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
            const user = await (await User.findById(userId)).populated({
                path: "carts",
                populate: { path: "product" }
            })
        } catch(error){
            console.log(error)
        }
    },

}

export default Mutation