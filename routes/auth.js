const express = require("express");
const mongoose = require("mongoose");
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const _ = require("lodash");
const fetch = require("node-fetch");
const { OAuth2Client, IdTokenClient } = require("google-auth-library");
const auth = require("../middlewares/auth");
const accountSid = "AC35241667cea434d2350688bba31a0896"; //twilio
const serviceSid = "VAcc4bb017a484ea7a9184262bcdb80985"; //twilio
const authToken = "a630c571f94f22b4d69b0c6397d5f611"; //twilio
const client = require("twilio")(accountSid, authToken); //twilio

const API_KEY = "2c0d814e03cbe9fef8918dcab95f4779-360a0b2c-efb4f165";
const DOMAIN = "sandbox5b2075e1b883406383f380da7dc7d380.mailgun.org";
const mailgun = require("mailgun-js")({ apiKey: API_KEY, domain: DOMAIN });

const router = express.Router();

// router.post("/signUp", async (req, res) => {
//   let { name, email, password } = req.body;
//   console.log(req.body);
//   console.log(name, email, password);

//   let user = await User.findOne({ email: email });
//   if (user) {
//     return res.status(400).send({ Error: "Please try another email" });
//   }
//   try {
//     user = new User({ name: name, email: email, password: password });

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//     user = await user.save();
//     const token = user.generateAuthToken();
//     const details = _.pick(user, ["name", "email", "phoneNumber", "location"]);
//     return res.status(200).send({ details, id: user._id, tokenId: token });
//   } catch (err) {
//     return res.status(505).send(err.message);
//   }
// });

router.post("/signup-phonenumber", async (req, res) => {
  let { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).send({ Error: "Something went wrong" });
  }
  try {
    client.verify
      .services(serviceSid)
      .verifications.create({
        to: `+91${phoneNumber}`,
        channel: "sms",
        // appHash: `${req.body.hash}`,
      })
      .then((data) => {
        console.log(data);
        const details = _.pick(data, ["status", "to", "valid"]);
        res.status(200).send({ details });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({ Error: "Something went wrong" });
      });
  } catch (error) {
    return res.status(505).send(err.message);
  }
});

router.post("/signUp-email", async (req, res) => {
  try {
    let { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).send("Details were not provided");
    }

    let user = await User.findOne({ email: email });
    if (!user) {
      let details = await client.verify
        .services(serviceSid)
        .verifications.create({
          to: email,
          channel: "email",
        });
      details = _.pick(details, ["status", "to", "valid"]);
      return res.status(200).send({ details });
    }
    return res.status(400).send({ Error: "Email already exists" });
  } catch (error) {
    return res.status(505).send(err.message);
  }
});

router.post("/signIn-email", async (req, res) => {
  let { email } = req.body;
  try {
    if (!email) {
      return res.status(400).send("Details were not provided");
    }

    let user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).send({ Error: "Email not found" });
    }
    let details = await client.verify
      .services(serviceSid)
      .verifications.create({
        to: email,
        channel: "email",
      });
    details = _.pick(details, ["status", "to", "valid"]);
    return res.status(200).send({ details });
  } catch (err) {
    console.log(err);
    return res.status(505).send(err.message);
  }
});

router.post("/authenticate-signIn-email", async (req, res) => {
  let { email, code } = req.body;
  try {
    if (!email || !code) {
      return res.status(400).send("Details were not provided");
    }

    let details = await client.verify
      .services(serviceSid)
      .verificationChecks.create({
        to: email,
        code: code,
      });
    if (details.status === "pending") {
      throw new Error();
    }
    let user = await User.findOne({ email: email });
    if (!user) {
      throw new Error();
    }
    const token = user.generateAuthToken();
    return res.status(200).send({ token });
  } catch (error) {
    return res.status(400).send("Something went wrong");
  }
});

