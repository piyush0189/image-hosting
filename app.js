const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Image = require("./models/image");

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "myAppUploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const upload = multer({ storage });

// Upload image
app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const newImage = new Image({
      url: req.file.path,
      public_id: req.file.filename,
    });
    await newImage.save();
    res.json({ message: "Image uploaded!", imageUrl: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving image to DB" });
  }
});

// Get all images
app.get("/api/images", async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadedAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: "Error fetching images" });
  }
});

// Delete image
app.delete("/api/images/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: "Image not found" });

    await cloudinary.uploader.destroy(image.public_id);
    await image.deleteOne();

    res.json({ message: "Image deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting image" });
  }
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

