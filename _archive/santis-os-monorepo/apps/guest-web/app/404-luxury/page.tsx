import React from 'react';
import styles from './404.module.css';

export default function Luxury404Page() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Bölgeye Erişim Yok</h1>
        <p className={styles.message}>
          Özel Santis Club bağlantınız veya otel erişim anahtarınız geçersiz. Lütfen Concierge ekibiyle iletişime geçin.
        </p>
        <a href="https://santis.app" className={styles.link}>
          Santis OS Ana Ekranına Dön
        </a>
      </div>
    </main>
  );
}
