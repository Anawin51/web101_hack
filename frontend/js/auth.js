// auth.js
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const alertBox = document.getElementById('alert-box');

// ฟังก์ชันแจ้งเตือน
function showAlert(msg, isError = true) {
    alertBox.textContent = msg;
    // เปลี่ยนมาใช้ class ของเราใน style.css
    alertBox.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    setTimeout(() => alertBox.classList.add('hidden'), 3000);
}

// เช็คว่าถ้ามี Session อยู่แล้ว ให้เด้งไปหน้า Dashboard เลย
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await apiFetch('/auth/me');
        window.location.href = 'dashboard.html'; // ล็อกอินอยู่แล้ว ข้ามไปหน้าหลักเลย
    } catch (err) {
        // ยังไม่ล็อกอิน อยู่หน้านี้ต่อ
    }
});

// สลับหน้า Login / Register
document.getElementById('go-to-register').onclick = (e) => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    registerBox.classList.remove('hidden');
};

document.getElementById('go-to-login').onclick = (e) => {
    e.preventDefault();
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
};

// จัดการ Login
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login');

    btn.textContent = 'กำลังเข้าสู่ระบบ...';
    try {
        await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        window.location.href = 'dashboard.html'; // สำเร็จ พาไปหน้าหลัก
    } catch (err) {
        showAlert(err.message);
        btn.textContent = 'เข้าสู่ระบบ';
    }
};

// จัดการ Register
document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        firstname: document.getElementById('reg-firstname').value,
        lastname: document.getElementById('reg-lastname').value,
        phone: document.getElementById('reg-phone').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };
    const btn = document.getElementById('btn-register');

    btn.textContent = 'กำลังสมัคร...';
    try {
        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showAlert('สมัครสำเร็จ! กรุณาเข้าสู่ระบบ', false);
        document.getElementById('go-to-login').click(); // สลับไปหน้าล็อกอิน
    } catch (err) {
        showAlert(err.message);
    } finally {
        btn.textContent = 'สมัครสมาชิก';
    }
};