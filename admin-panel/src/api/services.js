import axios from 'axios';

// Kendi yetkilendirilmiş (Bearer token vs) axios instance'ımız var, ama örnekteki gibi kullanmak için:
// Eğer api/axios.js kullanıyorsak onu çağırabiliriz. Dosya yapısındaki tutarlılık için api/axios.js'i import edelim:
import api from './axios';

export const ServiceAPI = {
    // 🖼️ Görsel Yükleme Endpoint'i (Progress Bar Destekli)
    uploadMedia: async (file, onUploadProgress) => {
        // Backend (server.js) multipart/form-data yerine JSON ({ filename, contentBase64 }) bekliyor
        const toBase64 = (f) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const base64Str = await toBase64(file);
        const payload = {
            filename: file.name,
            contentBase64: base64Str
        };

        const res = await api.post('/media/upload', payload, {
            headers: { "Content-Type": "application/json" },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onUploadProgress) onUploadProgress(percentCompleted);
            }
        });
        return res.data; // { success: true, message: '...' }
    },

    // ⚡ CRUD İşlemleri (Backend'de SQLite'a yazar ve SSE MUTATION fırlatır)
    getAll: async () => api.get('/services').then(r => r.data),
    create: async (data) => api.post('/services', data).then(r => r.data),
    update: async (id, data) => api.patch(`/services/${id}`, data).then(r => r.data),
    delete: async (id) => api.delete(`/services/${id}`).then(r => r.data)
};
