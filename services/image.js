const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

aws.config.update({
  secretAccessKey: "2uBoqbYrDMK4LihzkUXwX+Z4zWNv55wz+rXNiu77",
  accessKeyId: "AKIAJQKGIR75VZGTTGFQ",
  region: "us-west-1",
});

const s3 = new aws.S3();
const upload = multer({
  // limits: { fieldSize: 10000 },
  storage: multerS3({
    s3: s3,
    bucket: "images263/profile_pictures",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      // console.log(file);
      // console.log(req.file);
      cb(null, { description: "Profile picture of the user." });
    },
    key: function (req, file, cb) {
      const { _id } = req.user;
      // console.log(file);
      // console.log(req.file);
      cb(null, _id);
    },
  }),
});

module.exports = upload;
