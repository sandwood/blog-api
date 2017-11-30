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
  limits: { fileSize: 52428800 }
});

router.get("/", (req, res) => {
  Post.find({})
    .sort({ updatedAt: -1 })
    .then(posts => res.json({ posts }));
});

router.post("/", (req, res) => {
  Post.create({ ...req.body.post })
    .then(post => res.json({ post }))
    .catch(err => res.status(400).json({ errors: parseErrors(err.errors) }));
});

router.post("/edit", (req, res) => {
  const query = { _id: req.body.post._id };
  const newData = {
    title: req.body.post.title,
    content: req.body.post.content
  };

  Post.findOneAndUpdate(query, newData, { upsert: true })
    .then(res.json("성공적으로 업데이트 했습니다."))
    .catch(err => {
      res.status(500).json({ errors: parseErrors(err.errors) });
      console.log(err);
    });
});

router.post("/delete", (req, res) => {
  const query = { _id: req.body.post._id };

  Post.findOneAndRemove(query)
    .then(res.json("성공적으로 지웠습니다."))
    .catch(err => {
      res.status(500).json({ errors: parseErrors(err.errors) });
    });
});

router.post("/uploadImages", upload.single("file"), (req, res) => {
  const date = new Date()
    .toLocaleString("en-GB")
    .substring(0, 20)
    .replace(/[. :]/g, "");
  const Key = date.concat(`_${req.file.originalname}`);
  const imgURL = `https://s3.ap-northeast-2.amazonaws.com/greenmate-images/${Key}`;

  s3.putObject(
    {
      Bucket: "greenmate-images",
      Key,
      Body: req.file.buffer,
      ACL: "public-read" // your permisions
    },
    err => {
      console.log("Image uploaded: ", imgURL);
      if (err) return res.status(400).json({err});
      return res.json({ imgURL });
    }
  );
});
// router.post("/uploadImages", (req, res) => {
//   const form = new multiparty.Form();
//   const bucketName = "greenmate-images";
//   const picUrl = [];
//   let params = {};

//   // file upload handling
//   form.on("part", part => {
//     console.log(part);
//     let filename;
//     let tempPicUrl;
//     const rightNow = new Date();
//     if (part.filename) {
//       filename = `${rightNow
//         .toLocaleString()
//         .substring(0, 12)
//         .replace(/[. ]/g, "")}_${part.filename}`;
//       tempPicUrl = `https://s3.ap-northeast-2.amazonaws.com/${bucketName}/${filename}`;
//       picUrl.push(tempPicUrl);
//       console.log(filename);
//       params = {
//         Bucket: "greenmate-images",
//         Key: filename,
//         ACL: "public-read"
//       };
//     } else {
//       part.resume();
//     }
//     console.log(`Write Streaming file : ${filename}`);

//     const upload = s3Stream.upload(params);

//     part.pipe(upload);

//     part.on("data", chunk => {
//       console.log(`${filename} read ${chunk.length} bytes`);
//     });

//     part.on("end", () => {
//       console.log(`${filename} + Part read complete`);
//       upload.end();
//     });
//   });

//   // all uploads are completed
//   form.on("close", () => {
//     console.log(picUrl);
//     return res.status(201).json({
//       isSuccess: 1,
//       picUrl
//     });
//   });

//   // track progress
//   form.on("progress", (byteRead, byteExpected) => {
//     console.log(`Reading total ${byteRead}/${byteExpected}`);
//   });

//   form.on("error", (err) => {
//     console.log(`Error parsing form: ${err.stack}`);
//   });

//   form.parse(req);
// });

export default router;
