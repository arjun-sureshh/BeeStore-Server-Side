const Booking = require("../models/bookingModules");
const mongoose = require("mongoose");
const MYcart = require("../models/cartModels");
const Gallery = require("../models/galleryModels");
const Color = require("../models/colorModules");
const Product = require("../models/productModels");
const Seller = require("../models/sellerModels");
const ProductVariant = require("../models/productVariantModels");
const Address = require("../models/addressModels");
const User = require("../models/userModels");
const ProductStock = require("../models/productStockModels");

// Orders get

const getBooking = async (req, res) => {
  const { id, userId } = req.body; // userId from request body
  console.log(id);
  console.log(userId);

  // Validate booking ID
  if (!id || id === "undefined") {
    return res.status(400).json({
      success: false,
      message: "Booking ID is missing or invalid",
    });
  }

  try {
    const bookingDetails = await Booking.findById(id);

    if (!bookingDetails) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Optional: Verify if the booking belongs to the user
    if (userId && bookingDetails.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: bookingDetails,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({
      success: false,
      message: "Error in fetching booking details",
      error: error.message,
    });
  }
};

// Order post

const createBooking = async (req, res) => {
  const { amount, userId } = req.body;

  if (!amount || !userId) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const newBooking = new Booking({
      amount,
      userId,
    });

    await newBooking.save();
    res.status(201).json({ message: "Booking List added succeccfully" });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// confrim order
const confirmOrder = async (req, res) => {
  const { bookingID, userId, addressId } = req.body;

  // Validate ObjectIDs
  if (
    !mongoose.Types.ObjectId.isValid(bookingID) ||
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(addressId)
  ) {
    return res
      .status(400)
      .json({ error: "Invalid Booking ID, User ID, or Address ID" });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Find and update booking with addressId and status 1 (confirmed)
      const updateBooking = await Booking.findOneAndUpdate(
        { _id: bookingID, userId },
        { addressId, status: 1 },
        { new: true, session },
      );

      if (!updateBooking) {
        throw new Error("Booking not found or not authorized");
      }

      // Fetch all cart items for the booking
      const cartItems = await MYcart.find({ bookingID }).session(session);
      if (!cartItems.length) {
        throw new Error("No cart items found for this booking");
      }

      // Validate and reduce stock for each cart item
      for (const cartItem of cartItems) {
        const { productvariantId, cartQty } = cartItem;

        // Validate stock availability
        const stock = await ProductStock.findOne({ productvariantId }).session(
          session,
        );
        if (!stock || stock.stockqty < cartQty) {
          throw new Error(
            `Insufficient stock for product variant ${productvariantId}`,
          );
        }

        // Reduce stock quantity
        await ProductStock.updateOne(
          { productvariantId },
          { $inc: { stockqty: -cartQty } },
          { session },
        );

        // Optionally update cartStatus to confirmed (e.g., 1)
        await MYcart.updateOne(
          { _id: cartItem._id },
          { cartStatus: 1 },
          { session },
        );
      }

      // Return response
      res.status(200).json({
        success: true,
        message: "Order confirmed successfully",
        booking: updateBooking,
        cart: cartItems,
      });
    });
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(error.message.includes("Insufficient stock") ? 400 : 500).json({
      success: false,
      error: "Error confirming order",
      details: error.message,
    });
  } finally {
    session.endSession();
  }
};

// order details

