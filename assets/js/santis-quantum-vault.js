// santis-quantum-vault.js
// Çevrimdışı randevuları saklayan yerel IndexedDB Karargâhı

export const QuantumVault = {
  dbName: 'SovereignOS',
  storeName: 'offlineBookings',

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Kasa Açılamadı!');
    });
  },

  async saveBooking(bookingData) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.add({ ...bookingData, storedAt: Date.now() });
      
      tx.oncomplete = () => resolve('Mühürlendi!');
      tx.onerror = () => reject('Kayıt Hatası!');
    });
  }
};
