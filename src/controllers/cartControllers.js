const { default: mongoose } = require("mongoose");
const Booking = require("../models/bookingModules");
const MYcart = require("../models/cartModels");
const ProductVariant = require("../models/productVariantModels");
const Product = require("../models/productModels");
const Gallery = require("../models/galleryModels");
const ProductStock = require("../models/productStockModels");

// get Cart

const getCart = async (req, res) => {
  const { userId } = req.params;

  console.log("Fetching cart for userId:", userId); // Debug

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const convertedUserId = new mongoose.Types.ObjectId(String(userId));

    const cartDetails = await MYcart.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "bookingID",
          foreignField: "_id",
          as: "bookingDetails",
        },
      },
      {
        $unwind: { path: "$bookingDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $match: {
          "bookingDetails.userId": convertedUserId,
          "bookingDetails.status": 0,
        },
      },
      {
        $lookup: {
          from: "productvariantdetails",
          localField: "productvariantId",
          foreignField: "_id",
          as: "productVariantDetails",
        },
      },
      {
        $unwind: {
          path: "$productVariantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productdetails",
          localField: "productVariantDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "productDetails.sellerId",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: { path: "$sellerDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "productimages",
          localField: "productVariantDetails._id",
          foreignField: "varientId",
          as: "galleryDetails",
          pipeline: [
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
            {
              $project: {
                photos: {
                  $cond: {
                    if: { $isArray: "$photos" },
                    then: { $arrayElemAt: ["$photos", 0] },
                    else: "$photos",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $unwind: { path: "$galleryDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "productSpecification",
          localField: "productVariantDetails._id",
          foreignField: "productVariantId",
          as: "productSpecificationDetails",
        },
      },
      {
        $lookup: {
          from: "productstocks",
          localField: "productvariantId",
          foreignField: "productvariantId",
          as: "stockDetails",
        },
      },
      { $unwind: { path: "$stockDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          bookingID: { $first: "$bookingID" },
          productvariantId: { $first: "$productvariantId" },
          cartQty: { $first: "$cartQty" },
          mrp: { $first: "$productVariantDetails.mrp" },
          sellingPrice: { $first: "$productVariantDetails.sellingPrice" },
          sellerName: { $first: "$sellerDetails.sellerDisplayName" },
          image: {
            $first: {
              $cond: {
                if: { $ne: ["$galleryDetails.photos", null] },
                then: { $concat: ["/api/gallery/image/", { $toString: "$galleryDetails.photos" }] },
                else: "/default-image.jpg",
              },
            },
          },
          specifications: { $first: "$productSpecificationDetails" },
          bookingAmount: { $first: "$bookingDetails.amount" },
          productTitle: { $first: "$productVariantDetails.productTitle" },
          productId: { $first: "$productDetails._id" },
          minimumorder: { $first: "$productVariantDetails.minimumOrderQty" },
          stockQty: { $first: "$stockDetails.stockqty" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      {
        $project: {
          cart_Id: "$_id",
          productvariantId: 1,
          cartQty: 1,
          bookingID: 1,
          mrp: 1,
          sellingPrice: 1,
          sellerName: 1,
          image: 1,
          specification: "$specifications.specification",
          bookingAmount: 1,
          productTitle: 1,
          productId: 1,
          minimumOrder: 1,
          stockQty: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 0,
        },
      },
    ]);

    console.log("Cart items fetched:", cartDetails.length, "Items:", JSON.stringify(cartDetails, null, 2)); // Debug

    if (!cartDetails.length === 0 || cartDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No cart items found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart details retrieved successfully",
      data: cartDetails,
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching cart details",
      error: error.message,
    });
  }
};

// post Cart

const createCart = async (req, res) => {
  const { cartQty, variantId, userId } = req.body;

  try {
    // Validate required fields
    if (!cartQty || !variantId || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: cartQty, variantId, and userId are required",
      });
    }

    // Convert variantId to ObjectId (scoped within try block)
    const productvariantId = new mongoose.Types.ObjectId(String(variantId));

    // Check if a booking exists for the user with status 0
    let booking = await Booking.findOne({ userId, status: 0 });
    if (!booking) {
      // Create new booking if none exists
      const newBooking = new Booking({ userId, status: 0 });
      booking = await newBooking.save();
    }

    // Check if the product variant already exists in the cart
    const existingCart = await MYcart.findOne({
      productvariantId,
      bookingID: booking._id,
      cartStatus: 0,
    });
    if (existingCart) {
      return res.status(400).json({
        success: false,
        message: "This product variant is already in your cart",
      });
    }

    // Create new cart item
    const newCart = new MYcart({
      cartQty,
      productvariantId,
      bookingID: booking._id,
    });

    // Save to database
    const savedCart = await newCart.save();
    return res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
      data: savedCart,
    });
  } catch (error) {
    console.error("Error in createCart:", error);

    // Handle specific errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format for variantId or userId",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle duplicate key errors (if applicable)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product already exists in cart",
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Server error while adding to cart",
    });
  }
};

// get product for seller

