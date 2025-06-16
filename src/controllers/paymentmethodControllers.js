const PaymentMethod = require("../models/paymentMethodModels");

// get Payment Methods
const getPaymentMethod = async (req, res) => {
  try {
    const paymentMethodDetails = await PaymentMethod.find();
    res.status(200).json({ paymentMethodDetails });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in fetching Payment Methods ", error });
  }
};
// get payment method by id
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const findItem = await PaymentMethod.findById(id);
    if (findItem) {
      res
        .status(200)
        .json({ message: "got the Payment Method ", data: findItem });
    } else {
      res
        .status(404)
        .json({ message: "requested Payment Method is not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in fetching Payment Method ", error });
  }
};

// post PolicyMethods

const createPaymentMethod = async (req, res) => {
  const { paymentMethodName } = req.body;
  try {
    let existingPaymentMethod = await PaymentMethod.findOne({
      paymentMethodName,
    });

    if (existingPaymentMethod) {
      return res
        .status(400)
        .json({ message: "This Payment Method is already exists" });
    }

    const newPaymentMethod = new PaymentMethod({
      paymentMethodName,
    });
    await newPaymentMethod.save();
    res
      .status(201)
      .json({ message: "New Payment Method successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};
// delete Brand
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await PaymentMethod.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Payment Method not found" });
    } else {
      res.json({ message: "Payment Method deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Payment Method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  update Brand by id

const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethodName } = req.body;
    const findItem = await PaymentMethod.findById(id);

    let existingPaymentMethod = await PaymentMethod.findOne({
      paymentMethodName: {
        $regex: new RegExp("^" + paymentMethodName + "$", "i"),
      },
    });

    if (existingPaymentMethod) {
      return res
        .status(400)
        .json({ message: "This payment Method is already exists" });
    }

    if (findItem) {
      const updateItem = await PaymentMethod.findByIdAndUpdate(
        id,
        { paymentMethodName },
        { new: true },
      );
      res.status(201).send({ message: "payment Method Changed", updateItem });
    } else {
      res.status(404).json({ message: "payment Method is not found " });
    }
  } catch (error) {
    console.error("Error updateing in payment Method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createPaymentMethod,
  getPaymentMethod,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
};
