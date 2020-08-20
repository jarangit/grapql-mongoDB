import  { randomBytes } from 'crypto'
import bcrypt from "bcrypt" 
import jwt from 'jsonwebtoken'
import User from "../models/user"
import Product from '../models/product'
import CartItem from "../models/cartItem"
import sgMail from '@sendgrid/mail'
import { EROFS } from 'constants'
import ProductCategory from '../models/productCategory'
import ProductAttribute from '../models/productAttribute'
import PD_options_attr from '../models/pd_options_attr'

const Mutation = {
    login: async (parent, args, context, info) => {
        const {email, password} = args

        //Find user in database
        const user = await User.findOne({ email })
        .populate({
            path: 'products',
            populate: { path: 'user' }
            })
        .populate({ path: 'carts', populate: { path: 'product' } })

        if (!user) throw new Error ("Email not found, please sing up.")

        // Check if password correct
        const validPassword = await bcrypt.compare(password, user.password)

        if (!validPassword) throw new Error("Invalid email or password.")

        const token = jwt.sign({userId: user.id}, process.env.SECRET, {expiresIn: "7day"})

        return {user, jwt: token}
    },
    edit_account_user: async (parent, args, { userId }, info) => {
        const {id, name, tel, line_id, address, image_profile} = args

        if (!userId) throw new Error ("Please login")

        const user = await User.findById(id)

        const updateInfo = {
            name: !!name ? name : user.name,
            tel: !!tel ? tel : user.tel,
            line_id: !!line_id ? line_id : user.price,
            address: !!address ? address : user.imageUrl,
            image_profile: !!image_profile ? image_profile : user.imageUrl
        }

        await  User.findByIdAndUpdate(id, updateInfo)
        const updatedUser =  await User.findById(id)

        return updatedUser


    },
    requestResetPassword: async (parent, {email}, context, info) => {
        // Find user in database
        const user = await User.findOne({email})

        //2. If not found user the throw error 
        if (!user) throw Error ("Email not found")

        // 3. Create resetPasswordToken and resetTokenExpiry
        const resetPasswordToken = randomBytes(32).toString("hex")
        const resetTokenExpiry = Date.now() + 30 * 60 * 100

        // 4. Update user { save reset token and token expiry }

        await User.findByIdAndUpdate(user.id, {
            resetPasswordToken,
            resetTokenExpiry
        })
        // 5. Send link 
        sgMail.setApiKey(process.env.EMAIL_API_KEY)
        
        const msg = {
            from: 's58127328108@ssru.ac.th',
            to: user.email,
            subject: 'Reset password link',
            html: `
                <div>
                <p>Please click the link below to reset your password.</p> \n\n
                <a href='http://localhost:3000/register/resetPassword?resetToken=${resetPasswordToken}' target='blank' style={{color: 'blue'}}>Click to reset your password</a>
                </div>
            `
        }

        sgMail.send(msg).then(() => {
            console.log('Message sent')
        }).catch((error) => {
            console.log(error.response.body)
            console.log(error.response.body.errors[0].message)
        })  
        return { message: "Check your email" }

    },
    resetResetPassword: async (parent, {password, token}, context, info) => {
        // Find user in database by reset token
        const user = await User.findOne( { resetPasswordToken: token } )

        // If can't found user throw error
        if (!user) throw Error ('NOT FOUND USER')

        // Check token expiry
        const isTokenExpiry = user.resetTokenExpiry < Date.now()
        
        //If token expiry throw error
        if (isTokenExpiry) throw Error ('YOUR TOKEN EXPIRY')

        //Has new password
        const hashedPassword =  await bcrypt.hash(password, 10)

        //Update password user in database (and delete old password )
        await User.findByIdAndUpdate(user.id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetTokenExpiry: null
        })
        return {
            message: "RESET PASSWORD COMPLETE"
        }
        
    },
    signup: async (parent, args, context, info) => {
        //Trim and lower case email
        const email = args.email.trim().toLowerCase()
        const username = args.username.trim().toLowerCase()
        //Check if email already exist in database
        const currentUsers =  await User.find({})
        const isEmailExist = currentUsers.findIndex(user => user.email === email) > -1
        const isUsernameExist = currentUsers.findIndex(user => user.username === username) > -1
        
        if (isEmailExist) {
            throw new Error('Email already exist.')
        }else if (isUsernameExist) {
            throw new Error('Username already exist.')
        } else {
            
        }
        
        //Validate password
        if(args.password.trim().length < 6) {
            throw new Error ('Password must be at least 6 characters.')
        }

        //Hash password
        const password =  await bcrypt.hash(args.password, 10)

        return User.create({...args, email, password})
    },

    createProduct: async (parent, args, { userId }, info) => {
        if (!userId) throw new Error ("Please login")
        // console.log(args.pd_options_attr[0])
        if (!args.name ||!args.description || !args.price || !args.imageUrl){
            throw new Error('Please provide all required fields.')
        }
        const product = await Product.create({...args, user: userId})
        
        //เซ็คว่าลูกค้ามีสินค้านี้อยู่หรือไหม
        const user = await User.findById(userId)
        if(!user.products){
            user.products = [product]
        } else {
            user.products.push(product)
        }


        //เช็ค cat ว่ามีอยู่หรือไม่
        const productCategoryID =  await ProductCategory.find({})
        const cusProductCategoryID = productCategoryID.findIndex(productCategory => productCategory.id === args.productCategory) > -1
        if(cusProductCategoryID === false) throw new Error ("NOT FOUND CATEGORY") 

        // save data product to productCategory.products
        const productCategory = await ProductCategory.findById(args.productCategory)
        if(!productCategory.products){
            productCategory.products = [product]
        } else {
            productCategory.products.push(product)
        }        


        //เช็ค attr ว่ามีอยู่หรือไม่
            args.pd_options_attr.map(async items => {
                console.log(items)
                        const pd_options_attrID =  await PD_options_attr.find({})
                        const cusPD_options_attrID = pd_options_attrID.findIndex(pd_options_attr => pd_options_attr.id === items) > -1
                        if(cusPD_options_attrID === false) throw new Error ("NOT FOUND Attr") 
                        const pd_options_attr = await PD_options_attr.findById(items)
                        if(!pd_options_attr.products){
                            pd_options_attr.products = [product]
                        } else {
                            pd_options_attr.products.push(product)
                        }
                        await pd_options_attr.save()
                    })

                await productCategory.save()

                await user.save()

        return Product.findById(product.id)
                .populate({
                    path: "user",
                    populate: { path: "products" }
                })
    },
    createProductCategory: async (parent, args, { userId }, info) => {
        if (!userId) throw new Error ("Please login")

        if (!args.name ||!args.description || !args.slug || !args.imageUrl){
            throw new Error('Please provide all required fields.')
        }
        const productCategory = await ProductCategory.create({...args, user: userId})
        const user = await User.findById(userId)
        console.log(user.productCategories)

        if(!user.productCategories){
            user.productCategories = [productCategory]
        } else {
            user.productCategories.push(productCategory)
        }

        await user.save()

        return ProductCategory.findById(productCategory.id).populate({
            path: "user",
            populate: { path: "productCategories" }
        })
    },
    createProductAttribute: async (parent, args, { userId }, info) => {
        if (!userId) throw new Error ("Please login")

        if (!args.name ||!args.description || !args.slug || !args.imageUrl){
            throw new Error('Please provide all required fields.')
        }
        const productAttribute = await ProductAttribute.create({...args, user: userId})
        const user = await User.findById(userId)
        console.log(user.productAttributes)

        if(!user.productAttributes){
            user.productAttributes = [productAttribute]
        } else {
            user.productAttributes.push(productAttribute)
        }

        await user.save()

        return ProductAttribute.findById(productAttribute.id).populate({
            path: "user",
            populate: { path: "productAttributes" }
        })
    },
    createOptionsAttr: async (parent, args, { userId }, info) => {
        if (!userId) throw new Error ("Please login")
        const attrId = "5f3d54f64bf47028089cfa18"
        if (!args.name  || !args.slug || !args.opVal){
            throw new Error('Please provide all required fields.')
        }
        const productAttribute = await PD_options_attr.create({...args, parent: attrId})
        const ProductAttributeID = await ProductAttribute.findById(attrId)
        // console.log(ProductAttributeID)
        if(!ProductAttributeID){
            ProductAttributeID = [productAttribute]
        } else {
            ProductAttributeID.options.push(productAttribute)
        }

        await ProductAttributeID.save()
        console.log(productAttribute)
        return PD_options_attr.findById(productAttribute.id).populate({
            path: "parent",
            populate: { path: "pd_options_attrs" }
        })
        
    },
    updateProduct : async (parent, args, {userId}, info) => {
        const {id, name, description, price, imageUrl} = args

        //Check if user logged in
        if (!userId) throw new Error ("Please login")

        //Find product in database
        const product = await Product.findById(id)

        //Check if user is the owner of the product
        if(userId !== product.user.toString()){
            throw new Error('You are not authorized')
        }

        // Form updated information
        const updateInfo = {
            name: !!name ? name : product.name,
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
    deleteProduct: async (parent, args, {userId}, info) => {
        const { id } = args
        if (!userId) throw new Error ("Please login")

        const product = await Product.findById(id)

        const user = await User.findById(userId)

        if (product.user.toString() !== userId){
            throw new Error("Not authorized.")
        }

        const deletedProduct = await Product.findByIdAndRemove(id)

        const updatedUserProduct = user.products.filter(
            productId =>  productId.toString() !== deletedProduct.id.toString()
        )

        await User.findByIdAndUpdate(userId, {products: updatedUserProduct})

        return deletedProduct

    },
    addToCart : async (parent, args, {userId}, info) => {
        //this id is  productId
        const {id} = args
        if (!userId) throw new Error ("Please login")

        try{
            //หา user ที่ต้อง cart

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
    deleteCart: async (parent, args, {userId}, info) => {
        const { id } = args
        if (!userId) throw new Error ("Please login")


        // Find cart from give id 
        const cart = await CartItem.findById(id)

        // check logged

        // Find user id from request ---> Find user

        const user = await User.findById(userId)


        // Check owner ship of the cart 
        if (cart.user.toString() !== userId) {
            throw new Error("Not authorized.")
          }

        // Delete cart 
        const deletedCart =  await CartItem.findByIdAndRemove(id)

        const updatedUserCart =  user.carts.filter(
                cartId => cartId.toString() !== deletedCart.id.toString()
            )
            await User.findByIdAndUpdate(userId, {carts: updatedUserCart})

            return deletedCart
    },

}

export default Mutation