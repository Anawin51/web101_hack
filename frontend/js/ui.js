function showAlert(msg, isError = true) {
    const alertBox = document.getElementById('alert-box');
    if (!alertBox) return; // ป้องกัน Error ถ้าหน้านั้นไม่มี alert-box
    
    alertBox.textContent = msg;
    alertBox.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    
    // แสดงผล
    alertBox.classList.remove('hidden');
    
    // ซ่อนอัตโนมัติหลัง 3 วินาที
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 3000);
}