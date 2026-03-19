// auth-login.js

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await apiFetch('/auth/me');
        // ถ้าล็อกอินอยู่แล้ว ให้ไปหน้า Dashboard ตาม Role
        window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
    } catch (err) {
        // ยังไม่ล็อกอิน อยู่หน้านี้ต่อ
    }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login');

    btn.textContent = 'กำลังเข้าสู่ระบบ...';
    try {
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // เช็ค Role จาก Response แล้วพาไปหน้าที่ถูกต้อง
        if (res.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'customer-dashboard.html';
        }
    } catch (err) {
        showAlert(err.message, true);
        btn.textContent = 'เข้าสู่ระบบ';
    }
});