const orderDetails = async (req, res) => {
  const { userId } = req.body;

  console.log("Fetching order details for userId:", userId); // Debug

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Valid User ID is required" });
  }

  try {
    const bookings = await Booking.find({ userId })
      .populate({
        path: "addressId",
        select: "mobileNumber fullName address city pincode addressType",
      })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No completed bookings found" });
    }

    const bookingIds = bookings.map((booking) => booking._id);
    const carts = await MYcart.find({
      bookingID: { $in: bookingIds },
    })
      .populate({
        path: "productvariantId",
        select:
          "productTitle sellingPrice mrp productDiscription colorId productId",
        populate: {
          path: "colorId",
          select: "color",
          model: Color,
        },
      })
      .lean();

    const variantIds = carts
      .map((cart) => cart.productvariantId?._id)
      .filter((id) => id);
    const images = await Gallery.find({ varientId: { $in: variantIds } })
      .select("varientId photos")
      .lean();

    const imageMap = images.reduce((map, image) => {
      // Handle photos as array or scalar
      const photoId = Array.isArray(image.photos)
        ? image.photos[0]
        : image.photos;
      map[image.varientId.toString()] = photoId
        ? `/api/gallery/image/${photoId}`
        : null;
      return map;
    }, {});

    const orderDetails = bookings.map((booking) => {
      const bookingCarts = carts.filter(
        (cart) => cart.bookingID.toString() === booking._id.toString(),
      );
      return {
        ...booking,
        cartItems: bookingCarts.map((cart) => ({
          productTitle:
            cart.productvariantId?.productTitle || "Unknown Product",
          sellingPrice: cart.productvariantId?.sellingPrice || 0,
          mrp: cart.productvariantId?.mrp || 0,
          color: cart.productvariantId?.colorId?.color || "N/A",
          description:
            cart.productvariantId?.productDiscription || "No description",
          quantity: cart.cartQty,
          cartStatus: cart.cartStatus,
          productId: cart.productvariantId?.productId,
          image: imageMap[cart.productvariantId?._id?.toString()] || "/default-image.jpg",
          _id: cart._id,
        })),
      };
    });

    console.log("Order details fetched:", orderDetails.length, "Items:", JSON.stringify(orderDetails, null, 2)); // Debug

    return res.status(200).json({
      message: "Order details fetched successfully",
      data: orderDetails,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

//c ancel the cart item

const cancel_cart_item = async (req, res) => {
  try {
    const { bookingId, cartId } = req.body;

    // Validate input
    if (!bookingId || !cartId) {
      return res
        .status(400)
        .json({ message: "bookingId and cartId are required" });
    }

    // Check if cart item can be cancelled (status is 1 or 2.5)
    const cartItem = await MYcart.findById(cartId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    if (![1].includes(cartItem.cartStatus)) {
      return res
        .status(400)
        .json({
          message: "Cannot cancel item; it is already shipped or received",
        });
    }

    // Update cart item status to -1 (Cancelled)
    const updatedCart = await MYcart.findByIdAndUpdate(
      cartId,
      { cartStatus: -1 },
      { new: true },
    );

    // Find all cart items for the booking
    const cartItems = await MYcart.find({ bookingID: bookingId });

    // Check if all cart items are cancelled
    const allCancelled = cartItems.every((item) => item.cartStatus === -1);

    if (allCancelled) {
      // Update booking status to -1
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { status: -1 },
        { new: true },
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
    }

    // Return success response
    res.status(200).json({
      message: "Cart item cancelled successfully",
      cart: updatedCart,
      bookingUpdated: allCancelled,
    });
  } catch (error) {
    console.error("Error cancelling cart item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// for order manqgement
const getOrderDetails = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  console.log("Fetching orders: page:", page, "limit:", limit); // Debug

  try {
    // Validate pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit",
      });
    }

    const bookings = await Booking.find({ status: { $gte: 1 } })
      .populate("userId", "userName userEmail")
      .populate(
        "addressId",
        "mobileNumber fullName address city pincode addressType",
      )
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found with status >= 1"); // Debug
      return res
        .status(404)
        .json({ success: false, message: "No confirmed orders found" });
    }

    const orderDetails = await Promise.all(
      bookings.map(async (booking) => {
        const carts = await MYcart.find({
          bookingID: booking._id,
          cartStatus: { $ne: -1 },
        })
          .populate({
            path: "productvariantId",
            select:
              "productTitle sellingPrice mrp colorId productDiscription productId",
            populate: [
              { path: "colorId", select: "color", model: Color },
              {
                path: "productId",
                select: "sellerId",
                model: Product,
                populate: {
                  path: "sellerId",
                  select: "sellerName",
                  model: Seller,
                },
              },
            ],
          })
          .lean();

        console.log(`Booking ${booking._id} has ${carts.length} cart items`); // Debug

        const enrichedCarts = await Promise.all(
          carts.map(async (cart) => {
            const variant = cart.productvariantId;
            if (!variant?._id) {
              console.log(`No variant for cart ${cart._id}`); // Debug
              return {
                ...cart,
                variantDetails: variant || {},
                image: "/default-image.jpg",
              };
            }

            const galleryImage = await Gallery.findOne(
              { varientId: variant._id },
              "photos",
            )
              .sort({ createdAt: -1 })
              .lean();

            const photoId = Array.isArray(galleryImage?.photos)
              ? galleryImage.photos[0]
              : galleryImage?.photos;

            console.log(`Cart ${cart._id} image:`, photoId); // Debug

            return {
              ...cart,
              variantDetails: variant,
              image: photoId
                ? `/api/gallery/image/${photoId}`
                : "/default-image.jpg",
            };
          }),
        );

        return {
          ...booking,
          cartItems: enrichedCarts,
        };
      }),
    );

    const total = await Booking.countDocuments({ status: { $gte: 1 } });
    const totalPages = Math.ceil(total / limitNum);

    console.log("Orders fetched:", orderDetails.length); // Debug

    res.status(200).json({
      success: true,
      data: orderDetails,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};
// serach api

const searchOrdersByProductTitle = async (req, res) => {
  const { productTitle, userId } = req.body;
  console.log(productTitle, userId);

  (page = 1), (limit = 10);
  if (!productTitle || !userId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Product title and user ID are required",
      });
  }

  try {
    // Find bookings for the user with status 1
    const bookings = await Booking.find({ userId, status: { $gte: 1 } })
      .populate({
        path: "addressId",
        select: "mobileNumber fullName address city pincode addressType",
      })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No confirmed orders found for this user",
        });
    }

    const bookingIds = bookings.map((booking) => booking._id);

    // Find cart items with matching product title
    const carts = await MYcart.find({
      bookingID: { $in: bookingIds },
    })
      .populate({
        path: "productvariantId",
        match: { productTitle: { $regex: productTitle, $options: "i" } }, // Case-insensitive search
        select:
          "productTitle sellingPrice mrp productDiscription colorId productId",
        populate: {
          path: "colorId",
          select: "color",
          model: Color,
        },
      })
      .lean();

    // Filter out carts where productvariantId didn't match
    const validCarts = carts.filter((cart) => cart.productvariantId);

    if (validCarts.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No orders found for the given product title",
        });
    }

    // Fetch images for variant IDs
    const variantIds = validCarts.map((cart) => cart.productvariantId._id);
    const images = await Gallery.find({ varientId: { $in: variantIds } })
      .select("varientId photos")
      .lean();

    const imageMap = images.reduce((map, image) => {
      map[image.varientId.toString()] = image.photos;
      return map;
    }, {});

    // Group carts by booking and enrich data
    const orderDetails = bookings
      .map((booking) => {
        const bookingCarts = validCarts.filter(
          (cart) => cart.bookingID.toString() === booking._id.toString(),
        );
        if (bookingCarts.length === 0) return null;
        return {
          ...booking,
          cartItems: bookingCarts.map((cart) => ({
            productTitle:
              cart.productvariantId?.productTitle || "Unknown Product",
            sellingPrice: cart.productvariantId?.sellingPrice || 0,
            mrp: cart.productvariantId?.mrp || 0,
            color: cart.productvariantId?.colorId?.color || "N/A",
            description:
              cart.productvariantId?.productDiscription || "No description",
            quantity: cart.cartQty,
            cartStatus: cart.cartStatus,
            productId: cart.productvariantId?.productId,
            image: imageMap[cart.productvariantId?._id?.toString()] || null,
            _id: cart._id,
          })),
        };
      })
      .filter((booking) => booking !== null);

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orderDetails.slice(startIndex, endIndex);

    const total = orderDetails.length;
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: paginatedOrders,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error searching orders:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        details: error.message,
      });
  }
};

