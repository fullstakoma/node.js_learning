const mongoose = require("mongoose");
const dbConfig = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbUri = dbConfig.uri;
const dbOptions = dbConfig.options;

(async () => {
  try {
    console.log("MongoDB接続試行...");
    await mongoose.connect(dbUri, dbOptions);
    console.log("MongoDBに接続しました");

    // 修正: ネイティブのdropDatabaseを使用
    const result = await mongoose.connection.db.dropDatabase();
    console.log("データベース削除完了:", result); // 結果例: { ok: 1 }

    await mongoose.disconnect();
    console.log("接続切断しました");
  } catch (err) {
    console.error("エラー発生:", err.message);
  }
})();
