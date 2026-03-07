var _auditBtn = document.getElementById('run-audit');
if (_auditBtn) {
    _auditBtn.addEventListener('click', async () => {
        const status = document.getElementById('auditStatus');
        if (!status) return;
        status.textContent = 'Tarama baslatiliyor...';

        try {
            const response = await fetch('/admin/run-audit', { method: 'POST' });
            const data = await response.json();
            if (data && (data.report || data.status === 'success')) {
                status.textContent = 'Tamamlandi. Rapor indiriliyor...';
                window.location.href = '/admin/download-report';
            } else {
                status.textContent = 'Hata: ' + (data && data.detail ? data.detail : 'Bilinmeyen');
            }
        } catch (err) {
            status.textContent = 'Hata: ' + err;
        }
    });
}
