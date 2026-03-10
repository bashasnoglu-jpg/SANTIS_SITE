import React, { useState } from 'react';
import ServiceImageUpload from '../components/ServiceImageUpload';
import { ServiceAPI } from '../api/services';

export default function ServiceManager() {
    const [formData, setFormData] = useState({
        title: '',
        category: 'asian',
        price_eur: '',
        duration: '60 Min',
        is_signature: false,
        image: '' // Uploader burayı dolduracak
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image) return alert("Lütfen önce bir ritüel görseli yükleyin!");

        setIsSaving(true);
        try {
            // 1. Backend'e Veriyi Yolla (Veritabanına yazar)
            await ServiceAPI.create(formData);

            // 2. MÜJDE! Backend bu veriyi kaydettiği an, FastAPI'deki EventSource
            // tüm açık frontend tarayıcılarına SSE "MUTATION: ADD" eventini fırlatacak.
            // Ziyaretçilerin V10 Motoru o an 0-GC hızıyla bu yeni ritüeli ekrana çizecek!

            alert("✅ Sovereign Ritüel Mühürlendi! Kuantum Ağda Anında Güncellendi.");

            // Formu temizle
            setFormData({ title: '', category: 'asian', price_eur: '', duration: '60 Min', is_signature: false, image: '' });
        } catch (err) {
            console.error(err);
            alert("❌ Sisteme kaydedilirken hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-[#080808] border border-gray-800 rounded-2xl shadow-2xl text-white mt-10">
            <h1 className="text-3xl font-serif mb-8 text-[#D4AF37] tracking-widest uppercase border-b border-gray-800 pb-4">
                Yeni Ritüel Yarat
            </h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Sol Taraf: Görsel Upload */}
                <div>
                    <ServiceImageUpload
                        currentImage={formData.image}
                        onImageUploaded={(path) => setFormData({ ...formData, image: path })}
                    />
                </div>

                {/* Sağ Taraf: Ritüel Verileri */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Ritüel Adı</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition"
                            placeholder="Örn: Royal Bali Masajı" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Kategori (Rail)</label>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none transition">
                            <option value="asian">Asya Ritüelleri</option>
                            <option value="classical">Klasik Medikal</option>
                            <option value="specialty">Signature & Çift</option>
                            <option value="hammam">Hamam Terapileri</option>
                            <option value="skincare">Cilt Bakımı</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Fiyat (€)</label>
                            <input type="number" required min="0" value={formData.price_eur} onChange={e => setFormData({ ...formData, price_eur: Number(e.target.value) })}
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Süre</label>
                            <input type="text" required value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none transition"
                                placeholder="60 Min" />
                        </div>
                    </div>

                    <label className="flex items-center space-x-3 cursor-pointer pt-2 bg-gray-900 p-4 rounded border border-gray-800">
                        <input type="checkbox" checked={formData.is_signature} onChange={e => setFormData({ ...formData, is_signature: e.target.checked })}
                            className="w-5 h-5 accent-[#D4AF37] bg-black border-gray-700 rounded" />
                        <span className="text-gray-300 font-serif text-lg tracking-wide">Sovereign Signature Ritüeli</span>
                    </label>

                    <button type="submit" disabled={isSaving || !formData.image}
                        className="w-full py-4 mt-6 bg-gradient-to-r from-[#D4AF37] to-[#b5952f] text-black font-bold tracking-[0.2em] uppercase rounded-lg shadow-lg hover:shadow-[#D4AF37]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]">
                        {isSaving ? 'Mühürleniyor...' : 'SİSTEME MÜHÜRLE VE YAYINLA'}
                    </button>
                </div>
            </form>
        </div>
    );
}
