import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import User from "../modules/users/user.model.js";

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedAdmin = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is not defined");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("📡 Connected to MongoDB...");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@alyahpharmanet.com";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("❌ ADMIN_PASSWORD environment variable is required");
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`ℹ️ Admin already exists: ${adminEmail}`);
      
      // Update password just in case it was changed in .env
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = "admin"; // Ensure role is admin
      existingAdmin.isActive = true;
      existingAdmin.isDeleted = false;
      await existingAdmin.save();
      
      console.log("✅ Admin credentials updated.");
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      const admin = await User.create({
        name: "System Administrator",
        email: adminEmail,
        passwordHash,
        role: "admin",
        isActive: true,
        isDeleted: false,
      });

      console.log(`✅ Admin created: ${admin.email}`);
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
};

seedAdmin();
