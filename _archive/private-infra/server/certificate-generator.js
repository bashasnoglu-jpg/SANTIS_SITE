// server/certificate-generator.js
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
app.use(cors());
// Base64 snapshot verisi büyük olacağı için (3-5MB civarı) limit yükseltildi
app.use(express.json({ limit: '10mb' }));

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID || 'dummy'}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || 'dummy_key',
        secretAccessKey: process.env.R2_SECRET_KEY || 'dummy_secret',
    },
});

export async function generateSovereignCertificate(data) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let imageTag = '';
    if (data.snapshotBase64) {
        imageTag = `<img src="${data.snapshotBase64}" class="snapshot" />`;
    }

    const htmlContent = `
        <html>
        <style>
            body { background: #141416; color: #c6a96b; font-family: 'Courier New', monospace; padding: 50px; }
            .border { border: 2px solid #c6a96b; padding: 20px; }
            .header { text-align: center; letter-spacing: 5px; text-transform: uppercase; }
            .data-point { margin: 20px 0; border-bottom: 1px solid #c6a96b33; padding-bottom: 5px; }
            .quantum-trace { height: 100px; background: linear-gradient(90deg, #1e3a8a, #c6a96b); opacity: 0.3; margin: 20px 0; }
            .snapshot { width: 100%; border: 1px solid #c6a96b; border-radius: 4px; box-shadow: 0 0 20px rgba(198,169,107,0.2); margin-top: 20px; }
            .motto { font-style: italic; text-align: center; margin-top: 50px; opacity: 0.5; }
        </style>
        <body>
            <div class="border">
                <div class="header"><h1>Santis Kuantum Sertifikası</h1></div>
                <div class="data-point">PROFİL: ${data.planName || 'SOVEREIGN CHOICE'}</div>
                <div class="data-point">STRES ANALİZİ: %${data.stressLevel}</div>
                <div class="data-point">VARLIK KİMLİĞİ: ${data.assetId}</div>
                ${imageTag}
                <div class="quantum-trace"></div>
                <div class="motto">"Gelecek, mühürlendi." - Montenegro Sovereign Division</div>
            </div>
        </body>
        </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // R2'ye Yükleme
    const key = `certificates/${data.tenantId}/${data.assetId}-cert.pdf`;
    await r2Client.send(new PutObjectCommand({
        Bucket: "santis-vault",
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf"
    }));

    return key;
}

export async function getDownloadLink(objectKey) {
    const command = new GetObjectCommand({
        Bucket: "santis-vault",
        Key: objectKey,
    });

    // 600 saniye (10 dakika) geçerli URL
    return await getSignedUrl(r2Client, command, { expiresIn: 600 });
}

// Ödeme Callback / Webhook sonrası tetiklenir
app.post('/api/v1/payment/confirm', async (req, res) => {
    const { tenantId, assetId, stressLevel, planName, snapshotBase64 } = req.body;

    try {
        // 1. Sertifikayı Üret ve R2'ye bas
        const objectKey = await generateSovereignCertificate({ tenantId, assetId, stressLevel, planName, snapshotBase64 });

        // 2. İndirme linkini oluştur
        const downloadUrl = await getDownloadLink(objectKey);

        // 3. Yanıtı dön
        res.status(200).json({
            status: "SUCCESS",
            message: "Sertifika Mühürlendi.",
            downloadUrl: downloadUrl
        });
    } catch (error) {
        console.error("Forge Error:", error);
        res.status(500).json({ error: "Orbital Forge Hatası." });
    }
});

const PORT = process.env.CERT_API_PORT || 5052;
app.listen(PORT, () => {
    console.log(`[SOVEREIGN CORE] R2 Certificate Generator (Port ${PORT}) Devrede. 📜`);
});
