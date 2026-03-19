// dashboard-customer.js
let currentUser = null;

window.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await apiFetch('/auth/me');
        if (currentUser.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
            return;
        }
        // เปลี่ยนคำทักทายให้ดูเป็นมิตรขึ้น
        document.getElementById('welcome-text').textContent = `สวัสดีคุณ ${currentUser.firstname} 👋`;
        fetchReservations();
        
        // หมายเหตุ: เอา fetchTables() ออกแล้ว เพราะหน้าลูกค้าไม่จำเป็นต้องเห็นแผนผังโต๊ะ 
        // ให้แอดมินเป็นคนจัดการโต๊ะให้ลูกค้าจะสมเหตุสมผลและ UX ดีกว่าครับ
    } catch (err) {
        window.location.href = 'login.html';
    }
});

document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    window.location.href = 'login.html';
});

async function fetchTables() {
    try {
        const tables = await apiFetch('/tables');
        const container = document.getElementById('tables-container');
        document.getElementById('tables-loading').classList.add('hidden');
        container.innerHTML = '';

        tables.forEach(t => {
            const isAvail = t.status === 'available';
            // ป้องกัน XSS เบื้องต้นผ่านการจัดโครงสร้างแบบ Text Content หากข้อมูลมาจาก User แต่เคสนี้มาจาก Admin
            container.innerHTML += `
                <div class="rt-card ${isAvail ? 'rt-available' : 'rt-occupied'}">
                    <h3>${t.table_number}</h3>
                    <p style="font-size: 12px;">${t.capacity} ที่นั่ง</p>
                </div>
            `;
        });
    } catch (err) { console.error(err); }
}

document.getElementById('book-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        reservation_date: document.getElementById('book-date').value,
        reservation_time: document.getElementById('book-time').value,
        guest_count: document.getElementById('book-guests').value
    };
    try {
        await apiFetch('/reservations', { method: 'POST', body: JSON.stringify(data) });
        showAlert('ส่งคำขอจองสำเร็จ รอร้านยืนยัน', false);
        e.target.reset();
        fetchReservations();
    } catch (err) { showAlert(err.message, true); }
});

async function fetchReservations() {
    try {
        const resList = await apiFetch('/reservations');
        const container = document.getElementById('res-list-container');
        container.innerHTML = '';

        if(resList.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px 20px; background: white; border-radius: 10px; border: 1px dashed #cbd5e1;">
                    <i class="fa-regular fa-calendar-xmark" style="font-size: 40px; color: #94a3b8; margin-bottom: 10px;"></i>
                    <p style="color: #64748b; margin: 0;">คุณยังไม่มีประวัติการจองโต๊ะ</p>
                </div>`;
            return;
        }

        const statusMap = {
            'pending': '<span class="badge badge-pending"><i class="fa-regular fa-clock"></i> รอยืนยัน</span>',
            'confirmed': '<span class="badge badge-confirmed"><i class="fa-solid fa-check"></i> อนุมัติแล้ว</span>',
            'rejected': '<span class="badge badge-rejected"><i class="fa-solid fa-xmark"></i> ปฏิเสธ</span>',
            'completed': '<span class="badge badge-completed"><i class="fa-solid fa-flag-checkered"></i> ทานเสร็จสิ้น</span>'
        };

        resList.forEach(r => {
            const dateStr = new Date(r.reservation_date).toLocaleDateString('th-TH', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            });
            
            // ใช้ Template แบบ Card แทน
            container.innerHTML += `
                <div class="res-card">
                    <div class="res-info">
                        <h4><i class="fa-regular fa-calendar" style="color:#3b82f6;"></i> ${dateStr}</h4>
                        <p><i class="fa-regular fa-clock"></i> เวลา: ${r.reservation_time} น. | <i class="fa-solid fa-user-group"></i> ${r.guest_count} ท่าน</p>
                    </div>
                    <div class="res-status">
                        ${statusMap[r.status] || r.status}
                        <div style="font-size: 13px; margin-top: 5px; color: #475569;">
                            โต๊ะที่ได้: <strong style="color: #2563eb;">${r.table_number || 'รอจัดโต๊ะ'}</strong>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) { console.error(err); }
}