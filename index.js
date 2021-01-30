const express = require("express");
const authRouter = require("./routes/auth");
const stockRouter = require("./routes/stock");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");
const imageRouter = require("./routes/image-upload");
const phoneNumberRouter = require("./routes/Phone-Number");
const paymentsRouter = require("./services/payments");
const mongoose = require("mongoose");
const config = require("config");
const bodyParser = require("body-parser");
const app = express();

if (!config.get("jwtPrivateKey")) {
  console.log("FATAL ERROR:Private Key not defined");
  process.exit(1);
}

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use("/auth", authRouter);
app.use("/images", imageRouter);
app.use("/user", userRouter);
app.use("/stock", stockRouter);
app.use("/phoneNumber", phoneNumberRouter);
app.use("/admin", adminRouter);
app.use("/payments", paymentsRouter);
// app.get("/api/genres", auth, (req, res, next) => {
//   res.status(200).send({ Reply: "You are accessing genre" });
// });

mongoose.connect(
  "mongodb://localhost/AuthFlow",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  () => {
    console.log("Connected to mongoose");
  }
);
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
