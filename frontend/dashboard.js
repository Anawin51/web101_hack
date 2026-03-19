let currentUser = null;

function showAlert(msg, isError = true) {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = msg;
    alertBox.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    setTimeout(() => alertBox.classList.add('hidden'), 3000);
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await apiFetch('/auth/me');
        document.getElementById('nav-username').textContent = `👤 ${currentUser.firstname}`;
        if (currentUser.role === 'admin') {
            document.getElementById('role-badge').textContent = '(แอดมิน)';
            document.getElementById('th-action').classList.remove('hidden');
        } else {
            document.getElementById('role-badge').textContent = '(ประวัติของคุณ)';
        }
        fetchTables();
        fetchReservations();
    } catch (err) {
        window.location.href = 'index.html';
    }
});

document.getElementById('btn-logout').onclick = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
};

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
    } catch (err) { console.error('Error tables:', err); }
}

document.getElementById('book-form').onsubmit = async (e) => {
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
    } catch (err) { showAlert(err.message); }
};

async function fetchReservations() {
    try {
        const resList = await apiFetch('/reservations');
        const tbody = document.getElementById('res-tbody');
        tbody.innerHTML = '';

        if(resList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">ไม่มีประวัติการจอง</td></tr>';
            return;
        }

        resList.forEach(r => {
            const dateStr = new Date(r.reservation_date).toLocaleDateString('th-TH');
            const statusMap = {
                'pending': '<span class="badge badge-pending">รอยืนยัน</span>',
                'confirmed': '<span class="badge badge-confirmed">อนุมัติแล้ว</span>',
                'rejected': '<span class="badge badge-rejected">ปฏิเสธ</span>',
                'completed': '<span class="badge badge-completed">เสร็จสิ้น</span>'
            };

            let adminBtns = '-';
            if (currentUser.role === 'admin') {
                if (r.status === 'pending') {
                    adminBtns = `
                        <button onclick="updateRes(${r.id}, 'confirmed')" class="btn btn-success btn-small" style="margin-bottom: 4px;">รับจอง</button>
                        <button onclick="updateRes(${r.id}, 'rejected')" class="btn btn-danger btn-small">ปฏิเสธ</button>
                    `;
                } else if (r.status === 'confirmed') {
                    // ✨ แก้ไข: ส่ง r.table_id เข้าไปด้วยตอนกดคืนโต๊ะ
                    adminBtns = `<button onclick="updateRes(${r.id}, 'completed', ${r.table_id})" class="btn btn-primary btn-small">คืนโต๊ะ</button>`;
                }
            }

            tbody.innerHTML += `
                <tr>
                    <td>${dateStr} <br><span style="font-size:12px; color:gray;">${r.reservation_time}</span></td>
                    <td>${r.firstname}</td>
                    <td class="text-center">${r.guest_count}</td>
                    <td class="text-center font-bold" style="color:#2563eb;">${r.table_number || '-'}</td>
                    <td class="text-center">${statusMap[r.status] || r.status}</td>
                    ${currentUser.role === 'admin' ? `<td class="text-center">${adminBtns}</td>` : ''}
                </tr>
            `;
        });
    } catch (err) { console.error('Error fetching reservations:', err); }
}

// ✨ แก้ไข: เพิ่ม parameter ที่ 3 (existingTableId) มารับค่าโต๊ะเดิม
window.updateRes = async (id, status, existingTableId = null) => {
    let tableId = existingTableId; 

    if (status === 'confirmed') {
        const input = prompt("ใส่ ID โต๊ะที่ต้องการจัดให้ลูกค้า (เช่น โต๊ะ A1 ใส่เลข 1):");
        if (!input) return;
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
    } catch (err) { showAlert(err.message); }
};