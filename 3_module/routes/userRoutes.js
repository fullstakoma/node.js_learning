const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");

router.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        error: "名前とメールアドレスは必須です",
        receivedData: req.body,
      });
    }

    if (global.appState.useFallback) {
      // フォールバックモード処理
      const existingUser = global.appState.inMemoryDb.users.find(
        (u) => u.email === email
      );
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "このメールアドレスは既に登録されています" });
      }

      const newUser = {
        id: Date.now(),
        name,
        email,
        created_at: new Date(),
      };
      global.appState.inMemoryDb.users.push(newUser);
      return res.status(201).json(newUser);
    }

    // MongoDBモードでの処理
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "このメールアドレスは既に登録されています" });
      }

      const user = new User({ name, email });
      const savedUser = await user.save();
      console.log("ユーザー作成成功:", savedUser);
      return res.status(201).json(savedUser);
    }
  } catch (error) {
    console.error("ユーザー作成エラー:", error);
    res.status(400).json({
      error: "ユーザー作成に失敗しました",
      details: error.message,
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    console.log("ユーザー一覧取得開始");

    // フォールバックモードでの処理
    if (global.appState.useFallback) {
      const users = global.appState.inMemoryDb.users;
      console.log(
        "フォールバック: メモリからユーザー一覧を取得:",
        users.length
      );
      return res.json(users);
    }

    // MongoDBモードでの処理
    if (mongoose.connection.readyState === 1) {
      const users = await User.find().select("-__v");
      return res.json(users);
    }
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    res.status(500).json({
      error: "ユーザー一覧の取得に失敗しました",
      details: error.message,
    });
  }
});

module.exports = router;