const getSellerDashboardStats = async (req, res) => {
  const { sellerId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    // Aggregate for Units Sold and Sales (cartStatus: 4) with details
    const salesAggregation = await MYcart.aggregate([
      { $match: { cartStatus: 4 } },
      {
        $lookup: {
          from: ProductVariant.collection.name,
          localField: "productvariantId",
          foreignField: "_id",
          as: "productvariantId",
        },
      },
      {
        $unwind: {
          path: "$productvariantId",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "productvariantId.productId",
          foreignField: "_id",
          as: "productId",
        },
      },
      { $unwind: { path: "$productId", preserveNullAndEmptyArrays: false } },
      { $match: { "productId.sellerId": sellerObjectId } },
      {
        $lookup: {
          from: Gallery.collection.name,
          localField: "productvariantId._id",
          foreignField: "varientId",
          as: "gallery",
        },
      },
      {
        $group: {
          _id: null,
          unitsSold: { $sum: "$cartQty" },
          sales: {
            $sum: { $multiply: ["$cartQty", "$productvariantId.sellingPrice"] },
          },
          soldItems: {
            $push: {
              _id: "$_id",
              cartQty: "$cartQty",
              createdAt: "$createdAt",
              productvariantId: {
                _id: "$productvariantId._id",
                productTitle: "$productvariantId.productTitle",
                sellingPrice: "$productvariantId.sellingPrice",
                mrp: "$productvariantId.mrp",
              },
              gallery: {
                $map: {
                  input: "$gallery",
                  as: "g",
                  in: { photos: "$$g.photos" },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          unitsSold: { $ifNull: ["$unitsSold", 0] },
          sales: { $ifNull: ["$sales", 0] },
          soldItems: 1,
        },
      },
    ]);

    // Aggregate for New Orders (cartStatus: 0) with details
    const newOrdersAggregation = await MYcart.aggregate([
      { $match: { cartStatus: 1 } },
      {
        $lookup: {
          from: ProductVariant.collection.name,
          localField: "productvariantId",
          foreignField: "_id",
          as: "productvariantId",
        },
      },
      {
        $unwind: {
          path: "$productvariantId",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "productvariantId.productId",
          foreignField: "_id",
          as: "productId",
        },
      },
      { $unwind: { path: "$productId", preserveNullAndEmptyArrays: false } },
      { $match: { "productId.sellerId": sellerObjectId } },
      {
        $lookup: {
          from: Gallery.collection.name,
          localField: "productvariantId._id",
          foreignField: "varientId",
          as: "gallery",
        },
      },
      {
        $project: {
          _id: 1,
          cartQty: 1,
          createdAt: 1,
          productvariantId: {
            _id: "$productvariantId._id",
            productTitle: "$productvariantId.productTitle",
            sellingPrice: "$productvariantId.sellingPrice",
            mrp: "$productvariantId.mrp",
          },
          gallery: {
            $map: { input: "$gallery", as: "g", in: { photos: "$$g.photos" } },
          },
        },
      },
    ]);

    // Aggregate for Active Listings (ListingStatus: 1) with details
    const activeListingsAggregation = await Product.aggregate([
      { $match: { sellerId: sellerObjectId, qcStatus: 1 } },
      {
        $lookup: {
          from: ProductVariant.collection.name,
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
      { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: Gallery.collection.name,
          localField: "variants._id",
          foreignField: "varientId",
          as: "gallery",
        },
      },
      {
        $group: {
          _id: "$_id",
          productId: { $first: "$_id" },
          variants: {
            $push: {
              _id: "$variants._id",
              productTitle: "$variants.productTitle",
              sellingPrice: "$variants.sellingPrice",
              mrp: "$variants.mrp",
              gallery: {
                $map: {
                  input: "$gallery",
                  as: "g",
                  in: { photos: "$$g.photos" },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          productId: 1,
          variants: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: { $ne: ["$$variant._id", null] }, // Exclude empty variants
            },
          },
        },
      },
    ]);

    // Combine results
    const stats = {
      unitsSold: salesAggregation[0]?.unitsSold || 0,
      sales: salesAggregation[0]?.sales || 0,
      newOrders: newOrdersAggregation.length,
      activeListings: activeListingsAggregation.length,
      soldItems: salesAggregation[0]?.soldItems || [],
      newOrderDetails: newOrdersAggregation,
      activeListingDetails: activeListingsAggregation,
    };

    return res.status(200).json({ status: 200, data: stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      data: { message: "Error fetching dashboard stats: " + error.message },
    });
  }
};

// buy now

const BuyNow = async (req, res) => {
  const { cartQty, variantId, userId, amount } = req.body;

  try {
    // Validate input
    if (!cartQty || !variantId || !userId || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: cartQty, variantId, userId, or amount",
      });
    }

    const productvariantId = new mongoose.Types.ObjectId(String(variantId));

    // Create a new booking with status 1 (pending)
    const newBooking = new Booking({ userId, status: 1, amount });
    const booking = await newBooking.save();

    // Create a new cart entry with bookingID
    const newCart = new MYcart({
      cartQty,
      productvariantId,
      bookingID: booking._id,
    });

    const savedCart = await newCart.save();

    // Set a timer to auto-delete if booking is not confirmed in 10 mins
    setTimeout(
      async () => {
        try {
          const existingBooking = await Booking.findById(booking._id);

          if (existingBooking && existingBooking.status === 1) {
            await MYcart.deleteMany({ bookingID: booking._id });
            await Booking.findByIdAndDelete(booking._id);
            console.log(`Auto-cancelled booking ${booking._id} due to timeout`);
          }
        } catch (err) {
          console.error("Error in auto-cancel process:", err);
        }
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return res.status(201).json({
      success: true,
      message: "Product successfully added to cart via Buy Now",
      data: {
        cart: savedCart,
        bookingId: booking._id,
      },
    });
  } catch (error) {
    console.error("Error in BuyNow:", error);

    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ObjectId format" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Product already exists in cart" });
    }

    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while processing Buy Now",
      });
  }
};

// delete the cart

const deleteCart = async (req, res) => {
  const { cartId, userId } = req.body;

  try {
    if (!cartId || !userId) {
      return res.status(400).json({
        success: false,
        message:
          `Missing required fields: ${!cartId ? "cartId" : ""} ${!userId ? "userId" : ""}`.trim(),
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(cartId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cartId or userId format",
      });
    }

    const cartItem = await MYcart.findOne({ _id: cartId });
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const booking = await Booking.findOne({ _id: cartItem.bookingID, userId });
    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Cart item does not belong to this user",
      });
    }

    await MYcart.deleteOne({ _id: cartId });

    // Check for remaining cart items
    const remainingCartItems = await MYcart.countDocuments({
      bookingID: cartItem.bookingID,
    });
    if (remainingCartItems === 0) {
      await Booking.deleteOne({ _id: cartItem.bookingID });
    }

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid cartId or userId format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while removing cart item",
    });
  }
};

