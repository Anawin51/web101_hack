// api.js
const API_URL = 'http://127.0.0.1:3000/api';

// ฟังก์ชันหลักสำหรับเรียก API ทุกเส้น
async function apiFetch(endpoint, options = {}) {
    options.credentials = 'include'; // บังคับส่ง Cookie ไปด้วยเสมอ
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
        }
        return data;
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (เช็คว่า Backend รันอยู่หรือไม่)');
        }
        throw error;
    }
}