// update the statsus

const update_cart_booking_status = async (req, res) => {
  try {
    const { bookingId, cartId, status } = req.body;

    // Validate input
    if (!bookingId || !cartId || !status) {
      return res
        .status(400)
        .json({ message: "bookingId, cartId, and status are required" });
    }

    // Validate status (1, 2.5, 3, or 4)
    const validStatuses = [1, 2.5, 3, 4];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status value. Must be 1, 2.5, 3, or 4" });
    }

    // Update cart item status
    const updatedCart = await MYcart.findByIdAndUpdate(
      cartId,
      { cartStatus: status },
      { new: true },
    );

    if (!updatedCart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Find all cart items for the booking
    const cartItems = await MYcart.find({ bookingID: bookingId });

    // Check if all cart items have the same status
    const allSameStatus = cartItems.every((item) => item.cartStatus === status);

    if (allSameStatus) {
      // Update booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { status },
        { new: true },
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
    }

    // Return success response
    res.status(200).json({
      message: "Status updated successfully",
      cart: updatedCart,
      bookingUpdated: allSameStatus,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch all delivered orders (status: 4)
const getDeliveredOrders = async (req, res) => {
  try {
    // Fetch delivered orders
    const bookings = await Booking.find({ status: 4 })
      .populate({
        path: "userId",
        select: "name email", // Adjust fields based on your User schema
        model: User,
      })
      .populate({
        path: "addressId",
        select: "mobileNumber fullName address city pincode addressType",
        model: Address,
      })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No delivered orders found" });
    }

    // Get booking IDs
    const bookingIds = bookings.map((booking) => booking._id);

    // Fetch cart items for these bookings
    const carts = await MYcart.find({ bookingID: { $in: bookingIds } })
      .populate({
        path: "productvariantId",
        select:
          "productTitle sellingPrice mrp productDiscription colorId productId",
        populate: [
          {
            path: "colorId",
            select: "color",
            model: Color,
          },
          {
            path: "productId",
            select: "sellerId",
            model: Product,
            populate: {
              path: "sellerId",
              select: "sellerName",
              model: Seller,
            },
          },
        ],
      })
      .lean();

    // Fetch images for product variants
    const variantIds = carts
      .map((cart) => cart.productvariantId?._id)
      .filter((id) => id);
    const images = await Gallery.find({ varientId: { $in: variantIds } })
      .select("varientId photos")
      .lean();

    // Create image map
    const imageMap = images.reduce((map, image) => {
      map[image.varientId.toString()] = `/Uploads/${image.photos}`;
      return map;
    }, {});

    // Combine data
    const orderDetails = bookings.map((booking) => {
      const bookingCarts = carts.filter(
        (cart) => cart.bookingID.toString() === booking._id.toString(),
      );
      return {
        _id: booking._id,
        amount: booking.amount,
        user: booking.userId || { name: "Unknown", email: "N/A" },
        address: booking.addressId || {
          mobileNumber: "N/A",
          fullName: "N/A",
          address: "N/A",
          city: "N/A",
          pincode: "N/A",
          addressType: "N/A",
        },
        createdAt: booking.createdAt,
        status: booking.status,
        cartItems: bookingCarts.map((cart) => ({
          productTitle:
            cart.productvariantId?.productTitle || "Unknown Product",
          sellingPrice: cart.productvariantId?.sellingPrice || 0,
          mrp: cart.productvariantId?.mrp || 0,
          color: cart.productvariantId?.colorId?.color || "N/A",
          description:
            cart.productvariantId?.productDiscription || "No description",
          quantity: cart.cartQty,
          cartStatus: cart.cartStatus,
          productId: cart.productvariantId?.productId?._id || "N/A",
          sellerName:
            cart.productvariantId?.productId?.sellerId?.sellerName ||
            "Unknown Seller",
          image: imageMap[cart.productvariantId?._id?.toString()] || null,
          cartId: cart._id,
        })),
      };
    });

    res.status(200).json({
      success: true,
      message: "Delivered orders fetched successfully",
      data: orderDetails,
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Calculate total income from delivered orders
const getTotalIncome = async (req, res) => {
  try {
    const orders = await Booking.find({ status: 4 }).select("amount").lean();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No delivered orders found" });
    }

    const total = orders.reduce(
      (sum, order) => sum + parseFloat(order.amount || "0"),
      0,
    );

    res.status(200).json({
      success: true,
      message: "Total income calculated successfully",
      data: total,
    });
  } catch (error) {
    console.error("Error calculating total income:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Fetch top 5 ordered products with seller names and images

const getTopOrderedProducts = async (req, res) => {
  try {
    console.log("Fetching top ordered products"); // Debug

    const cartAggregation = await MYcart.aggregate([
      {
        $match: { cartStatus: { $in: [1, 2, 3, 4] } },
      },
      {
        $group: {
          _id: "$productvariantId",
          orderCount: { $sum: "$cartQty" },
        },
      },
      {
        $sort: { orderCount: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    console.log("Cart aggregation result:", cartAggregation); // Debug

    if (!cartAggregation || cartAggregation.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No ordered products found",
      });
    }

    const productDetails = await Promise.all(
      cartAggregation.map(async (item) => {
        const variant = await ProductVariant.findById(item._id)
          .select("productId productTitle")
          .lean();
        if (!variant) {
          console.log(`No variant found for ID ${item._id}`); // Debug
          return null;
        }

        const product = await Product.findById(variant.productId)
          .select("sellerId")
          .lean();
        if (!product) {
          console.log(`No product found for ID ${variant.productId}`); // Debug
          return null;
        }

        const seller = await Seller.findById(product.sellerId)
          .select("sellerName")
          .lean();
        if (!seller) {
          console.log(`No seller found for ID ${product.sellerId}`); // Debug
          return null;
        }

        const image = await Gallery.findOne({ varientId: item._id })
          .select("photos")
          .lean();
        const photoId = Array.isArray(image?.photos)
          ? image.photos[0]
          : image?.photos;

        console.log(`Variant ${item._id} image:`, photoId); // Debug

        return {
          productTitle: variant.productTitle || "Unknown Product",
          sellerName: seller.sellerName || "Unknown Seller",
          orderCount: item.orderCount,
          image: photoId ? `/api/gallery/image/${photoId}` : "/default-image.jpg",
        };
      }),
    );

    const filteredDetails = productDetails.filter((detail) => detail !== null);

    if (filteredDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No product details found",
      });
    }

    console.log("Top products fetched:", filteredDetails.length); // Debug

    res.status(200).json({
      success: true,
      message: "Top ordered products fetched successfully",
      data: filteredDetails,
    });
  } catch (error) {
    console.error("Error fetching top ordered products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getBooking,
  confirmOrder,
  orderDetails,
  getOrderDetails,
  searchOrdersByProductTitle,
  update_cart_booking_status,
  cancel_cart_item,
  getDeliveredOrders,
  getTotalIncome,
  getTopOrderedProducts,
};
