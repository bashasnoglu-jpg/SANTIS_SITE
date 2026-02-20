/* --- PREVIEW SYSTEM (ULTRA FINE TUNING) --- */

function openPreviewModal(mediaUrl, type) {
    // Create or Get Modal
    let modal = document.getElementById('preview-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10001'; // Top level
        modal.onclick = (e) => { if (e.target === modal) closePreviewModal(); };
        document.body.appendChild(modal);
    }

    const contentHtml = type === 'reel'
        ? `<video src="../assets/img/social/${mediaUrl}" controls autoplay style="max-height:85vh; max-width:90vw; border-radius:8px; box-shadow:0 0 50px rgba(0,0,0,0.8);"></video>`
        : `<img src="../assets/img/social/${mediaUrl}" style="max-height:85vh; max-width:90vw; border-radius:8px; box-shadow:0 0 50px rgba(0,0,0,0.8);">`;

    modal.innerHTML = `
        <div style="position:relative;">
            ${contentHtml}
            <button data-action="preview-close" style="position:absolute; top:-40px; right:0; background:none; border:none; color:white; font-size:30px; cursor:pointer;">&times;</button>
        </div>
    `;

    const closeBtn = modal.querySelector('[data-action="preview-close"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            closePreviewModal();
        });
    }

    modal.classList.add('active');
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.innerHTML = ''; // Stop video
    }
}

// Update Grid Renderer to use Preview
// (Modifying renderSocialGrid to add onclick event)
/*
    OLD: div.innerHTML = `... ${mediaHtml} ...`
    NEW: div.onclick = () => openPreviewModal(post.content.media, post.type);
*/
