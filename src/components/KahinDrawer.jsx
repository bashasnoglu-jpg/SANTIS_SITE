import React, { useState, useEffect } from 'react';
import './KahinDrawer.css';
import SantisViteConcierge from './SantisViteConcierge';

const KahinDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Kullanıcının nereden geldiğini tutacağımız yeni state
  const [serviceContext, setServiceContext] = useState(null);

  useEffect(() => {
    // handleOpen artık event objesini (e) yakalıyor
    const handleOpen = (e) => {
      setIsOpen(true);
      // Eğer event içinde 'detail' verisi varsa (örneğin hizmet adı), bunu state'e kaydediyoruz
      if (e.detail) {
        setServiceContext(e.detail);
      } else {
        // Eğer detay yoksa (genel menüden tıklandıysa) sıfırla
        setServiceContext(null);
      }
    };
    
    const handleClose = () => {
      setIsOpen(false);
      // İsteğe bağlı: Kapanınca bağlamı sıfırlayabilirsiniz
      // setServiceContext(null); 
    };

    window.addEventListener('santis:open-kahin', handleOpen);
    window.addEventListener('santis:close-kahin', handleClose);

    return () => {
      window.removeEventListener('santis:open-kahin', handleOpen);
      window.removeEventListener('santis:close-kahin', handleClose);
    };
  }, []);

  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      <div 
        className={`santis-drawer-overlay ${isOpen ? 'open' : ''}`} 
        onClick={closeDrawer}
      ></div>

      <div 
        className={`santis-drawer-content ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()} 
      >
        <button className="santis-drawer-close-btn" onClick={closeDrawer}>
          ✕
        </button>
        
        <div className="santis-drawer-body">
          {/* Zeka modülüne kullanıcının ilgilendiği veriyi (serviceContext) iletiyoruz */}
          <SantisViteConcierge contextData={serviceContext} />
        </div>
      </div>
    </>
  );
};

export default KahinDrawer;
