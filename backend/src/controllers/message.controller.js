import Message from "../models/Message.js";
import User from "../models/User.js";

import cloudinary from "../lib/cloudinary.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const filtereddUsers = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");

    res.status(200).json(filtereddUsers);
  } catch (error) {
    console.error("Error getting contacts: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { receiverId: userToChatId, senderId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error getting messages: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "No message or image provided" });
    }

    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    res.status(200).json(newMessage);

    // todo: send message in real time if user is online - socket.io
  } catch (error) {
    console.error("Error sending message: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged in user is the sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds },
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(chatPartners);
  } catch {
    console.error("Error getting chat Partners: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
