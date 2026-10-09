const jwt = require("jsonwebtoken");
require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await mongoose.connection.db.collection("users").findOne({ role: "admin" });
  if (!user) { console.log("No admin found"); process.exit(1); }
  const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: "admin", type: "access", authVersion: user.authVersion ?? 0 }, process.env.JWT_ACCESS_SECRET, { expiresIn: "5m", issuer: "drone-bangladesh-api", audience: "drone-bangladesh-client", algorithm: "HS256" });
  
  const payload = {
    name: "Test Accessory 2",
    category: "Drones",
    categories: ["Drones"],
    stock: 55,
    unitCost: 100,
    supplier: "Test Supplier",
    variants: [{ name: "Color", options: ["Red", "Blue"] }]
  };
  
  const res = await fetch("http://localhost:5000/api/v1/admin/accessories", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const d = await res.json();
  console.log(JSON.stringify(d, null, 2));
  process.exit(0);
}).catch(console.error);
