import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    writer: { type: String, required: true }
  },
  {
    timestamps: { createdAt: "created_at" }
  }
);
export default mongoose.model("Post", postSchema);