// update caret qty

const removeQty = async (req, res) => {
  const { cart_id } = req.body;

  try {
    if (!cart_id) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    const findCart = await MYcart.findById(cart_id);
    if (!findCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Fetch product variant for minimum order quantity
    const productVariant = await ProductVariant.findById(
      findCart.productvariantId,
    );
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const minimumOrderQty = productVariant.minimumOrderQty || 1;

    // Check if quantity can be reduced
    if (findCart.cartQty <= minimumOrderQty) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce quantity below minimum order quantity of ${minimumOrderQty}`,
      });
    }

    // Update cart quantity
    const updateCart = await MYcart.findByIdAndUpdate(
      cart_id,
      { $inc: { cartQty: -1 } },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      data: updateCart,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const addQty = async (req, res) => {
  const { cart_id } = req.body;

  try {
    if (!cart_id) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    const findCart = await MYcart.findById(cart_id);
    if (!findCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Fetch product variant and stock
    const productVariant = await ProductVariant.findById(
      findCart.productvariantId,
    );
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const stock = await ProductStock.findOne({
      productvariantId: findCart.productvariantId,
    });
    const stockQty = stock?.stockqty || 0;
    const minimumOrderQty = productVariant.minimumOrderQty || 1;

    // Check if adding one exceeds stock
    if (findCart.cartQty >= stockQty) {
      return res.status(400).json({
        success: false,
        message: "Cannot add more items; stock limit reached",
      });
    }

    // Update cart quantity
    const updateCart = await MYcart.findByIdAndUpdate(
      cart_id,
      { $inc: { cartQty: 1 } },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      data: updateCart,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// place the order

const placeOrder = async (req, res) => {
  try {
    const { userId, cartIds, totalAmount } = req.body;
    console.log(userId, cartIds);

    if (!userId || !cartIds || !totalAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Just update cartStatus to 1 for the given cart IDs
    const updateResult = await MYcart.updateMany(
      { _id: { $in: cartIds }, cartStatus: 0 },
      {
        $set: {
          cartStatus: 1,
        },
      },
    );

    // Retrieve the updated cart documents to get the bookingID
    const updatedCarts = await MYcart.find({
      _id: { $in: cartIds },
      cartStatus: 1,
    }).select("bookingID");

    // Validate that all carts have the same bookingID
    const bookingIds = [
      ...new Set(updatedCarts.map((cart) => cart.bookingID?.toString())),
    ];
    if (bookingIds.length !== 1 || !bookingIds[0]) {
      return res.status(400).json({
        success: false,
        message: "Carts have inconsistent or missing bookingID(s)",
      });
    }

    const bookingId = bookingIds[0];

    // Update the booking amount
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { amount: totalAmount } },
      { new: true }, // Return the updated document
    );

    // Check if booking was found and updated
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or failed to update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart status updated successfully",
      updatedCount: updateResult.modifiedCount,
      bookingId: bookingId,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart status",
      error: error.message,
    });
  }
};

module.exports = {
  createCart,
  getCart,
  deleteCart,
  removeQty,
  addQty,
  placeOrder,
  BuyNow,
  getSellerDashboardStats,
};
