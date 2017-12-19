import express from "express";
import AWS from "aws-sdk";
import multer from "multer";
import authenticate from "../middlewares/authenticate";
import Post from "../models/Post";
import parseErrors from "../utils/parseErrors";

const router = express.Router();
router.use(authenticate);

// Amazon s3 config
const s3 = new AWS.S3();
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  subregion: "northeast-2"
});

// Multer config
// memory storage keeps file data in a buffer
const upload = multer({
  storage: multer.memoryStorage(),
  // file size limitation in bytes
  // 10485760 = 5 megabyte
  // 52428800 = 50 megabyte
  limits: { fileSize: 52428800 }
});

// router.get("/", (req, res) => {
//   Post.find({})
//     .sort({ updatedAt: -1 })
//     .then(posts => res.json({ posts }));
// });

router.post("/", (req, res) => {
  console.log("\n Blog Pages Fetched!");
  const page = req.body.post.page;
  const num = req.body.post.pageNumber;

  const options = {
    sort: { updatedAt: -1 },
    offset: (page - 1) * num,
    limit: num
  };

  Post.paginate({}, options, (err, posts) => {
    res.json({ posts });
  }).catch(err => {
    res.status(500).json({ err });
    console.log("\n ", err);
  });
});

router.post("/create", (req, res) => {
  console.log("\n Blog Post Create...");
  Post.create({ ...req.body.post })
    .then(post => res.json({ post }))
    .catch(err => res.status(400).json({ errors: parseErrors(err.errors) }));
    console.log("Create Blog Post Title: ", req.body.post.title)
});

router.post("/edit", (req, res) => {
  console.log("\n Blog Post Edit...");
  const query = { _id: req.body.post._id };
  const newData = {
    title: req.body.post.title,
    imgURL: req.body.post.imgURL,
    content: req.body.post.content
  };

  Post.findOneAndUpdate(query, newData, { upsert: true })
    .then(res.json("성공적으로 업데이트 했습니다."))
    .catch(err => {
      res.status(500).json({ errors: parseErrors(err.errors) });
      console.log("\n ", err);
    });
  console.log("Post Edit Title: ", newData.title);
});

router.post("/delete", (req, res) => {
  console.log("\n Blog Post Deleted!");
  const query = { _id: req.body.post._id };

  Post.findOneAndRemove(query)
    .then(res.json("성공적으로 지웠습니다."))
    .catch(err => {
      res.status(500).json({ errors: parseErrors(err.errors) });
    });
  console.log("Post Delete _id: ", query._id);
});

router.post("/uploadImages", upload.single("file"), (req, res) => {
  const date = new Date()
    .toLocaleString("en-GB")
    .slice(0, -2)
    .replace(/[ :,/]/g, "");

  const s3Upload = files => {
    const Key = date.concat(`_${files.originalname}`);
    const imgURL = `https://s3.ap-northeast-2.amazonaws.com/greenmate-images/${Key}`;

    s3.putObject(
      {
        Bucket: "greenmate-images",
        Key,
        Body: files.buffer,
        ACL: "public-read" // your permisions
      },
      err => {
        console.log("\n", " Image Uploaded At: ", imgURL);
        if (err) return res.status(400).json({ err });
        return res.json({ imgURL });
      }
    );
  };

  s3Upload(req.file);
});

router.get("/searchPost", (req, res) => {
  console.log("\n Search Blog Post by Title!");
  Post.find({}, "title")
    .sort({ updatedAt: -1 })
    .then(titles => res.json({ titles }));
});

router.post("/searchPost", (req, res) => {
  console.log(req.body.title);
  const query = { title: { $regex: req.body.title, $options: "i" } };
  Post.find(query)
    .sort({ updatedAt: -1 })
    .exec((error, post) => {
      if (error) {
        console.log("\n ", error);
        return res.status(error.code).json({ error });
      }
      return res.status(200).json({ post });
    });
});

export default router;
