// server.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

// Helmetの設定を調整
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      "script-src-attr": ["'unsafe-inline'"]
    },
  },
}));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ロギングミドルウェアを追加
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} 開始`);
  
  // レスポンス終了時のログ
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} 完了 (${duration}ms)`);
  });
  next();
});

// ルートパスへのアクセスを設定
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 仮のデータストア
let tasks = [
  { id: 1, title: 'Learn Express', completed: false },
  { id: 2, title: 'Build a To-Do App', completed: false }
];

// 全タスクを取得
app.get('/api/tasks', (req, res) => {
  console.log('タスク一覧を取得します');
  res.json(tasks);
  console.log(`現在のタスク数: ${tasks.length}`);
});

// 特定のタスクを取得
app.get('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task);
});

// 新しいタスクを作成
app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: req.body.title,
    completed: false
  };
  tasks.push(newTask);
  console.log('新しいタスクが作成されました:', {
    id: newTask.id,
    title: newTask.title,
    timestamp: new Date().toISOString()
  });
  res.status(201).json(newTask);
});

// タスクを更新
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    console.log(`タスク更新失敗: ID ${id} が見つかりません`);
    return res.status(404).json({ message: 'Task not found' });
  }
  const oldTask = tasks[taskIndex];
  tasks[taskIndex] = { ...oldTask, ...req.body };
  console.log('タスクが更新されました:', {
    id: id,
    変更前: oldTask,
    変更後: tasks[taskIndex],
    timestamp: new Date().toISOString()
  });
  res.json(tasks[taskIndex]);
});

// タスクを削除
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    console.log(`タスク削除失敗: ID ${id} が見つかりません`);
    return res.status(404).json({ message: 'Task not found' });
  }
  const deletedTask = tasks.splice(taskIndex, 1);
  console.log('タスクが削除されました:', {
    削除したタスク: deletedTask[0],
    残りのタスク数: tasks.length,
    timestamp: new Date().toISOString()
  });
  res.json(deletedTask);
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});