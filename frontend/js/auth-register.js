// auth-register.js

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await apiFetch('/auth/me');
        window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
    } catch (err) {
        // ยังไม่ล็อกอิน อยู่หน้านี้ต่อ
    }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
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
        // สมัครสำเร็จ พาไปหน้า Login
        alert('สมัครสำเร็จ! กรุณาเข้าสู่ระบบ'); // ใช้ alert ธรรมดากันการเปลี่ยนหน้าเร็วเกินไป
        window.location.href = 'login.html';
    } catch (err) {
        showAlert(err.message, true);
        btn.textContent = 'ยืนยันการสมัคร';
    }
});