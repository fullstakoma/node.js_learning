const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const path = require("path");
const cors = require("cors");
const dbConfig = require("./config/database");

const app = express();

// グローバルなアプリケーション状態
global.appState = {
  useFallback: false,
  inMemoryDb: dbConfig.fallback.storage,
};

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB接続設定
const connectToMongoDB = async (retryCount = 0, maxRetries = 3) => {
  if (!dbConfig.fallback.enabled && retryCount >= maxRetries) {
    throw new Error("MongoDB接続に失敗し、フォールバックが無効です。");
  }

  try {
    console.log(`MongoDB接続試行 (${retryCount + 1}/${maxRetries + 1})`);
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    console.log("MongoDBに接続しました");
    return true;
  } catch (err) {
    console.error("MongoDB接続エラー:", err.message);
    if (retryCount < maxRetries) {
      console.log(`5秒後に再試行します...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectToMongoDB(retryCount + 1, maxRetries);
    }
    if (dbConfig.fallback.enabled) {
      console.log("フォールバックモードで起動します");
      global.appState.useFallback = true;
      return false;
    }
    throw err;
  }
};

// API状態チェックミドルウェア
app.use("/api", (req, res, next) => {
  if (global.appState.useFallback) {
    console.log("フォールバックモードでリクエスト処理:", req.path);
  }
  next();
});

// ルート設定
app.use("/api", userRoutes);
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/api/status", (req, res) => {
  res.json({
    mode: global.appState.useFallback ? "fallback" : "mongodb",
    database: global.appState.useFallback ? "in-memory" : "mongodb",
    status: "running",
  });
});

// 404エラーハンドリング（/apiパスの場合はJSON形式でエラーを返す）
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
});

// アプリケーション起動
(async () => {
  try {
    await connectToMongoDB();
  } catch (err) {
    console.error("致命的なエラー:", err.message);
    process.exit(1);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    console.log(
      `モード: ${global.appState.useFallback ? "フォールバック" : "MongoDB"}`
    );
  });
})();

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error("エラー発生:", err);
  res.status(500).json({
    error: "サーバーエラーが発生しました",
    mode: global.appState.useFallback ? "fallback" : "mongodb",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
