const ChatUs = require("../models/chatusModels");

// get color
const getChat = async (req, res) => {
  try {
    const chatDetails = await ChatUs.find();
    res.status(200).json({ chatDetails });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching chat details ", error });
  }
};

// post color

const createchat = async (req, res) => {
  const { cartId, userId } = req.body;
  try {
    const newChat = new Color({
      cartId,
      userId,
    });
    await newChat.save();
    res.status(201).json({ message: "New chat successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

module.exports = {
  createchat,
  getChat,
};
