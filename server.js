const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/library";
const PORT = process.env.PORT || 3000;

const bookSchema = new mongoose.Schema(
  {
    title:  { type: String, required: [true, "Title is required"], trim: true },
    author: { type: String, required: [true, "Author is required"], trim: true },
    year:   { type: Number, min: [0, "Year must be positive"], max: [2100, "Year is too far ahead"] },
    genre:  { type: String, trim: true, default: "" },
    status: { type: String, enum: ["available", "borrowed", "lost"], default: "available" },
    notes:  { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);
const Book = mongoose.model("Book", bookSchema);

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(", ") });
  }
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// CREATE
app.post("/api/books", wrap(async (req, res) => {
  res.status(201).json(await Book.create(req.body));
}));

// READ (list, optional ?q= search and ?status= filter)
app.get("/api/books", wrap(async (req, res) => {
  const { q, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { author: rx }, { genre: rx }];
  }
  res.json(await Book.find(filter).sort({ createdAt: -1 }));
}));

// READ (one)
app.get("/api/books/:id", wrap(async (req, res) => {
  const book = await Book.findById(req.params.id);
  book ? res.json(book) : res.status(404).json({ error: "Book not found" });
}));

// UPDATE
app.put("/api/books/:id", wrap(async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  book ? res.json(book) : res.status(404).json({ error: "Book not found" });
}));

// DELETE
app.delete("/api/books/:id", wrap(async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  book ? res.json({ deleted: true }) : res.status(404).json({ error: "Book not found" });
}));

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Library running at http://localhost:${PORT}`)))
  .catch((err) => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
