const config = {
  development: {
    uri: "mongodb://localhost:27017/myapidb", // 127.0.0.1 から localhost に変更
    options: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // IPv4を強制
    },
  },
  test: {
    uri: "mongodb://127.0.0.1:27017/myapidb_test",
    options: {
      serverSelectionTimeoutMS: 2000,
    },
  },
  fallback: {
    enabled: true,
    storage: {
      users: [],
    },
  },
};

const env = process.env.NODE_ENV || "development";
module.exports = { ...config[env], fallback: config.fallback };
