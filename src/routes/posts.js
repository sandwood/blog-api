import express from "express";
import authenticate from "../middlewares/authenticate";
import Post from "../models/Post";
import parseErrors from "../utils/parseErrors";

const router = express.Router();
router.use(authenticate);

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

export default router;

// const query = req.body.post._id;

// Post.findOneAndUpdate(
//   { _id: query },
//   { title: req.body.post.title, content: req.body.post.content },
//   { new: true }
// ).then(
//   post =>
//     post ? res.json({ post: post.toAuthJSON() }) : res.status(400).json({})
// );
