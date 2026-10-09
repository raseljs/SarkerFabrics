import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Review } from "./review.model.js";
import { Product } from "../products/product.model.js";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { User } from "../users/user.model.js";
import { env } from "../../config/env.js";
import { validateReviewFiles } from "./review-media.js";

export const reviewRouter = Router();
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024,files:5,fields:3,parts:8,fieldSize:20*1024}}).array("media",5);
const mediaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..","..","uploads","reviews");
function presentReview(review: Record<string, unknown>) {
  return {
    _id: review._id ? String(review._id) : undefined,
    customerName: String(review.customerName || "Customer").slice(0, 120),
    rating: Number(review.rating || 0),
    title: String(review.title || "").slice(0, 200),
    body: String(review.body || "").slice(0, 5_000),
    media: Array.isArray(review.media) ? review.media.map(item=>({type:item.type,url:item.url,name:item.name})) : [],
    createdAt: review.createdAt,
  };
}
reviewRouter.get("/:slug", async (request, response, next) => {
  try {
    const slug = String(request.params.slug || "").trim().slice(0, 160);
    const reviews = await Review.find({ productSlug: slug, status: "approved" })
      .select("customerName rating title body media createdAt")
      .sort({ createdAt: -1 }).limit(200).lean();
    response.json({ success: true, data: reviews.map((review) => presentReview(review as any)) });
  } catch (error) { next(error); }
});
reviewRouter.post("/:slug", requireAuth, (request,response,next)=>{
  const auth=(request as typeof request & {user?:{id?:string;role:string}}).user;
  if(!auth?.id||auth.role!=="customer")return response.status(403).json({success:false,message:"Customer account required"});
  if(!request.is("multipart/form-data"))return next();
  upload(request,response,error=>{
    if(error)return response.status(400).json({success:false,message:error.code==="LIMIT_FILE_SIZE"?"Files must be 25MB or smaller":"Attach up to 5 photos or video files"});
    next();
  });
}, async (request, response, next) => {
  const written: string[]=[];
  try {
    const auth = (request as typeof request & { user?: { id?: string; role: string } }).user!;
    const product = await Product.findOne({ slug: request.params.slug, isActive: true, $or: [{ status: "published" }, { status: { $exists: false } }] }).lean();
    if (!product) return response.status(404).json({ success: false, message: "Product not found" });
    const customer = await User.findById(auth.id).lean();
    const rating = Number(request.body?.rating);
    const body = String(request.body?.body || "").trim().slice(0, 5_000);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !body) return response.status(400).json({ success: false, message: "Rating 1-5 and review text are required" });
    const files=Array.isArray(request.files)?request.files:[];
    const extensions=validateReviewFiles(files);
    const media: Array<{type:"image"|"video";url:string;name:string}>=[];
    if(files.length)await mkdir(mediaRoot,{recursive:true});
    for(const [index,file]of files.entries()){
      const filename=`${randomUUID()}.${extensions[index]}`;
      const target=path.join(mediaRoot,filename);
      written.push(target);await writeFile(target,file.buffer,{flag:"wx"});
      media.push({type:file.mimetype.startsWith("video/")?"video":"image",url:`${env.apiPublicUrl}/uploads/reviews/${filename}`,name:path.basename(file.originalname).slice(0,120)});
    }
    const fields: Record<string,unknown>={productId:product._id,customerName:String(customer?.name||"Customer").trim().slice(0,120),rating,title:String(request.body?.title||"").trim().slice(0,200),body,status:"pending"};
    // Older JSON clients preserve attachments when editing review text.
    if(request.is("multipart/form-data"))fields.media=media;
    const data = await Review.findOneAndUpdate({ productSlug: product.slug, userId: auth.id }, { $set: fields }, { upsert: true, new: true, runValidators: true }).lean();
    response.status(201).json({ success: true, data: presentReview(data as any), message: "Review submitted for approval" });
  } catch (error) {
    await Promise.all(written.map(file=>unlink(file).catch(()=>undefined)));
    next(error);
  }
});
