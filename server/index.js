const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session'); // เรียกใช้งาน Session

const app = express();


// 0. CORS & Body Parser
app.use(cors({
    origin: 'http://127.0.0.1:5500', // เปลี่ยนตรงนี้ให้เป๊ะทุกตัวอักษร!
    credentials: true 
}));
app.use(express.json());


// 1. Session Middleware (ตั้งค่าระบบ Cookie)
app.use(session({
    secret: process.env.JWT_SECRET || 'my_super_secret_session_key', // ใช้เป็น secret ของ session แทน
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // ถ้าอัปขึ้น Server จริงที่เป็น HTTPS ให้เปลี่ยนเป็น true
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 * 24 // อายุ Session 1 วัน
    }
}));


// 2. Database Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,   // ← เพิ่มบรรทัดนี้
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'restaurant_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// 3. Middlewares (Auth & Role Control)
// เช็คว่าเข้าสู่ระบบ (มี Session) หรือยัง
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Access Denied. Please login first." });
    }
    req.user = req.session.user; // ส่งต่อข้อมูล user ให้ route ถัดไปใช้งานได้เหมือนเดิม
    next();
};

// เช็คว่าเป็น Admin หรือไม่
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden. Admin access required." });
    }
    next();
};


// 4. Auth Routes
// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstname, lastname, email, phone, password } = req.body;
        if (!firstname || !email || !password) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        // Check if email exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (firstname, lastname, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
            [firstname, lastname, email, phone, hashedPassword]
        );
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login (ใช้ Session แล้ว)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) return res.status(400).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

        // สร้าง Session เก็บข้อมูลผู้ใช้
        req.session.user = {
            id: user.id,
            role: user.role
        };
        
        res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Logout (เคลียร์ Session ทิ้ง)
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "ไม่สามารถออกจากระบบได้" });
        res.clearCookie('connect.sid'); // ลบ Cookie ออกจากเบราว์เซอร์
        res.status(200).json({ message: "ออกจากระบบเรียบร้อย" });
    });
});

// ดึงข้อมูลโปรไฟล์ (ใช้ตอนรีเฟรชหน้าเว็บ เพื่อเช็คว่าใครล็อกอินอยู่)
app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, firstname, lastname, email, phone, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
        res.status(200).json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// 5. Tables Routes
