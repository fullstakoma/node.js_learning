const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/user");

const app = express();

// ユーザー一覧を出力する関数を追加
async function printUsersList() {
  console.log("\n=== 現在のユーザー一覧 ===");
  console.log("-------------------------");
  const users = await User.find({});
  users.forEach((user) => {
    console.log(`ID: ${user._id}`);
    console.log(`ユーザー名: ${user.username}`);
    console.log(`ロール: ${user.role}`);
    console.log(`作成日: ${user.createdAt}`);
    console.log("-------------------------");
  });
  console.log(`合計ユーザー数: ${users.length}`);
  console.log("=========================\n");
}

// MongoDBの接続設定を修正
mongoose
  .connect("mongodb://localhost:27017/auth_system", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected successfully");
    // データベースの状態を確認
    mongoose.connection.db.stats().then((stats) => {
      console.log("Database stats:", {
        collections: stats.collections,
        documents: stats.objects,
        indexes: stats.indexes,
      });
    });
    console.log("\n初期ユーザー一覧:");
    await printUsersList();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // 接続エラー時はアプリケーションを終了
  });

// ミドルウェアの順序を修正
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// セッション設定
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// デバッグログの追加
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers,
  });
  next();
});

// Root route should serve index.html from the root directory
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  console.log("Serving index.html from:", indexPath);
  res.sendFile(indexPath);
});

// 登録エンドポイントにデバッグログを追加
app.post("/api/register", async (req, res) => {
  console.log("Registration attempt:", req.body);
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
      });
    }

    // ユーザー名の重複チェック
    const existingUser = await User.findOne({ username });
    console.log("Existing user check:", { exists: !!existingUser });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username already exists",
      });
    }

    // 新しいユーザーの作成
    const newUser = new User({ username });
    await newUser.setPassword(password);
    const savedUser = await newUser.save();

    console.log("User created successfully:", {
      id: savedUser._id,
      username: savedUser.username,
      role: savedUser.role,
    });

    console.log("新規ユーザーが登録されました:");
    console.log(`ID: ${savedUser._id}`);
    console.log(`ユーザー名: ${savedUser.username}`);
    console.log(`ロール: ${savedUser.role}`);

    // ユーザー一覧を出力
    await printUsersList();

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Registration failed",
    });
  }
});

// Passport設定の更新
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Invalid credentials" });
      }

      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return done(null, false, { message: "Invalid credentials" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Put all API routes after the root route
// Update the login endpoint with better error handling
app.post("/api/login", (req, res, next) => {
  console.log("Login attempt received:", {
    username: req.body.username,
    headers: req.headers,
  });

  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      status: "error",
      message: "Username and password are required",
    });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }

    if (!user) {
      console.log("Authentication failed:", info?.message);
      return res.status(401).json({
        status: "error",
        message: info?.message || "Invalid credentials",
      });
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({
          status: "error",
          message: "Login failed",
        });
      }

      console.log("Login successful:", user.username);
      return res.json({
        status: "success",
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });

      console.log("ユーザーがログインしました:");
      console.log(`ID: ${user._id}`);
      console.log(`ユーザー名: ${user.username}`);
      console.log(`ロール: ${user.role}`);

      // ユーザー一覧を出力
      await printUsersList();
    });
  })(req, res, next);
});

// ログアウトエンドポイント
app.post("/api/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Protected routeの更新
app.get("/api/protected", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to access this resource",
    });
  }

  // ユーザー情報をMongoDBから最新の状態で取得
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    message: "Access granted",
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// ユーザー一覧取得エンドポイントの修正
app.get("/api/users", async (req, res) => {
  console.log("Users list request received");
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const users = await User.find({}).select("username role createdAt");
    console.log(`Found ${users.length} users`);

    res.json({
      status: "success",
      users: users.map((user) => ({
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      users: [], // エラー時は空配列を返す
    });
  }
});

// アカウント削除エンドポイントの修正
app.delete("/api/delete-account", async (req, res) => {
  console.log("Delete account request received"); // デバッグログ
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const userId = req.user._id;
    console.log("Attempting to delete user:", userId);

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // セッション破棄前にユーザー情報をログに出力
    console.log("Successfully deleted user:", deletedUser.username);
    const remainingUsers = await User.find({});
    console.log("Remaining users:", remainingUsers.length);
    remainingUsers.forEach((user) => {
      console.log(`- ${user.username} (${user.role})`);
    });

    console.log("ユーザーが削除されました:");
    console.log(`ID: ${deletedUser._id}`);
    console.log(`ユーザー名: ${deletedUser.username}`);
    console.log(`ロール: ${deletedUser.role}`);

    // ユーザー一覧を出力
    await printUsersList();

    // セッションを破棄
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({
            status: "error",
            message: "Error during logout",
          });
        }
        res.clearCookie("connect.sid"); // セッションクッキーをクリア
        res.json({
          status: "success",
          message: "Account deleted successfully",
        });
      });
    } else {
      res.json({
        status: "success",
        message: "Account deleted successfully",
      });
    }
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete account",
    });
  }
});

// MongoDBの接続状態を定期的にチェック
setInterval(() => {
  if (mongoose.connection.readyState !== 1) {
    console.error("MongoDB connection lost");
  }
}, 10000);

// Handle 404 errors for API routes
app.use("/api/*", (req, res) => {
  console.log("API 404 error for path:", req.path);
  res.status(404).json({ error: "Not Found" });
});

// Handle 404 errors for non-API routes
app.use("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "index.html"));
});

// Update error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    status: "error",
    message: "Server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// サーバーの起動
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Debug mode: enabled");
});
