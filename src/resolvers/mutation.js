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
        const userId = "5e3bd6de5478ad234460bfa7"

        if (!args.description || !args.price || !args.imageUrl){
            throw new Error('Please provide all required fields.')
        }

        const product = await Product.create({...args, user: userId})
        const user = await User.findById(userId)

        if(!userId.products){
            user.products = [product]
        } else {
            user.products.push(product)
        }

        await user.save()

        return product
    }

}

export default Mutation