/**
 * SANTIS OS - PHASE 18: WALLET PASS GENERATOR
 * Architecture: Apple PKPass Streaming & Cryptographic Signature
 */
const { PKPass } = require('passkit-generator');
const fs = require('fs');
const path = require('path');

// Apple Developer Portal'dan alınan gizli sertifikalar (.env ile korunmalı)
const CERTS_DIR = path.join(__dirname, '../certs/apple');

const WalletEngine = {
  async generateApplePass(reservationData) {
    try {
      // 1. Bilet Taslağını Başlat (Event Ticket Formatı)
      const pass = new PKPass({
        'pass.json': fs.readFileSync(path.join(__dirname, '../templates/pass.json')),
      }, {
        wwdr: fs.readFileSync(path.join(CERTS_DIR, 'wwdr.pem')),
        signerCert: fs.readFileSync(path.join(CERTS_DIR, 'signerCert.pem')),
        signerKey: fs.readFileSync(path.join(CERTS_DIR, 'signerKey.pem')),
        signerKeyPassphrase: process.env.SANTIS_SIGNER_PASSPHRASE,
      });

      // 2. Santis DNA'sı (Görseller ve Renkler)
      pass.addBuffer('icon.png', fs.readFileSync(path.join(__dirname, '../assets/pass/icon.png')));
      pass.addBuffer('icon@2x.png', fs.readFileSync(path.join(__dirname, '../assets/pass/icon@2x.png')));
      pass.addBuffer('logo.png', fs.readFileSync(path.join(__dirname, '../assets/pass/logo.png')));
      
      // Quiet Luxury Renk Paleti
      pass.backgroundColor = 'rgb(17, 24, 39)'; // Siyah (#111827)
      pass.foregroundColor = 'rgb(255, 255, 255)'; // Beyaz
      pass.labelColor = 'rgb(212, 175, 55)'; // Santis Gold (#D4AF37)

      // 3. Dinamik Veri Enjeksiyonu
      pass.primaryFields.push({
        key: 'service',
        label: 'V.I.P REZERVASYON',
        value: reservationData.serviceName || 'Santis Elite Terapi'
      });

      pass.secondaryFields.push({
        key: 'date',
        label: 'TARİH & SAAT',
        value: reservationData.dateFormatted // Örn: "24 Ekim, 15:00"
      });

      pass.auxiliaryFields.push({
        key: 'room',
        label: 'TERAPİ ODASI / KOD',
        value: reservationData.roomCode || 'Girişte Belirlenecek'
      });

      // 4. Kilit Ekranı Bildirimleri ve Otonomi
      // Rezervasyon saatine 2 saat kala kilit ekranında otomatik belirir
      pass.relevantDate = new Date(reservationData.isoDate).toISOString(); 
      pass.serialNumber = reservationData.sessionId; // Güncellemeler için kritik kimlik
      pass.webServiceURL = 'https://api.santisclub.com/v1/apple-wallet/'; // APNs Güncelleme Rotası
      pass.authenticationToken = reservationData.walletAuthToken; // İstemci Doğrulama

      // 5. Kapı/Giriş QR Kodu
      pass.barcodes = [{
        message: reservationData.sessionId,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }];

      // Paketi Mühürle ve Buffer olarak dön
      return await pass.getAsBuffer();

    } catch (error) {
      console.error(`🚨 [Santis Vault] PKPass Üretim Hatası: ${error.message}`);
      throw error;
    }
  }
};

module.exports = WalletEngine;
