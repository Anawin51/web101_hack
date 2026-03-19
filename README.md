# web101 — Task Management System

ระบบจัดการโปรเจกต์และ Task สำหรับทีม สร้างด้วย Node.js + Express + MySQL ฝั่ง Backend และ HTML/CSS/JS ฝั่ง Frontend

---

## โครงสร้างโปรเจกต์

```
web101/
├── database/          SQL schema และ seed data
├── frontend/          หน้าเว็บ (Vanilla HTML/CSS/JS)
└── server/            REST API (Node.js + Express)
```

---

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|------|-----------|
| Backend | Node.js, Express 4 |
| Database | MySQL (via mysql2) |
| Frontend | HTML, CSS, Vanilla JS |
| Font | Kanit (Google Fonts) |
| Dev tool | nodemon |

---

## การติดตั้งและรัน

### 1. เตรียมฐานข้อมูล

รัน Docker สำหรับ MySQL:

```bash
cd server
docker-compose up -d
```

จากนั้น import schema และ seed data:

```bash
mysql -h 127.0.0.1 -P 8820 -u root -proot webdb < database/schema.sql
```

### 2. ตั้งค่า Environment

```bash
cd server
cp .env.example .env
```

แก้ไขค่าใน `.env` ให้ตรงกับ environment ของคุณ:

```env
DB_HOST=localhost
DB_PORT=8820
DB_USER=root
DB_PASS=root
DB_NAME=webdb
PORT=8000
```

### 3. ติดตั้ง Dependencies

```bash
cd server
npm install
```

### 4. รัน Server

```bash
cd server
node index.js
```

Server จะรันที่ `http://localhost:8000`

### 5. เปิด Frontend

เปิดไฟล์ `frontend/index.html` ผ่าน browser หรือใช้ Live Server extension

---

## API Endpoints สรุป

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | /users | ดูผู้ใช้ทั้งหมด |
| POST | /users | สร้างผู้ใช้ใหม่ |
| GET | /projects | ดูโปรเจกต์ทั้งหมด |
| POST | /projects | สร้างโปรเจกต์ใหม่ |
| GET | /tasks | ดู task ทั้งหมด |
| POST | /tasks | สร้าง task ใหม่ |
| POST | /tasks/:id/tags | เพิ่ม tag ให้ task |

ดู API Docs เพิ่มเติมได้ที่ [docs/api.md](docs/api.md)

---

## เอกสารเพิ่มเติม

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Code Guide](docs/code-guide.md)
