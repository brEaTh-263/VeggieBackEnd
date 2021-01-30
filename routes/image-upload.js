const express = require("express");
const router = express.Router();
const upload = require("../services/image");
const auth = require("../middlewares/auth");
const { User } = require("../models/user");
const _ = require("lodash");

const singleUpload = upload.single("image");

router.post("/image-upload", auth, singleUpload, async (req, res, next) => {
  const token = req.header("x-auth-token");
  const { _id } = req.user;
  console.log(req.file);
  try {
    let user = await User.findById(_id);
    if (!user) {
      return res
        .status(404)
        .send({ Error: "User with given id was not found!" });
    }
    user.imageURL = req.file.location;
    console.log(user);
    await user.save();
    const details = {
      imageURL: user.imageURL,
    };
    return res.status(200).send({ details: details, token: token });
    // r/eturn res.json({ imageUrl: req.file.location });
  } catch (err) {
    console.log(err);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

module.exports = router;
