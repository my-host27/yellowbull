const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Sajikan file statis dari root project
app.use(express.static(__dirname));

// Middleware untuk menangani URL tanpa .html
app.use((req, res, next) => {
  let requestedPath = path.join(__dirname, req.path);
  
  // Jika URL tidak memiliki ekstensi dan file .html tersedia, tambahkan .html
  if (!path.extname(req.path) && fs.existsSync(requestedPath + ".html")) {
    return res.sendFile(requestedPath + ".html");
  }
  
  next();
});

// Pastikan '/' merender index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Tangani gambar dan aset agar bisa diakses dengan benar
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/styles.css", express.static(path.join(__dirname, "styles.css")));

// Tangani 404 Not Found
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});