router.post("/authenticate-signUp-email", async (req, res) => {
  let { email, code, name } = req.body;
  console.log(name);
  try {
    if (!email || !code || !name) {
      return res.status(400).send("Details were not provided");
    }

    let details = await client.verify
      .services(serviceSid)
      .verificationChecks.create({
        to: email,
        code: code,
      });
    if (details.status === "pending") {
      throw new Error();
    }
    let user = new User({ email: email, name: name });
    const token = user.generateAuthToken();
    await user.save();
    return res.status(200).send({ token });
  } catch (error) {
    return res.status(400).send("Something went wrong");
  }
});

router.post("/authenticate-phonenumber", async (req, res) => {
  let { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).send("Something went wrong");
  }
  console.log(code, phoneNumber);
  try {
    const data = await client.verify
      .services(serviceSid)
      .verificationChecks.create({
        to: `+91${phoneNumber}`,
        code: req.body.code,
      });
    console.log(data);
    if (data.status === "pending") {
      throw new Error();
    }

    let user = await User.findOne({ phoneNumber: phoneNumber });
    console.log(user);
    if (user) {
      const token = user.generateAuthToken();
      return res.status(200).send({ token: token });
    } else {
      user = new User({ phoneNumber: phoneNumber });
      user = await user.save();
      const token = user.generateAuthToken();
      return res.status(200).send({ token });
    }
  } catch (error) {
    console.log(error);
    return res.status(505).send("Something went wrong");
  }
});

router.post("/authenticate-phonenumber-and-get-details", async (req, res) => {
  let { phoneNumber, code, cartProducts, totalAmount } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).send("Something went wrong");
  }
  console.log(code, phoneNumber);
  try {
    const data = await client.verify
      .services(serviceSid)
      .verificationChecks.create({
        to: `+91${phoneNumber}`,
        code: req.body.code,
      });
    console.log(data);
    if (data.status === "pending") {
      throw new Error();
    }

    let user = await User.findOne({ phoneNumber: phoneNumber });
    console.log(user);
    if (user) {
      user.cartProducts = cartProducts;
      user.totalAmount = totalAmount;
      user = await user.save();
      const details = _.pick(user, [
        "name",
        "email",
        "phoneNumber",
        "location",
        "imageURL",
        "_id",
        "bookmarks",
        "totalAmount",
        "cartProducts",
      ]);
      const token = user.generateAuthToken();
      return res.status(200).send({ token: token, details: details });
    } else {
      user = new User({
        phoneNumber: phoneNumber,
        cartProducts: cartProducts,
        totalAmount: totalAmount,
      });
      user = await user.save();
      const details = _.pick(user, [
        "name",
        "email",
        "phoneNumber",
        "location",
        "imageURL",
        "_id",
        "bookmarks",
        "totalAmount",
        "cartProducts",
      ]);
      const token = user.generateAuthToken();
      return res.status(200).send({ token: token, details: details });
    }
  } catch (error) {
    console.log(error);
    return res.status(505).send("Something went wrong");
  }
});

router.get("/autoLogIn", auth, async (req, res) => {
  const { _id } = req.user;
  try {
    let user = await User.findById(_id);
    const token = user.generateAuthToken();
    const details = _.pick(user, ["name", "email"]);
    return res.status(200).send({ tokenId: token, id: user._id, details });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ Error: "Something went wrong" });
  }
});

// router.post("/signIn", async (req, res) => {
//   let { email, password } = req.body;
//   if (!email || !password) {
//     return res
//       .status(400)
//       .send({ Error: "Please provide both email and password" });
//   }
//   let user = await User.findOne({ email: email });

//   if (!user) {
//     return res.status(403).send({ Error: "Invalid email or password" });
//   }
//   try {
//     let validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       return res.status(403).send({ Error: "Invalid email or password" });
//     }
//     const token = user.generateAuthToken();
//     const details = _.pick(user, ["name", "email"]);
//     // console.log(token);
//     return res.status(200).send({ tokenId: token, id: user._id, details });
//   } catch (err) {
//     return res.send(err.message);
//   }
// });

