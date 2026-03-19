# Code Guide

คู่มือสำหรับนักพัฒนาที่ต้องการเข้าใจโครงสร้างโค้ดและเพิ่ม feature ใหม่

---

## โครงสร้างโค้ด

```
server/src/
├── app.js              ตั้งค่า Express, register routes
├── config/
│   └── db.js           เชื่อมต่อ MySQL
├── routes/             กำหนด URL → controller
├── controllers/        รับ request, validate, เรียก model, ส่ง response
├── models/             query SQL กับ database
└── middlewares/
    └── errorHandler.js จัดการ error กลาง

frontend/
├── assets/css/styles.css   stylesheet ทั้งโปรเจกต์
├── js/api.js               helper เรียก API
└── pages/
    └── <feature>/
        ├── index.html      หน้า UI
        └── index.js        logic ของหน้า
```

---

## Pattern ของ Server (MVC)

request → **route** → **controller** → **model** → database

### routes/
รับแค่ HTTP method + path แล้วส่งต่อ controller:
```js
router.get('/', controller.getAll)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)
```

### controllers/
- รับ `req`, `res`, `next`
- validate input (ถ้า POST)
- เรียก model
- ส่ง response กลับ
- ส่ง error ไป errorHandler ด้วย `next(error)`

```js
const create = async (req, res, next) => {
  try {
    const { name, user_id } = req.body
    // validate
    const result = await Model.create(req.body)
    res.json({ message: 'insert ok', data: result })
  } catch (error) {
    next(error)
  }
}
```

### models/
- ทำ SQL query ตรง ๆ
- return ผลลัพธ์ให้ controller

---

## Pattern ของ Frontend

แต่ละหน้าใน `pages/<feature>/` จะแยกเป็น 2 ไฟล์:
- `index.html` — โครงสร้าง UI
- `index.js` — โหลดข้อมูล, render, จัดการ event

ใช้ `api.js` สำหรับ fetch:
```js
// frontend/js/api.js
const BASE_URL = 'http://localhost:8000'

// ใช้ใน index.js ของแต่ละหน้า
const users = await fetchUsers()
```

---

## วิธีเพิ่ม Feature ใหม่

สมมติต้องการเพิ่ม feature `comments`:

### 1. Database
เพิ่มตารางใน `database/schema.sql`:
```sql
CREATE TABLE `comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

### 2. Model
สร้าง `server/src/models/comments.js`:
```js
const { getConnection } = require('../config/db')

const findByTaskId = async (taskId) => {
  const conn = await getConnection()
  const [rows] = await conn.query('SELECT * FROM comments WHERE task_id = ?', [taskId])
  return rows
}

const create = async (data) => {
  const conn = await getConnection()
  const [result] = await conn.query('INSERT INTO comments SET ?', [data])
  return result
}

module.exports = { findByTaskId, create }
```

### 3. Controller
สร้าง `server/src/controllers/comments.js`:
```js
const CommentModel = require('../models/comments')

const getByTask = async (req, res, next) => {
  try {
    const comments = await CommentModel.findByTaskId(req.params.taskId)
    res.json(comments)
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const { task_id, user_id, content } = req.body
    const errors = []
    if (!task_id) errors.push('กรุณาระบุ task_id')
    if (!user_id) errors.push('กรุณาระบุ user_id')
    if (!content) errors.push('กรุณากรอก content')
    if (errors.length > 0) return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ', errors })

    const result = await CommentModel.create(req.body)
    res.json({ message: 'insert ok', data: result })
  } catch (error) {
    next(error)
  }
}

module.exports = { getByTask, create }
```

### 4. Route
สร้าง `server/src/routes/comments.js`:
```js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/comments')

router.get('/task/:taskId', controller.getByTask)
router.post('/', controller.create)

module.exports = router
```

### 5. Register Route
เพิ่มใน `server/src/app.js`:
```js
app.use('/comments', require('./routes/comments'))
```

### 6. Frontend
สร้าง `frontend/pages/comments/index.html` และ `index.js`

---

## Naming Conventions

| สิ่งที่ | รูปแบบ | ตัวอย่าง |
|--------|--------|---------|
| ไฟล์ | kebab-case | `error-handler.js` |
| ตัวแปร/function | camelCase | `getAll`, `findById` |
| ตาราง DB | snake_case | `task_tags`, `assigned_user_id` |
| CSS class | kebab-case | `.btn-row`, `.card-title` |

---

## Response Format มาตรฐาน

**สำเร็จ (GET)**
```json
[ { ... }, { ... } ]
```

**สำเร็จ (POST/PUT/DELETE)**
```json
{ "message": "insert ok", "data": { ... } }
```

**Error 400**
```json
{ "message": "กรอกข้อมูลไม่ครบ", "errors": ["..."] }
```

**Error 404**
```json
{ "message": "ไม่พบ ..." }
```
