import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Product from "../models/product";
import CartItem from "../models/cartItem";
import sgMail from "@sendgrid/mail";
import { EROFS } from "constants";
import ProductCategory from "../models/productCategory";
import ProductAttribute from "../models/productAttribute";
import PD_options_attr from "../models/pd_options_attr";
import mongoose from "mongoose";

const Mutation = {
  login: async (parent, args, context, info) => {
    const { email, password } = args;

    //Find user in database
    const user = await User.findOne({
      email,
    })
      .populate({
        path: "products",
        populate: {
          path: "user",
        },
      })
      .populate({
        path: "carts",
        populate: {
          path: "product",
        },
      });

    if (!user) throw new Error("Email not found, please sing up.");

    // Check if password correct
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) throw new Error("Invalid email or password.");

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.SECRET,
      {
        expiresIn: "7day",
      }
    );

    return {
      user,
      jwt: token,
    };
  },
  edit_account_user: async (parent, args, { userId }, info) => {
    const { id, name, tel, line_id, address, image_profile } = args;

    if (!userId) throw new Error("Please login");

    const user = await User.findById(id);

    const updateInfo = {
      name: !!name ? name : user.name,
      tel: !!tel ? tel : user.tel,
      line_id: !!line_id ? line_id : user.price,
      address: !!address ? address : user.imageUrl,
      image_profile: !!image_profile ? image_profile : user.imageUrl,
    };

    await User.findByIdAndUpdate(id, updateInfo);
    const updatedUser = await User.findById(id);

    return updatedUser;
  },
  requestResetPassword: async (parent, { email }, context, info) => {
    // Find user in database
    const user = await User.findOne({
      email,
    });

    //2. If not found user the throw error
    if (!user) throw Error("Email not found");

    // 3. Create resetPasswordToken and resetTokenExpiry
    const resetPasswordToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 30 * 60 * 100;

    // 4. Update user { save reset token and token expiry }

    await User.findByIdAndUpdate(user.id, {
      resetPasswordToken,
      resetTokenExpiry,
    });
    // 5. Send link
    sgMail.setApiKey(process.env.EMAIL_API_KEY);

    const msg = {
      from: "s58127328108@ssru.ac.th",
      to: user.email,
      subject: "Reset password link",
      html: `
                <div>
                <p>Please click the link below to reset your password.</p> \n\n
                <a href='http://localhost:3000/register/resetPassword?resetToken=${resetPasswordToken}' target='blank' style={{color: 'blue'}}>Click to reset your password</a>
                </div>
            `,
    };

    sgMail
      .send(msg)
      .then(() => {
        console.log("Message sent");
      })
      .catch((error) => {
        console.log(error.response.body);
        console.log(error.response.body.errors[0].message);
      });
    return {
      message: "Check your email",
    };
  },
  resetResetPassword: async (parent, { password, token }, context, info) => {
    // Find user in database by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
    });

    // If can't found user throw error
    if (!user) throw Error("NOT FOUND USER");

    // Check token expiry
    const isTokenExpiry = user.resetTokenExpiry < Date.now();

    //If token expiry throw error
    if (isTokenExpiry) throw Error("YOUR TOKEN EXPIRY");

    //Has new password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Update password user in database (and delete old password )
    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetTokenExpiry: null,
    });
    return {
      message: "RESET PASSWORD COMPLETE",
    };
  },
  signup: async (parent, args, context, info) => {
    //Trim and lower case email
    const email = args.email.trim().toLowerCase();
    const username = args.username.trim().toLowerCase();
    //Check if email already exist in database
    const currentUsers = await User.find({});
    const isEmailExist =
      currentUsers.findIndex((user) => user.email === email) > -1;
    const isUsernameExist =
      currentUsers.findIndex((user) => user.username === username) > -1;

    if (isEmailExist) {
      throw new Error("Email already exist.");
    } else if (isUsernameExist) {
      throw new Error("Username already exist.");
    } else {
    }

    //Validate password
    if (args.password.trim().length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    //Hash password
    const password = await bcrypt.hash(args.password, 10);

    return User.create({
      ...args,
      email,
      password,
    });
  },

  createProduct: async (parent, args, { userId }, info) => {
    if (!userId) throw new Error("Please login");
    // console.log(args.pd_options_attr[0])
    if (!args.name || !args.description || !args.price || !args.imageUrl) {
      throw new Error("Please provide all required fields.");
    }
    const product = await Product.create({
      ...args,
      user: userId,
    });

    //เซ็คว่าลูกค้ามีสินค้านี้อยู่หรือไหม
    const user = await User.findById(userId);
    if (!user.products) {
      user.products = [product];
    } else {
      user.products.push(product);
    }

    //เพิ่มจำนวนสินค้าของ user
    const qtyPd = await user.products.length;
    console.log(user.products.length);
    const updateInfo = {
      qtyProducts: !!qtyPd ? qtyPd : user.qtyProducts,
    };
    await User.findByIdAndUpdate(userId, updateInfo);

    //เช็ค cat ว่ามีอยู่หรือไม่
    const productCategoryID = await ProductCategory.find({});
    const cusProductCategoryID =
      productCategoryID.findIndex(
        (productCategory) => productCategory.id === args.productCategory
      ) > -1;
    if (cusProductCategoryID === false) throw new Error("NOT FOUND CATEGORY");

    // save data product to productCategory.products
    const productCategory = await ProductCategory.findById(
      args.productCategory
    );
    if (!productCategory.products) {
      productCategory.products = [product];
    } else {
      productCategory.products.push(product);
    }
    const qty_pro_cat = await productCategory.products.length;
    const update_qty_pro_cat = {
      quantity: !!qty_pro_cat ? qty_pro_cat : productCategory.quantity,
    };

    await ProductCategory.findByIdAndUpdate(
      args.productCategory,
      update_qty_pro_cat
    );

    //เช็ค attr ว่ามีอยู่หรือไม่
    args.pd_options_attr.map(async (items) => {
      console.log(items);
      const pd_options_attrID = await PD_options_attr.find({});
      const cusPD_options_attrID =
        pd_options_attrID.findIndex(
          (pd_options_attr) => pd_options_attr.id === items
        ) > -1;
      if (cusPD_options_attrID === false) throw new Error("NOT FOUND Attr");
      const pd_options_attr = await PD_options_attr.findById(items);
      if (!pd_options_attr.products) {
        pd_options_attr.products = [product];
      } else {
        pd_options_attr.products.push(product);
      }
      await pd_options_attr.save();
      //เพิ่มจำนวนสินค้าเข้าไปที่ att
      await PD_options_attr.findByIdAndUpdate(items, {
        quantity: pd_options_attr.products.length
      })
    });

    await productCategory.save();

    await user.save();

    return Product.findById(product.id).populate({
      path: "user",
      populate: {
        path: "products",
      },
    });
  },
  createProductCategory: async (parent, args, { userId }, info) => {
    if (!userId) throw new Error("Please login");

    if (!args.name || !args.description || !args.slug || !args.imageUrl) {
      throw new Error("Please provide all required fields.");
    }
    const productCategory = await ProductCategory.create({
      ...args,
      user: userId,
    });
    const user = await User.findById(userId);
    console.log(user.productCategories);

    if (!user.productCategories) {
      user.productCategories = [productCategory];
    } else {
      user.productCategories.push(productCategory);
    }

    await user.save();

    return ProductCategory.findById(productCategory.id).populate({
      path: "user",
      populate: {
        path: "productCategories",
      },
    });
  },
  createProductAttribute: async (parent, args, { userId }, info) => {
    if (!userId) throw new Error("Please login");

    if (!args.name || !args.description || !args.slug || !args.imageUrl) {
      throw new Error("Please provide all required fields.");
    }
    const productAttribute = await ProductAttribute.create({
      ...args,
      user: userId,
    });
    const user = await User.findById(userId);
    console.log(user.productAttributes);

    if (!user.productAttributes) {
      user.productAttributes = [productAttribute];
    } else {
      user.productAttributes.push(productAttribute);
    }

    await user.save();

    return ProductAttribute.findById(productAttribute.id).populate({
      path: "user",
      populate: {
        path: "productAttributes",
      },
    });
  },
  createOptionsAttr: async (parent, args, { userId }, info) => {
    if (!userId) throw new Error("Please login");
    const attrId = "5f3e5511639b9e19205c04e4";
    if (!args.name || !args.slug || !args.opVal) {
      throw new Error("Please provide all required fields.");
    }
    const { name, slug, opVal } = args;
    const parentAttrName = await ProductAttribute.findById(attrId);
    const productAttribute = await PD_options_attr.create({
      name,
      slug,
      opVal,
      parentName: parentAttrName.name,
      parent: attrId,
    });
    const ProductAttributeID = await ProductAttribute.findById(attrId);

    if (!ProductAttributeID) {
      ProductAttributeID = [productAttribute];
    } else {
      ProductAttributeID.pd_options_attrs.push(productAttribute);
    }

    await ProductAttributeID.save();
    console.log(productAttribute);
    return PD_options_attr.findById(productAttribute.id).populate({
      path: "parent",
      populate: {
        path: "pd_options_attrs",
      },
    });
  },
  updateProduct: async (parent, args, { userId }, info) => {
    const {
      id,
      name,
      description,
      price,
      imageUrl,
      image_gallery,
      address,
      reason_sell,
      shipping,
      pd_life,
      integrity,
      productCategory,
      pd_options_attr,
    } = args;

    //Check if user logged in
    if (!userId) throw new Error("Please login");

    //Find product in database
    const product = await Product.findById(id);
    //Check if user is the owner of the product
    if (userId !== product.user.toString()) {
      throw new Error("You are not authorized");
    }
    //Check if change catPro need to delete from old catPro
    console.log("new = " + productCategory);
    console.log("old = " + product.productCategory);
    if (product.productCategory != productCategory) {
      console.log("change id");
      const DataCat = await ProductCategory.findById(product.productCategory);
      try {
        //Del from old cat
        // const delProOldCat = await DataCat.products.findByIdAndRemove(id)
        const DataCatPro = await DataCat.products.filter(
          (productId) => productId.toString() !== id.toString()
        );

        console.log("filter" + DataCatPro);
        console.log(id);
        const updateIdProCat = {
          products: !!DataCatPro ? DataCatPro : DataCat.products,
        };
        await ProductCategory.findByIdAndUpdate(
          product.productCategory,
          updateIdProCat
        );
        console.log("Deleted");

        //add product to new cat
        const findCategory = await ProductCategory.findById(productCategory);
        //เช็คว่ามี id รึยีง
        const findProNewCat = findCategory.products.findIndex(
          (productID) => productID === id
        );
        console.log("finpronewcat = " + findProNewCat);
        if (findProNewCat > -1) {
          ("");
        } else {
          findCategory.products.push(product);
        }
        await findCategory.save();
        console.log("Added");
      } catch (error) {}

      console.log("complete");
    }

    // Form updated information
    const updateInfo = {
      name: !!name ? name : product.name,
      description: !!description ? description : product.description,
      price: !!price ? price : product.price,
      address: !!address ? address : product.address,
      imageUrl: !!imageUrl ? imageUrl : product.imageUrl,
      image_gallery: !!image_gallery ? image_gallery : product.image_gallery,
      reason_sell: !!reason_sell ? reason_sell : product.reason_sell,
      shipping: !!shipping ? shipping : product.shipping,
      pd_life: !!pd_life ? pd_life : product.pd_life,
      integrity: !!integrity ? integrity : product.integrity,
      productCategory: !!productCategory
        ? productCategory
        : product.productCategory,
      pd_options_attr: !!pd_options_attr
        ? pd_options_attr
        : product.pd_options_attr,
    };

    //Update product in database
    await Product.findByIdAndUpdate(id, updateInfo);

    //Find the update product
    const updatedProduct = await Product.findById(id).populate({
      path: "user",
    });

    return updatedProduct;
  },
  deleteProduct: async (parent, args, { userId }, info) => {
    const { id } = args;
    if (!userId) throw new Error("Please login");

    const product = await Product.findById(id);

    const user = await User.findById(userId);

    if (product.user.toString() !== userId) {
      throw new Error("Not authorized.");
    }

    const deletedProduct = await Product.findByIdAndRemove(id);
    const updatedUserProduct = user.products.filter(
      (productId) => productId.toString() !== deletedProduct.id.toString()
    );

    await User.findByIdAndUpdate(userId, {
      products: updatedUserProduct,
      qtyProducts: updatedUserProduct.length,
    });

    //Del produxt from cat
    const cat_pro = await ProductCategory.findById(product.productCategory);
    const updataedCatPro = cat_pro.products.filter(
      (productId) => productId.toString() !== id.toString()
    );
    await ProductCategory.findByIdAndUpdate(product.productCategory, {
      products: updataedCatPro,
      quantity: updataedCatPro.length,
    });

    return deletedProduct;
  },
  addToCart: async (parent, args, { userId }, info) => {
    //this id is  productId
    const { id } = args;
    if (!userId) throw new Error("Please login");

    try {
      //หา user ที่ต้อง cart

      //เช็คว่ามีการเพิ่มสินค้าหรือยัง
      const user = await User.findById(userId).populate({
        path: "carts",
        populate: {
          path: "product",
        },
      });

      const findCartItemIndex = user.carts.findIndex(
        (cartItem) => cartItem.populate.id === id
      );

      if (findCartItemIndex > -1) {
        // A. The new addToCart item is already in cart
        // A.1 Find the cart from database
        user.carts[findCartItemIndex].quantity += 1;

        await CartItem.findByIdAndUpdate(user.carts[findCartItemIndex].id, {
          quantity: user.carts[findCartItemIndex].quantity,
        });
        // A.2 Update quantity od that cartItem ---> increase
        const updatedCartItem = await CartItem.findById(
          user.carts[findCartItemIndex].id
        )
          .populate({
            path: "product",
          })
          .populate({
            path: "user",
          });

        return updatedCartItem;
      } else {
        // B. The new addToCart item is not in cart yet
        // B.1 Create new cartItem
        const cartItem = await CartItem.create({
          product: id,
          quantity: 1,
          user: userId,
        });
        // find new cartItem
        const newCartItem = await CartItem.findById(cartItem.id)
          .populate({
            path: "product",
          })
          .populate({
            path: "user",
          });
        // B.2 Update user.carts
        await User.findByIdAndUpdate(userId, {
          carts: [...user.carts, newCartItem],
        });

        return newCartItem;
      }
    } catch (error) {
      console.log(error);
    }
  },
  deleteCart: async (parent, args, { userId }, info) => {
    const { id } = args;
    if (!userId) throw new Error("Please login");

    // Find cart from give id
    const cart = await CartItem.findById(id);

    // check logged

    // Find user id from request ---> Find user

    const user = await User.findById(userId);

    // Check owner ship of the cart
    if (cart.user.toString() !== userId) {
      throw new Error("Not authorized.");
    }

    // Delete cart
    const deletedCart = await CartItem.findByIdAndRemove(id);

    const updatedUserCart = user.carts.filter(
      (cartId) => cartId.toString() !== deletedCart.id.toString()
    );
    await User.findByIdAndUpdate(userId, {
      carts: updatedUserCart,
    });

    return deletedCart;
  },
};

export default Mutation;
