import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    writer: { type: String, required: true },
    imgURL: { type: String}
  },
  {
    timestamps: { createdAt: "created_at" }
  }
);

postSchema.plugin(mongoosePaginate);

export default mongoose.model("Post", postSchema);
