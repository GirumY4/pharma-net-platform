import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../modules/users/user.model.js";
import Medicine from "../modules/inventory/medicine.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set!");
    return;
  }
  await mongoose.connect(MONGODB_URI);
  
  const managers = await User.find({ role: "pharmacy_manager" });
  console.log("=== Pharmacy Managers ===");
  for (const m of managers) {
    console.log(`Manager ID: ${m._id}, Name: ${m.name}, Email: ${m.email}, City: ${m.city}, Active: ${m.isActive}`);
  }
  
  const medicines = await Medicine.find({ isDeleted: false });
  console.log("\n=== Medicines ===");
  for (const med of medicines) {
    console.log(`Med ID: ${med._id}, Name: ${med.name}, Pharmacy ID: ${med.pharmacyId}, Price: ${med.unitPrice}, Stock: ${med.totalStock}`);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