// ดูรายการโต๊ะทั้งหมด (ทุกคนดูได้)
app.get('/api/tables', async (req, res) => {
    try {
        const [tables] = await db.query('SELECT * FROM tables');
        res.status(200).json(tables);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});


// 6. Reservations Routes
// ลูกค้าสร้างการจองใหม่ (แก้ verifyToken เป็น requireAuth)
app.post('/api/reservations', requireAuth, async (req, res) => {
    try {
        const { reservation_date, reservation_time, guest_count } = req.body;
        const user_id = req.user.id;

        if (!reservation_date || !reservation_time || !guest_count) {
            return res.status(400).json({ error: "กรุณาระบุวัน เวลา และจำนวนคนให้ครบ" });
        }

        await db.query(
            'INSERT INTO reservations (user_id, reservation_date, reservation_time, guest_count, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, reservation_date, reservation_time, guest_count, 'pending']
        );
        res.status(201).json({ message: "ส่งคำขอจองโต๊ะเรียบร้อยแล้ว รอทางร้านยืนยัน" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ดูรายการจอง (แอดมินเห็นทั้งหมด, ลูกค้าเห็นแค่ของตัวเอง)
app.get('/api/reservations', requireAuth, async (req, res) => {
    try {
        let query = `
            SELECT r.*, u.firstname, u.phone, t.table_number 
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN tables t ON r.table_id = t.id
        `;
        let params = [];

        // ถ้าไม่ใช่ admin ให้กรองเอาเฉพาะ user_id ของตัวเอง
        if (req.user.role !== 'admin') {
            query += ' WHERE r.user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC';

        const [reservations] = await db.query(query, params);
        res.status(200).json(reservations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// แอดมินกดยืนยัน/ปฏิเสธการจอง และจัดโต๊ะให้ (พร้อมอัปเดตสถานะโต๊ะ)
app.put('/api/reservations/:id/status', requireAuth, requireAdmin, async (req, res) => {
    const connection = await db.getConnection(); // ใช้ Transaction
    try {
        await connection.beginTransaction();

        const reservationId = req.params.id;
        const { status, table_id } = req.body; // status: 'confirmed', 'rejected', 'completed'

        if (!status) {
            return res.status(400).json({ error: "กรุณาระบุสถานะ" });
        }

        // อัปเดตการจอง
        await connection.query(
            'UPDATE reservations SET status = ?, table_id = ? WHERE id = ?',
            [status, table_id || null, reservationId]
        );

        // ถ้าสถานะคือ confirmed และมีการจ่ายโต๊ะ ให้ล็อกโต๊ะนั้นเป็น occupied
        if (status === 'confirmed' && table_id) {
            await connection.query('UPDATE tables SET status = "occupied" WHERE id = ?', [table_id]);
        }
        // ถ้า status คือ completed หรือ cancelled ให้คืนโต๊ะเป็น available
        else if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
            if (table_id) {
                await connection.query('UPDATE tables SET status = "available" WHERE id = ?', [table_id]);
            }
        }

        await connection.commit();
        res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection.release();
    }
});

// 7. Admin Delete Routes
// ลบการจอง
app.delete('/api/reservations/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบการจองนี้" });
        res.status(200).json({ message: "ลบการจองเรียบร้อย" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ลบโต๊ะ
app.delete('/api/tables/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM tables WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบโต๊ะนี้" });
        res.status(200).json({ message: "ลบโต๊ะเรียบร้อย" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ลบ user
app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        // ป้องกัน admin ลบตัวเอง
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" });
        }
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบ user นี้" });
        res.status(200).json({ message: "ลบ user เรียบร้อย" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// 8. Admin - Users Management
// ดู Users ทั้งหมด
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, firstname, lastname, email, phone, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// แก้ Role ของ User
app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;

        if (!['admin', 'customer'].includes(role)) {
            return res.status(400).json({ error: "Role ต้องเป็น 'admin' หรือ 'customer' เท่านั้น" });
        }
        // ป้องกัน admin แก้ role ตัวเอง
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: "ไม่สามารถแก้ role ของตัวเองได้" });
        }

        const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบ user นี้" });
        res.status(200).json({ message: `อัปเดต role เป็น '${role}' เรียบร้อย` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// 9. Admin - Tables Management
// เพิ่มโต๊ะใหม่
app.post('/api/admin/tables', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { table_number, capacity } = req.body;

        if (!table_number || !capacity) {
            return res.status(400).json({ error: "กรุณาระบุหมายเลขโต๊ะและความจุ" });
        }

        const [existing] = await db.query('SELECT * FROM tables WHERE table_number = ?', [table_number]);
        if (existing.length > 0) return res.status(400).json({ error: "หมายเลขโต๊ะนี้มีอยู่แล้ว" });

        await db.query(
            'INSERT INTO tables (table_number, capacity, status) VALUES (?, ?, ?)',
            [table_number, capacity, 'available']
        );
        res.status(201).json({ message: "เพิ่มโต๊ะสำเร็จ" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// แก้ไขโต๊ะ (หมายเลข / ความจุ / สถานะ)
app.put('/api/admin/tables/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { table_number, capacity, status } = req.body;

        if (!table_number && !capacity && !status) {
            return res.status(400).json({ error: "กรุณาระบุข้อมูลที่ต้องการแก้ไข" });
        }
        if (status && !['available', 'occupied'].includes(status)) {
            return res.status(400).json({ error: "Status ต้องเป็น 'available' หรือ 'occupied'" });
        }

        // Build dynamic query เฉพาะ field ที่ส่งมา
        const fields = [];
        const values = [];
        if (table_number) { fields.push('table_number = ?'); values.push(table_number); }
        if (capacity)     { fields.push('capacity = ?');     values.push(capacity); }
        if (status)       { fields.push('status = ?');       values.push(status); }
        values.push(req.params.id);

        const [result] = await db.query(
            `UPDATE tables SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบโต๊ะนี้" });
        res.status(200).json({ message: "แก้ไขโต๊ะเรียบร้อย" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// 10. Admin - Dashboard
app.get('/api/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [[{ total_users }]]        = await db.query("SELECT COUNT(*) AS total_users FROM users WHERE role = 'customer'");
        const [[{ total_reservations }]] = await db.query("SELECT COUNT(*) AS total_reservations FROM reservations");
        const [[{ pending }]]            = await db.query("SELECT COUNT(*) AS pending FROM reservations WHERE status = 'pending'");
        const [[{ confirmed }]]          = await db.query("SELECT COUNT(*) AS confirmed FROM reservations WHERE status = 'confirmed'");
        const [[{ completed }]]          = await db.query("SELECT COUNT(*) AS completed FROM reservations WHERE status = 'completed'");
        const [[{ rejected }]]           = await db.query("SELECT COUNT(*) AS rejected FROM reservations WHERE status = 'rejected'");
        const [[{ total_tables }]]       = await db.query("SELECT COUNT(*) AS total_tables FROM tables");
        const [[{ available_tables }]]   = await db.query("SELECT COUNT(*) AS available_tables FROM tables WHERE status = 'available'");

        res.status(200).json({
            users: { total_customers: total_users },
            reservations: { total: total_reservations, pending, confirmed, completed, rejected },
            tables: { total: total_tables, available: available_tables, occupied: total_tables - available_tables }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});