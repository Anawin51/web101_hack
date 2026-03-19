# API Documentation

Base URL: `http://localhost:8000`

---

## Users

### GET /users
ดึงรายชื่อผู้ใช้ทั้งหมด

**Response 200**
```json
[
  {
    "id": 1,
    "firstname": "สมชาย",
    "lastname": "ใจดี",
    "age": 25,
    "gender": "ชาย",
    "interests": "วิดีโอเกม",
    "description": "นักพัฒนาซอฟต์แวร์"
  }
]
```

---

### GET /users/:id
ดึงข้อมูลผู้ใช้ตาม id

**Response 200**
```json
{
  "id": 1,
  "firstname": "สมชาย",
  "lastname": "ใจดี",
  "age": 25,
  "gender": "ชาย",
  "interests": "วิดีโอเกม",
  "description": "นักพัฒนาซอฟต์แวร์"
}
```

**Response 404**
```json
{ "message": "หาไม่เจอ" }
```

---

### POST /users
สร้างผู้ใช้ใหม่

**Request Body**
```json
{
  "firstname": "สมชาย",
  "lastname": "ใจดี",
  "age": 25,
  "gender": "ชาย",
  "interests": "วิดีโอเกม",
  "description": "นักพัฒนาซอฟต์แวร์"
}
```

> `gender` รับค่า: `"ชาย"` | `"หญิง"` | `"ไม่ระบุ"`

**Response 200**
```json
{ "message": "insert ok", "data": { ... } }
```

**Response 400**
```json
{
  "message": "กรอกข้อมูลไม่ครบ",
  "errors": ["กรุณากรอกชื่อ", "กรุณากรอกอายุ"]
}
```

---

### PUT /users/:id
แก้ไขข้อมูลผู้ใช้ (ส่งเฉพาะ field ที่ต้องการแก้ไข)

**Request Body** (ทุก field เป็น optional)
```json
{
  "firstname": "สมชาย",
  "age": 26
}
```

**Response 200**
```json
{ "message": "update ok", "data": { ... } }
```

---

### DELETE /users/:id
ลบผู้ใช้ (จะลบ projects และ tasks ที่เกี่ยวข้องด้วย)

**Response 200**
```json
{ "message": "delete ok", "data": { ... } }
```

---

## Projects

### GET /projects
ดึงรายชื่อโปรเจกต์ทั้งหมด

**Response 200**
```json
[
  {
    "id": 1,
    "name": "เว็บไซต์บริษัท",
    "description": "พัฒนาเว็บไซต์หลักของบริษัท",
    "user_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /projects/:id
ดึงข้อมูลโปรเจกต์พร้อม task ทั้งหมดในโปรเจกต์

**Response 200**
```json
{
  "id": 1,
  "name": "เว็บไซต์บริษัท",
  "description": "พัฒนาเว็บไซต์หลักของบริษัท",
  "user_id": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "tasks": [
    {
      "id": 1,
      "title": "ออกแบบ UI หน้าแรก",
      "status": "todo"
    }
  ]
}
```

**Response 404**
```json
{ "message": "ไม่พบ project" }
```

---

### POST /projects
สร้างโปรเจกต์ใหม่

**Request Body**
```json
{
  "name": "ชื่อโปรเจกต์",
  "description": "คำอธิบาย",
  "user_id": 1
}
```

> `name` และ `user_id` จำเป็นต้องระบุ

**Response 200**
```json
{ "message": "insert ok", "data": { ... } }
```

---

### PUT /projects/:id
แก้ไขโปรเจกต์

**Request Body** (ทุก field เป็น optional)
```json
{
  "name": "ชื่อใหม่",
  "description": "คำอธิบายใหม่"
}
```

---

### DELETE /projects/:id
ลบโปรเจกต์ (จะลบ tasks ในโปรเจกต์ด้วย)

---

## Tasks

### GET /tasks
ดึง task ทั้งหมด

**Response 200**
```json
[
  {
    "id": 1,
    "title": "ออกแบบ UI หน้าแรก",
    "description": "ออกแบบ mockup หน้า landing page",
    "status": "todo",
    "project_id": 1,
    "assigned_user_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /tasks/:id
ดึง task พร้อม tags

**Response 200**
```json
{
  "id": 1,
  "title": "ออกแบบ UI หน้าแรก",
  "status": "todo",
  "project_id": 1,
  "assigned_user_id": 1,
  "tags": [
    { "id": 4, "name": "design" }
  ]
}
```

---

### POST /tasks
สร้าง task ใหม่

**Request Body**
```json
{
  "title": "ชื่อ task",
  "description": "คำอธิบาย",
  "status": "todo",
  "project_id": 1,
  "assigned_user_id": 1
}
```

> `title` และ `project_id` จำเป็นต้องระบุ
> `status` รับค่า: `"todo"` | `"in_progress"` | `"done"` (default: `"todo"`)

---

### PUT /tasks/:id
แก้ไข task (ใช้บ่อยสำหรับอัปเดต status)

**Request Body** (ทุก field เป็น optional)
```json
{
  "status": "in_progress",
  "assigned_user_id": 2
}
```

---

### DELETE /tasks/:id
ลบ task

---

### POST /tasks/:id/tags
เพิ่ม tag ให้ task

**Request Body**
```json
{ "tag_id": 1 }
```

**Response 200**
```json
{ "message": "add tag ok" }
```

---

### DELETE /tasks/:id/tags/:tagId
เอา tag ออกจาก task

**Response 200**
```json
{ "message": "remove tag ok" }
```

---

## Tags

### GET /tags
ดึง tag ทั้งหมด

**Response 200**
```json
[
  { "id": 1, "name": "bug" },
  { "id": 2, "name": "feature" },
  { "id": 3, "name": "urgent" },
  { "id": 4, "name": "design" }
]
```

---

### POST /tags
สร้าง tag ใหม่ (ชื่อต้องไม่ซ้ำ)

**Request Body**
```json
{ "name": "ชื่อ tag" }
```

---

## Error Responses

| Status | ความหมาย |
|--------|---------|
| 400 | ข้อมูลไม่ครบหรือไม่ถูกต้อง |
| 404 | ไม่พบข้อมูลที่ต้องการ |
| 500 | Server error |
