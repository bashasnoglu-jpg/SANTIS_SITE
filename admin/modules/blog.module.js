/**
 * SANTIS OS — Blog Module v1.0
 * Blog CRUD, table rendering.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    var editingBlogId = null;
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    window.initBlog = function () {
        if (typeof blogCatalog !== 'undefined') {
            localBlog = [].concat(blogCatalog);
            renderBlogTable();
        }
    };

    window.renderBlogTable = function () {
        var tbody = document.getElementById('blog-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        localBlog.forEach(function (p) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><img src="../assets/img/blog/' + p.img + '" width="40" data-fallback-src="https://placehold.co/40"></td>' +
                '<td><strong>' + p.title + '</strong></td>' +
                '<td>' + p.category + '</td>' +
                '<td>' + p.date + '</td>' +
                '<td>' +
                '<button class="btn-os sm" data-action="blog-edit" data-id="' + escapeAttr(p.id) + '">✏️</button>' +
                '<button class="btn-os sm danger" data-action="blog-delete" data-id="' + escapeAttr(p.id) + '">🗑️</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    };

    window.openBlogModal = function () {
        editingBlogId = null;
        var modal = document.getElementById('blog-modal');
        if (modal) modal.classList.add('active');
        document.querySelectorAll('#blog-modal input, #blog-modal textarea').forEach(function (e) { e.value = ''; });
    };

    window.closeBlogModal = function () {
        var modal = document.getElementById('blog-modal');
        if (modal) modal.classList.remove('active');
    };

    window.saveBlog = function () {
        var data = {
            title: document.getElementById('blog-title').value,
            category: document.getElementById('blog-cat').value,
            date: document.getElementById('blog-date').value,
            img: (document.getElementById('blog-img') || {}).value || '',
            summary: document.getElementById('blog-summary').value,
            content: document.getElementById('blog-content').value
        };

        if (editingBlogId) {
            var idx = localBlog.findIndex(function (p) { return p.id == editingBlogId; });
            if (idx > -1) localBlog[idx] = Object.assign({}, localBlog[idx], data);
        } else {
            var newId = localBlog.length > 0 ? Math.max.apply(null, localBlog.map(function (p) { return p.id; })) + 1 : 1;
            localBlog.push(Object.assign({ id: newId }, data));
        }

        renderBlogTable();
        closeBlogModal();
        saveToServer("assets/js/blog-data.js", localBlog, "blogCatalog");
    };

    window.editBlog = function (id) {
        editingBlogId = id;
        var p = localBlog.find(function (i) { return i.id == id; });
        if (p) {
            openBlogModal();
            document.getElementById('blog-title').value = p.title;
            document.getElementById('blog-cat').value = p.category;
            document.getElementById('blog-date').value = p.date;
            document.getElementById('blog-summary').value = p.summary;
            document.getElementById('blog-content').value = p.content;
        }
    };

    window.deleteBlog = function (id) {
        if (confirm("Silmek istiyor musunuz?")) {
            localBlog = localBlog.filter(function (p) { return p.id != id; });
            renderBlogTable();
            saveToServer("assets/js/blog-data.js", localBlog, "blogCatalog");
        }
    };

    console.log('📝 [Module] Blog v1.0 loaded');
})();
