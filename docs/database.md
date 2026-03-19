# Database Schema

ฐานข้อมูล: `webdb` (MySQL)

---

## ER Diagram (ความสัมพันธ์)

```
users (1) ──────────< projects (many)
  │                      │
  │                      │
  └──< tasks >───────────┘
  (assigned)    (belongs to project)

tasks (many) >────────< tags (many)
               task_tags
               (junction)
```

---

## ตาราง users

เก็บข้อมูลผู้ใช้งานระบบ

| Column | Type | Null | Default | คำอธิบาย |
|--------|------|------|---------|----------|
| id | INT (PK, AUTO_INCREMENT) | NO | - | รหัสผู้ใช้ |
| firstname | VARCHAR(255) | NO | - | ชื่อ |
| lastname | VARCHAR(255) | NO | - | นามสกุล |
| age | INT | NO | - | อายุ |
| gender | ENUM | NO | - | เพศ: `ชาย`, `หญิง`, `ไม่ระบุ` |
| interests | TEXT | NO | - | ความสนใจ |
| description | TEXT | NO | - | คำอธิบายตัวเอง |

**Cascade:** ลบ user → ลบ projects และ tasks ที่เป็นเจ้าของด้วย

---

## ตาราง projects

เก็บข้อมูลโปรเจกต์ โดยแต่ละโปรเจกต์มีเจ้าของ 1 คน

| Column | Type | Null | Default | คำอธิบาย |
|--------|------|------|---------|----------|
| id | INT (PK, AUTO_INCREMENT) | NO | - | รหัสโปรเจกต์ |
| name | VARCHAR(255) | NO | - | ชื่อโปรเจกต์ |
| description | TEXT | YES | NULL | คำอธิบาย |
| user_id | INT (FK → users.id) | NO | - | เจ้าของโปรเจกต์ |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | วันที่สร้าง |

**Cascade:** ลบ project → ลบ tasks ในโปรเจกต์ด้วย

---

## ตาราง tasks

เก็บข้อมูล task ในแต่ละโปรเจกต์

| Column | Type | Null | Default | คำอธิบาย |
|--------|------|------|---------|----------|
| id | INT (PK, AUTO_INCREMENT) | NO | - | รหัส task |
| title | VARCHAR(255) | NO | - | ชื่อ task |
| description | TEXT | YES | NULL | คำอธิบาย |
| status | ENUM | YES | `todo` | สถานะ: `todo`, `in_progress`, `done` |
| project_id | INT (FK → projects.id) | NO | - | โปรเจกต์ที่ task นี้สังกัด |
| assigned_user_id | INT (FK → users.id) | YES | NULL | ผู้รับผิดชอบ task |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | วันที่สร้าง |

**Cascade:**
- ลบ project → ลบ tasks ใน project
- ลบ user → `assigned_user_id` เป็น NULL (ไม่ลบ task)

---

## ตาราง tags

เก็บ tag สำหรับจัดหมวดหมู่ task

| Column | Type | Null | Default | คำอธิบาย |
|--------|------|------|---------|----------|
| id | INT (PK, AUTO_INCREMENT) | NO | - | รหัส tag |
| name | VARCHAR(100) UNIQUE | NO | - | ชื่อ tag (ห้ามซ้ำ) |

**Tag ที่มีใน seed data:** `bug`, `feature`, `urgent`, `design`

---

## ตาราง task_tags

Junction table สำหรับ Many-to-Many ระหว่าง tasks และ tags

| Column | Type | Null | คำอธิบาย |
|--------|------|------|----------|
| task_id | INT (FK → tasks.id) | NO | รหัส task |
| tag_id | INT (FK → tags.id) | NO | รหัส tag |

> Primary Key = (task_id, tag_id) รวมกัน — แต่ละคู่มีได้แค่ครั้งเดียว

**Cascade:** ลบ task หรือ tag → ลบแถวใน task_tags ด้วย

---

## ความสัมพันธ์สรุป

| จาก | ถึง | ประเภท | Key |
|-----|-----|--------|-----|
| users | projects | One-to-Many | projects.user_id |
| users | tasks | One-to-Many | tasks.assigned_user_id |
| projects | tasks | One-to-Many | tasks.project_id |
| tasks | tags | Many-to-Many | task_tags |
