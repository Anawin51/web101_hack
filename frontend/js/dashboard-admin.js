// dashboard-admin.js
let currentUser = null;

window.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await apiFetch('/auth/me');
        // หากไม่ใช่แอดมิน ดีดกลับไปหน้าลูกค้า
        if (currentUser.role !== 'admin') {
            window.location.href = 'customer-dashboard.html';
            return;
        }
        document.getElementById('nav-username').textContent = `ผู้จัดการ: ${currentUser.firstname}`;
        
        fetchDashboardStats();
        fetchTables();
        fetchReservations();
    } catch (err) {
        window.location.href = 'login.html';
    }
});

document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    window.location.href = 'login.html';
});

// ฟังก์ชันดึงสถิติ Dashboard สำหรับแอดมิน
async function fetchDashboardStats() {
    try {
        const stats = await apiFetch('/admin/dashboard');
        document.getElementById('stat-users').textContent = stats.users.total_customers;
        document.getElementById('stat-pending').textContent = stats.reservations.pending;
        document.getElementById('stat-tables-avail').textContent = stats.tables.available;
        document.getElementById('stat-tables-occ').textContent = stats.tables.occupied;
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

async function fetchTables() {
    try {
        const tables = await apiFetch('/tables');
        const container = document.getElementById('tables-container');
        document.getElementById('tables-loading').classList.add('hidden');
        container.innerHTML = '';

        tables.forEach(t => {
            const isAvail = t.status === 'available';
            container.innerHTML += `
                <div class="rt-card ${isAvail ? 'rt-available' : 'rt-occupied'}">
                    <h3>${t.table_number}</h3>
                    <p style="font-size: 12px;">${t.capacity} ที่นั่ง</p>
                </div>
            `;
        });
    } catch (err) { console.error(err); }
}

async function fetchReservations() {
    try {
        const resList = await apiFetch('/reservations');
        const tbody = document.getElementById('res-tbody');
        tbody.innerHTML = '';

        if(resList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">ไม่มีรายการจอง</td></tr>';
            return;
        }

        const statusMap = {
            'pending': '<span class="badge badge-pending">รอยืนยัน</span>',
            'confirmed': '<span class="badge badge-confirmed">อนุมัติแล้ว</span>',
            'rejected': '<span class="badge badge-rejected">ปฏิเสธ</span>',
            'completed': '<span class="badge badge-completed">เสร็จสิ้น</span>'
        };

        resList.forEach(r => {
            const dateStr = new Date(r.reservation_date).toLocaleDateString('th-TH');
            
            // ปุ่มจัดการ
            let adminBtns = '<span class="text-muted">-</span>';
            if (r.status === 'pending') {
                adminBtns = `
                    <button onclick="updateRes(${r.id}, 'confirmed')" class="btn btn-success btn-small" style="margin-bottom: 4px;">รับจอง</button>
                    <button onclick="updateRes(${r.id}, 'rejected')" class="btn btn-danger btn-small">ปฏิเสธ</button>
                `;
            } else if (r.status === 'confirmed') {
                adminBtns = `<button onclick="updateRes(${r.id}, 'completed', ${r.table_id})" class="btn btn-primary btn-small">คืนโต๊ะ</button>`;
            }

            // ใช้การ Escape ข้อมูลพื้นฐานเพื่อป้องกัน XSS
            const safeName = r.firstname.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            tbody.innerHTML += `
                <tr>
                    <td>${dateStr} <br><span style="font-size:12px; color:gray;">${r.reservation_time}</span></td>
                    <td>${safeName}</td>
                    <td class="text-center">${r.guest_count}</td>
                    <td class="text-center">${statusMap[r.status] || r.status} <br><small class="text-muted">(${r.table_number || 'ยังไม่มีโต๊ะ'})</small></td>
                    <td class="text-center">${adminBtns}</td>
                </tr>
            `;
        });
    } catch (err) { console.error(err); }
}

// อัปเดตสถานะ (เปลี่ยนเป็น Global ฟังก์ชันเพื่อให้ onclick ใน HTML เรียกใช้ได้)
window.updateRes = async (id, status, existingTableId = null) => {
    let tableId = existingTableId; 

    if (status === 'confirmed') {
        const input = prompt("ระบุ ID ของโต๊ะที่จะจัดให้ลูกค้า (เช่น 1, 2, 3):");
        if (!input) return; // กดยกเลิก
        tableId = parseInt(input);
    }
    
    try {
        await apiFetch(`/reservations/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, table_id: tableId })
        });
        showAlert('อัปเดตสถานะสำเร็จ!', false);
        fetchReservations();
        fetchTables();
        fetchDashboardStats(); // อัปเดตสถิติหลังทำรายการ
    } catch (err) { 
        showAlert(err.message, true); 
    }
};