router.post("/googleSignIn", async (req, res, next) => {
  const client = new OAuth2Client(
    "203648099645-b4i0peicvdhem6mfbirlapb27aa9r8ed.apps.googleusercontent.com"
  );
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.idToken,
      audience:
        "203648099645-b4i0peicvdhem6mfbirlapb27aa9r8ed.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    console.log(payload);

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = new User({
        _id: mongoose.Types.ObjectId(id),
        name: `${payload.name}`,
        email: payload.email,
      });
      user = await user.save();
    }

    const token = user.generateAuthToken();
    return res.status(200).send({ token });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ Error: "Something went wrong" });
  }
});

router.post("/facebookSignIn", async (req, res) => {
  let userId = req.body.userId;
  // let token = req.body.token;
  try {
    const response = await fetch(
      `https://graph.facebook.com/${userId}?access_token=${req.body.token}&fields=id,name,email`
    );
    const responseJson = await response.json();
    console.log(responseJson);
    let user = await User.findOne({ email: responseJson.email });
    if (!user) {
      user = new User({
        _id: mongoose.Schema.Types.ObjectId(responseJson.id.toString()),
        name: responseJson.name,
        email: responseJson.email,
      });
      user = await user.save();
    }
    console.log(user);
    const token = user.generateAuthToken();
    return res.status(200).send({ token });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ Error: "Something went wrong" });
  }
});

// router.post("/forgot-password", async (req, res, next) => {
//   // console.log("Waiting for hash");
//   // console.log(req.body.hash);
//   try {
//     let email = req.body.email;
//     if (!email) {
//       return res.status(400).send({ Error: "Email was not provided" });
//     }
//     let user = await User.findOne({ email: email });
//     if (!user) {
//       return res.status(400).send({ Error: "Email not found" });
//     }
//     let profileDetails = _.pick(user, ["phoneNumber", "email"]);

//     let first6 = `${profileDetails.phoneNumber}`.substring(0, 6);
//     let newNum = `${profileDetails.phoneNumber}`.replace(first6, "******");

//     console.log(profileDetails);
//     const data = await client.verify.services(serviceSid).verifications.create({
//       to: `+91${profileDetails.phoneNumber}`,
//       channel: "sms",
//       // appHash: `${req.body.hash}`,
//     });
//     const OtpDetails = _.pick(data, ["status", "to", "valid"]);
//     profileDetails.phoneNumber = newNum;
//     return res.status(200).send({ OtpDetails, profileDetails });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).send({ Error: "Something went wrong" });
//   }
// });

// router.post("/verify-status", async (req, res) => {
//   console.log(req.body);
//   // const { _id } = req.user;

//   try {
//     const { code } = req.body;
//     if (!code) {
//       throw new Error();
//     }
//     let email = req.body.email;
//     let user = await User.findOne({ email: email });
//     const data = await client.verify
//       .services(serviceSid)
//       .verificationChecks.create({
//         to: `+91${user.phoneNumber}`,
//         code: req.body.code,
//       });
//     console.log(data);
//     if (data.status === "approved") {
//       let user = await User.findOne({ email: email });

//       const token = user.generateAuthToken();
//       return res.status(200).send({ token });
//     }
//     // const details = _.pick(data, ["status", "to", "valid"]);
//   } catch (error) {
//     console.log(error);
//     const details = {
//       status: "Failed",
//     };
//     return res.status(400).send({ details });
//   }
// });

// router.post("/new-password", auth, async (req, res) => {
//   let { password } = req.body;
//   const { _id } = req.user;
//   console.log(req.body);
//   // console.log(name, email, password);
//   try {
//     let user = await User.findById(_id);
//     if (!user || !password) {
//       return res.status(400).send({ Error: "Something is missing" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(password, salt);
//     user = await user.save();
//     const token = user.generateAuthToken();
//     return res.status(200).send({ token });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send(err.message);
//   }
// });

module.exports = router;
