const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/drone-bd").then(async () => {
  const db = mongoose.connection.db;
  const accessories = await db.collection("accessories").find({}).toArray();
  console.log(JSON.stringify(accessories, null, 2));
  process.exit(0);
});
