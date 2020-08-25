import User from "../models/user"
import Product from '../models/product'
import CartItem from "../models/cartItem"
import ProductCategory from "../models/productCategory"
import ProductAttribute from '../models/productAttribute'
import PD_options_attr from '../models/pd_options_attr'


const Query = {
  user: (parent, args, {userId}, info) => {
    // Check if user logged in
    if (!userId) throw new Error("Please log in")
    // console.log(userId)

    return User.findById(userId)
      .populate({
        path: "products",
        options: {
          sort: {
            createdAt: 'desc'
          }
        },
        populate: {
          path: "user"
        }
      })
      .populate({
        path: "carts",
        populate: {
          path: "product"
        }
      })
  },

  users: (parent, args, context, info) => User.find({})
    .populate({
      path: "products",
      populate: {
        path: "user"
      }
    })
    .populate({
      path: "productCategories",
      populate: {
        path: "user"
      }
    })
    .populate({
      path: "carts",
      populate: {
        path: "product"
      }
    }),

  product: (parent, args, context, info) =>
    Product.findById(args.id).populate({
      path: "user",
      populate: {
        path: "products"
      }
    })
    .populate({
      path: "productCategory",
      populate: {
        path: "products"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "pd_options_attr",
      populate: {
        path: "products"
      }
    }).sort({
      createdAt: 'desc'
    }),

  products: (parent, args, context, info) =>
    Product.find()
    .populate({
      path: "user",
      populate: {
        path: "products"
      }
    }).sort({
      createdAt: 'desc'
    })

    .populate({
      path: "productCategory",
      populate: {
        path: "products"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "pd_options_attr",
      populate: {
        path: "products"
      }
    }).sort({
      createdAt: 'desc'
    }),

  productCategories: (parent, args, context, info) =>
    ProductCategory.find()
    .populate({
      path: "user",
      populate: {
        path: "productCategories"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "products",
      populate: {
        path: "productCategories"
      }
    }).sort({
      createdAt: 'desc'
    }),

  productAttributes: (parent, args, context, info) =>
    ProductAttribute.find()
    .populate({
      path: "user",
      populate: {
        path: "productAttributes"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "products",
      populate: {
        path: "productAttributes"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "pd_options_attrs",
      populate: {
        path: "productAttributes"
      }
    }).sort({
      createdAt: 'desc'
    }),
  pd_options_attrs: (parent, args, context, info) =>
    PD_options_attr.find()
    .populate({
      path: "parent",
      populate: {
        path: "pd_options_attrs"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "products",
      populate: {
        path: "pd_options_attrs"
      }
    }).sort({
      createdAt: 'desc'
    }),

  carts: (parent, args, context, info) =>
    CartItem.find()
    .populate({
      path: "user",
      populate: {
        path: "carts"
      }
    }).sort({
      createdAt: 'desc'
    })
    .populate({
      path: "product",
      populate: {
        path: "carts"
      }
    }).sort({
      createdAt: 'desc'
    }),
}

export default Query