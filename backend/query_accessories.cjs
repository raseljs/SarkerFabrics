require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const accessories = await db.collection("accessories").find({}).toArray();
  console.log("Total accessories:", accessories.length);
  accessories.forEach(a => console.log(`- ${a.name} (slug: ${a.slug}, linkedProduct: ${a.linkedProductSlug})`));
  process.exit(0);
}).catch(console.error);
