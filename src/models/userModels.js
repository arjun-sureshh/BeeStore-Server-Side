const mongoose = require("mongoose");

const userSchemaStructure = new mongoose.Schema(
  {
    userName: {
      type: String,
      require: true,
    },
    userEmail: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    userPassword: {
      type: String,
      required: true,
      unique: true,
    },
    userGender: {
      type: String,
      required: false,
    },
    userMobileNumber: {
      type: Number,
      required: true,
      validate: {
        validator: function (number) {
          const phoneNumber = /^\d{10}$/;
          return phoneNumber.test(number);
        },
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number.",
      },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userSchemaStructure);

module.exports = User;
