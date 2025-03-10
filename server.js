import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// === 🔹 Redis Config ===
const redis = new Redis({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
});

async function setApiKey() {
  try {
  	const apiKey = process.env.SECURE_APP_KEY;
  	if (!apiKey) {
      	console.error("❌ No API key found!");
      	return;
  	}
  	await redis.set("SECURE_APP_KEY", apiKey);
  	console.log("✅ API Key stored in Redis securely!");
  } catch (error) {
  	console.error("❌ Error setting API Key in Redis:", error);
  }
}



import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));


app.use((req, res, next) => {
  let requestedPath = path.join(__dirname, req.path);
 
  // Jika URL tidak memiliki ekstensi dan file .html tersedia, tambahkan .html
  if (!path.extname(req.path) && fs.existsSync(requestedPath + ".html")) {
	return res.sendFile(requestedPath + ".html");
  }
 
  next();
});


async function getApiKey() {
  try {
  	return await redis.get("SECURE_APP_KEY");
  } catch (error) {
  	console.error("❌ Error fetching API Key from Redis:", error);
  	return null;
  }
}
// Pastikan '/' merender index.html
app.get("/", (req, res) => {
	res.sendFile(path.join(process.cwd(), "index.html"));
});

// Tangani gambar dan aset agar bisa diakses dengan benar
app.use("/images", express.static(path.join(process.cwd(), "images")));
app.use("/styles.css", express.static(path.join(process.cwd(), "styles.css")));

// 🔹 Endpoint untuk mengambil API Key dari Redis
app.get("/get-api-key", async (req, res) => {
  try {
  	const apiKey = await getApiKey();
  	if (!apiKey) {
      	return res.status(404).json({ error: "API Key not found in Redis" });
  	}
  	res.json({ apiKey });
  } catch (error) {
  	console.error("❌ Error fetching API Key:", error);
  	res.status(500).json({ error: "Internal Server Error" });
  }
});


// Tangani 404 Not Found
app.use((req, res) => {
	res.status(404).sendFile(path.join(process.cwd(), "404.html"));
});

// ✅ Simpan API Key ke Redis saat server dimulai
(async () => {
  await setApiKey();
  console.log("🔑 API Key (from .env):", process.env.SECURE_APP_KEY);
})();


// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
