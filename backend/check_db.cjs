require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const filter = {};
  filter.$or = [ { name: { $regex: "gfdgsdf", $options: "i" } }, { sku: { $regex: "gfdgsdf", $options: "i" } } ];
  filter.$and = [];
  filter.$and.push({ $or: [{ category: "DJI Inspire" }, { categories: "DJI Inspire" }] });
  
  const accessories = await db.collection("accessories").find(filter).toArray();
  console.log("Found:", accessories.length);
  process.exit(0);
}).catch(console.error);
