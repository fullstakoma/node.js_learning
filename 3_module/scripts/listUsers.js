const mongoose = require("mongoose");
const User = require("../models/User");

const listUsers = async () => {
  try {
    // MongoDBに接続
    await mongoose.connect("mongodb://localhost:27017/myapidb", {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDBに接続しました");

    // ユーザー一覧を取得
    const users = await User.find().select("-__v");

    console.log("\nユーザー一覧:");
    console.log("=================");

    if (users.length === 0) {
      console.log("登録されているユーザーはいません。");
    } else {
      users.forEach((user, index) => {
        console.log(`\n[ユーザー ${index + 1}]`);
        console.log(`ID: ${user._id}`);
        console.log(`名前: ${user.name}`);
        console.log(`メール: ${user.email}`);
        console.log(`作成日: ${user.created_at}`);
        console.log("-------------------");
      });
      console.log(`\n合計: ${users.length}人のユーザーが登録されています。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error.message);
  } finally {
    // データベース接続を閉じる
    await mongoose.connection.close();
    console.log("\nデータベース接続を終了しました");
  }
};

// スクリプトを実行
listUsers();
