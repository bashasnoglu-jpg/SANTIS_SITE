// server/santis-orbital-forge.mjs
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { dbVault } from './santis-db-vault.js';
import { ActionExecutor } from './core/action-executor.ts';
import { UploadRegistry } from './core/upload-registry.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.API_PORT || 5050);
const FINALIZE_SEAL_TTL_MS = 60 * 60 * 1000;
const LOCAL_UPLOAD_LIMIT = '25mb';
const LOCAL_FORGE_ROOT = path.join(WORKSPACE_ROOT, 'storage', 'orbital-forge');
const LOCAL_STAGING_ROOT = path.join(LOCAL_FORGE_ROOT, 'staging');
const LOCAL_PUBLISHED_ROOT = path.join(WORKSPACE_ROOT, 'storage', 'uploads', 'published');
const LOCAL_STATE_PATH = path.join(LOCAL_FORGE_ROOT, 'dev-state.json');

const hasNonEmptyEnv = (value) => typeof value === 'string' && value.trim().length > 0;
const ORBITAL_LOCAL_DEV_MODE = !(
    hasNonEmptyEnv(process.env.DATABASE_URL) &&
    hasNonEmptyEnv(process.env.S3_ENDPOINT) &&
    hasNonEmptyEnv(process.env.S3_BUCKET_NAME) &&
    hasNonEmptyEnv(process.env.S3_ACCESS_KEY) &&
    hasNonEmptyEnv(process.env.S3_SECRET_KEY)
);

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'DUMMY',
        secretAccessKey: process.env.S3_SECRET_KEY || 'DUMMY',
    },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sovereign-vault';

const ensureDirectory = (directoryPath) => {
    fs.mkdirSync(directoryPath, { recursive: true });
};

const normalizeOptionalString = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
};

const DELIVERY_PUBLIC_ORIGIN =
    normalizeOptionalString(process.env.DELIVERY_PUBLIC_ORIGIN) ||
    (process.env.NODE_ENV === 'production' ? null : 'http://localhost:8080');

const hashToken = (value) =>
    crypto.createHash('sha256').update(value).digest('hex');

const toPosixPath = (value) =>
    value.split(path.sep).join('/');

const toDeliveryUrl = (urlPath) => {
    if (!DELIVERY_PUBLIC_ORIGIN || /^https?:\/\//i.test(urlPath)) {
        return urlPath;
    }

    return `${DELIVERY_PUBLIC_ORIGIN}${urlPath}`;
};

const inferExtensionFromMime = (contentType) => {
    switch ((contentType || '').toLowerCase()) {
        case 'image/jpeg':
        case 'image/jpg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'image/gif':
            return '.gif';
        case 'image/svg+xml':
            return '.svg';
        default:
            return '.bin';
    }
};

const resolveFileExtension = (filename, contentType) => {
    const declaredExtension = path.extname(filename || '').toLowerCase();
    return declaredExtension || inferExtensionFromMime(contentType);
};

const readLocalState = () => {
    ensureDirectory(LOCAL_FORGE_ROOT);
    ensureDirectory(LOCAL_STAGING_ROOT);
    ensureDirectory(LOCAL_PUBLISHED_ROOT);

    if (!fs.existsSync(LOCAL_STATE_PATH)) {
        return { assets: {}, seals: {} };
    }

    try {
        const raw = fs.readFileSync(LOCAL_STATE_PATH, 'utf8');
        const parsed = JSON.parse(raw);

        return {
            assets: parsed?.assets && typeof parsed.assets === 'object' ? parsed.assets : {},
            seals: parsed?.seals && typeof parsed.seals === 'object' ? parsed.seals : {},
        };
    } catch (error) {
        console.warn('[ORBITAL FORGE] Local state could not be parsed. Rebuilding empty state.', error);
        return { assets: {}, seals: {} };
    }
};

const writeLocalState = (state) => {
    ensureDirectory(LOCAL_FORGE_ROOT);
    fs.writeFileSync(LOCAL_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
};

const mutateLocalState = (mutator) => {
    const state = readLocalState();
    const result = mutator(state);
    writeLocalState(state);
    return result;
};

const buildLocalDelivery = (publicFilename) => {
    const url = toDeliveryUrl(`/storage/uploads/published/${publicFilename}`);
    return {
        hero: url,
        card: url,
        thumb: url,
    };
};

const registerLocalSeal = ({
    uploadId,
    rawToken,
    uploadToken,
    assetId,
    tenantId,
    checksumSha256,
    ttlMs = FINALIZE_SEAL_TTL_MS,
}) => {
    mutateLocalState((state) => {
        state.seals[uploadId] = {
            uploadId,
            assetId,
            tenantId,
            tokenHash: hashToken(rawToken),
            uploadTokenHash: hashToken(uploadToken),
            checksumSha256: normalizeOptionalString(checksumSha256),
            createdAt: Date.now(),
            expiresAt: Date.now() + ttlMs,
            locked: false,
        };
    });
};

const acquireLocalSeal = ({ uploadId, rawToken, assetId }) =>
    mutateLocalState((state) => {
        const seal = state.seals[uploadId];

        if (!seal) {
            return { ok: false, reason: 'SEAL_NOT_FOUND' };
        }

        if (seal.expiresAt <= Date.now()) {
            delete state.seals[uploadId];
            return { ok: false, reason: 'SEAL_EXPIRED' };
        }

        if (seal.tokenHash !== hashToken(rawToken)) {
            return { ok: false, reason: 'TOKEN_MISMATCH' };
        }

        if (seal.assetId !== assetId) {
            return { ok: false, reason: 'ASSET_MISMATCH' };
        }

        if (seal.locked) {
            return { ok: false, reason: 'SEAL_IN_USE' };
        }

        seal.locked = true;

        return {
            ok: true,
            record: {
                assetId: seal.assetId,
                tenantId: seal.tenantId,
                checksumSha256: seal.checksumSha256 || undefined,
                createdAt: seal.createdAt,
                expiresAt: seal.expiresAt,
            },
        };
    });

const releaseLocalSeal = (uploadId) => {
    mutateLocalState((state) => {
        if (state.seals[uploadId]) {
            state.seals[uploadId].locked = false;
        }
    });
};

const consumeLocalSeal = (uploadId) => {
    mutateLocalState((state) => {
        delete state.seals[uploadId];
    });
};

const getLocalAssetByPublicId = (publicId) => {
    const state = readLocalState();
    return Object.values(state.assets).find((asset) => asset.publicId === publicId) || null;
};

app.put('/api/v1/uploads/blob/:uploadId', express.raw({ type: '*/*', limit: LOCAL_UPLOAD_LIMIT }), async (req, res) => {
    if (!ORBITAL_LOCAL_DEV_MODE) {
        return res.status(404).json({ error: 'LOCAL_DEV_UPLOAD_ROUTE_DISABLED' });
    }

    try {
        const { uploadId } = req.params;
        const uploadToken = req.header('x-upload-token');
        const state = readLocalState();
        const seal = state.seals[uploadId];

        if (!seal) {
            return res.status(404).json({
                error: 'SEAL_NOT_FOUND',
                message: 'Upload oturumu bulunamadi.',
            });
        }

        if (!uploadToken || seal.uploadTokenHash !== hashToken(uploadToken)) {
            return res.status(403).json({
                error: 'UPLOAD_TOKEN_MISMATCH',
                message: 'Upload muhru dogrulanamadi.',
            });
        }

        const asset = state.assets[seal.assetId];
        if (!asset) {
            return res.status(404).json({
                error: 'ASSET_NOT_FOUND',
                message: 'Upload varligi bulunamadi.',
            });
        }

        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({
                error: 'EMPTY_UPLOAD_BODY',
                message: 'Orbital Forge bos bir dosya kabul etmez.',
            });
        }

        const extension = resolveFileExtension(asset.originalFilename, asset.mimeType);
        const stagingFilename = `${uploadId}${extension}`;
        const stagingPath = path.join(LOCAL_STAGING_ROOT, stagingFilename);
        const computedChecksum = crypto.createHash('sha256').update(req.body).digest('hex');

        if (asset.checksumSha256 && asset.checksumSha256 !== computedChecksum) {
            return res.status(409).json({
                error: 'SEAL_CHECKSUM_MISMATCH',
                message: 'Upload govdesi init checksum beyanı ile eslesmedi.',
            });
        }

        fs.writeFileSync(stagingPath, req.body);

        asset.byteSize = req.body.length;
        asset.uploadedChecksumSha256 = computedChecksum;
        asset.stagingPath = stagingPath;
        asset.updatedAt = Date.now();

        writeLocalState(state);

        return res.status(204).end();
    } catch (error) {
        console.error('[ORBITAL FORGE] Local upload blob failed:', error);
        return res.status(500).json({ error: 'LOCAL_UPLOAD_FAILED' });
    }
});

// 1. İSTASYON: UPLOAD INIT CONSTITUTION
app.post('/api/v1/uploads/init', async (req, res) => {
    try {
        const { tenantId, filename, contentType, byteSize, intent, surfaceHint, checksumSha256 } = req.body;

        if (!tenantId || !filename || !contentType) {
            return res.status(400).json({ error: 'Geçersiz kargo beyanı. Tenant ve dosya bilgisi zorunlu.' });
        }

        const uploadId = `upl_${crypto.randomBytes(8).toString('hex')}`;
        const assetId = `ast_${crypto.randomBytes(8).toString('hex')}`;
        const publicId = `as_${crypto.randomBytes(6).toString('hex')}`;
        const expiresAtSeconds = Math.floor(Date.now() / 1000) + 3600;
        const finalizeToken = `fin_${crypto.randomBytes(16).toString('hex')}`;

        if (ORBITAL_LOCAL_DEV_MODE) {
            const uploadToken = `upltk_${crypto.randomBytes(12).toString('hex')}`;
            const extension = resolveFileExtension(filename, contentType);
            const draftStorageKey = `storage/orbital-forge/staging/${uploadId}${extension}`;

            mutateLocalState((state) => {
                state.assets[assetId] = {
                    assetId,
                    publicId,
                    tenantId,
                    originalFilename: filename,
                    mimeType: contentType,
                    byteSize: Number.isFinite(byteSize) ? byteSize : null,
                    storageKey: draftStorageKey,
                    checksumSha256: normalizeOptionalString(checksumSha256),
                    publicationState: 'draft',
                    visibility: 'private',
                    intent: normalizeOptionalString(intent),
                    surfaceHint: normalizeOptionalString(surfaceHint),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    stagingPath: null,
                    publishedPath: null,
                };
            });

            registerLocalSeal({
                uploadId,
                rawToken: finalizeToken,
                uploadToken,
                assetId,
                tenantId,
                checksumSha256,
                ttlMs: FINALIZE_SEAL_TTL_MS,
            });

            const uploadUrl = `http://localhost:${PORT}/api/v1/uploads/blob/${uploadId}`;

            console.log(`[ORBITAL FORGE] Local upload init ready: ${assetId} (${tenantId})`);

            return res.json({
                uploadId,
                assetId,
                publicId,
                method: 'PUT',
                uploadUrl,
                headers: {
                    'Content-Type': contentType,
                    'x-upload-token': uploadToken,
                },
                expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
                finalizeToken,
                mode: 'LOCAL_DEV_FALLBACK',
            });
        }

        const storageKey = `vault/${tenantId}/${assetId}/original/source`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: storageKey,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        const insertQuery = `
            INSERT INTO sovereign_media_registry 
            (asset_id, public_id, tenant_id, original_filename, mime_type, byte_size, storage_key, checksum_sha256, publication_state, visibility)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', 'private');
        `;
        await dbVault.query(insertQuery, [assetId, publicId, tenantId, filename, contentType, byteSize, storageKey, checksumSha256]);

        await UploadRegistry.register({
            uploadId,
            rawToken: finalizeToken,
            assetId,
            tenantId,
            checksumSha256,
            ttlMs: FINALIZE_SEAL_TTL_MS,
        });

        console.log(`[ORBITAL FORGE] Upload Init Başarılı: ${assetId} (${tenantId})`);

        return res.json({
            uploadId,
            assetId,
            publicId,
            method: 'PUT',
            uploadUrl,
            headers: { 'Content-Type': contentType },
            expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
            finalizeToken,
            mode: 'REMOTE_S3',
        });
    } catch (error) {
        console.error('[ORBITAL FORGE] Init Hatası:', error);
        return res.status(500).json({ error: 'Upload Init Failed.' });
    }
});

// 2. İSTASYON: UPLOAD FINALIZE CONSTITUTION
app.post('/api/v1/uploads/finalize', async (req, res) => {
    const { uploadId, assetId, finalizeToken } = req.body ?? {};

    try {
        if (!uploadId || !assetId || !finalizeToken) {
            return res.status(400).json({
                error: 'MISSING_SEAL_CONTEXT',
                message: 'uploadId, assetId ve finalizeToken zorunludur.',
            });
        }

        if (ORBITAL_LOCAL_DEV_MODE) {
            const seal = acquireLocalSeal({
                uploadId,
                rawToken: finalizeToken,
                assetId,
            });

            if (!seal.ok) {
                return res.status(403).json({
                    status: 'error',
                    reason: seal.reason,
                    message: 'Finalize muhru dogrulanamadi veya suresi doldu.',
                });
            }

            const state = readLocalState();
            const asset = state.assets[assetId];

            if (!asset) {
                releaseLocalSeal(uploadId);
                return res.status(404).json({
                    error: 'ASSET_NOT_FOUND',
                    message: 'Finalize kaydi bulunamadi.',
                });
            }

            if (asset.publicationState !== 'draft') {
                consumeLocalSeal(uploadId);
                return res.status(409).json({
                    error: 'SEAL_ALREADY_USED_OR_ASSET_NOT_DRAFT',
                    message: `Asset finalize edilemez. Mevcut durum: ${asset.publicationState}.`,
                    currentStatus: asset.publicationState,
                });
            }

            if (asset.tenantId !== seal.record.tenantId) {
                consumeLocalSeal(uploadId);
                return res.status(409).json({
                    error: 'SEAL_TENANT_MISMATCH',
                    message: 'Finalize muhrunun tenant baglami registry ile eslesmiyor.',
                });
            }

            if (!asset.stagingPath || !fs.existsSync(asset.stagingPath)) {
                releaseLocalSeal(uploadId);
                return res.status(409).json({
                    error: 'UPLOAD_BODY_MISSING',
                    message: 'Finalize oncesi dosya govdesi Orbital Forge staging alanina ulasmadi.',
                });
            }

            const fileBuffer = fs.readFileSync(asset.stagingPath);
            const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            if (seal.record.checksumSha256 && actualChecksum !== seal.record.checksumSha256) {
                consumeLocalSeal(uploadId);
                return res.status(409).json({
                    error: 'SEAL_CHECKSUM_MISMATCH',
                    message: 'Checksum dogrulamasi basarisiz. Init ve finalize sozlesmesi ayni dosyayi isaret etmiyor.',
                });
            }

            const extension = resolveFileExtension(asset.originalFilename, asset.mimeType);
            const publishedFilename = `${asset.publicId}${extension}`;
            const publishedPath = path.join(LOCAL_PUBLISHED_ROOT, publishedFilename);
            fs.copyFileSync(asset.stagingPath, publishedPath);

            asset.byteSize = fileBuffer.length;
            asset.checksumSha256 = actualChecksum;
            asset.storageKey = toPosixPath(path.relative(WORKSPACE_ROOT, publishedPath));
            asset.publicationState = 'published';
            asset.visibility = 'public-deliverable';
            asset.publishedPath = publishedPath;
            asset.updatedAt = Date.now();

            writeLocalState(state);
            consumeLocalSeal(uploadId);

            const delivery = buildLocalDelivery(publishedFilename);
            const telemetryBinding = await ActionExecutor.handleUploadFinalize({
                uploadId,
                assetId,
                publicId: asset.publicId,
                tenantId: asset.tenantId,
                checksumSha256: asset.checksumSha256,
                byteSize: asset.byteSize,
                mimeType: asset.mimeType,
                filename: asset.originalFilename,
                storageKey: asset.storageKey,
                delivery,
            });

            if (!telemetryBinding.success) {
                console.warn('[ORBITAL FORGE] Finalize telemetry binding degraded:', telemetryBinding);
            }

            console.log(`[ORBITAL FORGE] Local asset finalized: ${assetId} -> ${delivery.card}`);

            return res.json({
                assetId,
                publicId: asset.publicId,
                status: 'ready',
                delivery,
                telemetryEventId: telemetryBinding.success ? telemetryBinding.eventId : null,
                telemetryBound: telemetryBinding.success,
                telemetryReason: telemetryBinding.success ? null : telemetryBinding.reason ?? 'ACTION_EXECUTOR_FAILURE',
                mode: 'LOCAL_DEV_FALLBACK',
            });
        }

        const seal = await UploadRegistry.acquire({
            uploadId,
            rawToken: finalizeToken,
            assetId,
        });

        if (!seal.ok) {
            return res.status(403).json({
                status: 'error',
                reason: seal.reason,
                message: 'Finalize muhru dogrulanamadi veya suresi doldu.',
            });
        }

        const selectQuery = `
            SELECT public_id, tenant_id, checksum_sha256, byte_size, mime_type, original_filename, storage_key, publication_state
            FROM sovereign_media_registry
            WHERE asset_id = $1
        `;

        const currentAssetResult = await dbVault.query(selectQuery, [assetId]);

        if (currentAssetResult.rowCount === 0) {
            await UploadRegistry.release(uploadId);
            return res.status(404).json({
                error: 'ASSET_NOT_FOUND',
                message: 'Finalize kaydi bulunamadi.',
            });
        }

        const currentAsset = currentAssetResult.rows[0];

        if (currentAsset.publication_state !== 'draft') {
            await UploadRegistry.consume(uploadId);
            return res.status(409).json({
                error: 'SEAL_ALREADY_USED_OR_ASSET_NOT_DRAFT',
                message: `Asset finalize edilemez. Mevcut durum: ${currentAsset.publication_state}.`,
                currentStatus: currentAsset.publication_state,
            });
        }

        if (currentAsset.tenant_id !== seal.record.tenantId) {
            await UploadRegistry.consume(uploadId);
            return res.status(409).json({
                error: 'SEAL_TENANT_MISMATCH',
                message: 'Finalize muhrunun tenant baglami registry ile eslesmiyor.',
            });
        }

        if (seal.record.checksumSha256 && currentAsset.checksum_sha256 !== seal.record.checksumSha256) {
            await UploadRegistry.consume(uploadId);
            return res.status(409).json({
                error: 'SEAL_CHECKSUM_MISMATCH',
                message: 'Checksum dogrulamasi basarisiz. Init ve finalize sozlesmesi ayni dosyayi isaret etmiyor.',
            });
        }

        const updateQuery = `
            UPDATE sovereign_media_registry 
            SET publication_state = 'published', visibility = 'public-deliverable'
            WHERE asset_id = $1 AND publication_state = 'draft'
            RETURNING public_id, tenant_id, checksum_sha256, byte_size, mime_type, original_filename, storage_key;
        `;

        const result = await dbVault.query(updateQuery, [assetId]);

        if (result.rowCount === 0) {
            await UploadRegistry.consume(uploadId);
            return res.status(409).json({
                error: 'FINALIZE_RACE_DETECTED',
                message: 'Asset finalize edilirken durum degisti. Muhur tekrar kullanilamaz.',
            });
        }

        const finalizedAsset = result.rows[0];
        const publicId = finalizedAsset.public_id;
        const delivery = {
            hero: toDeliveryUrl(`/media/hero/${publicId}`),
            card: toDeliveryUrl(`/media/card/${publicId}`),
            thumb: toDeliveryUrl(`/media/thumb/${publicId}`),
        };

        const telemetryBinding = await ActionExecutor.handleUploadFinalize({
            uploadId,
            assetId,
            publicId,
            tenantId: finalizedAsset.tenant_id,
            checksumSha256: finalizedAsset.checksum_sha256,
            byteSize: finalizedAsset.byte_size,
            mimeType: finalizedAsset.mime_type,
            filename: finalizedAsset.original_filename,
            storageKey: finalizedAsset.storage_key,
            delivery,
        });

        if (!telemetryBinding.success) {
            console.warn('[ORBITAL FORGE] Finalize telemetry binding degraded:', telemetryBinding);
        }

        await UploadRegistry.consume(uploadId);

        console.log(`[ORBITAL FORGE] Asset Finalized & Published: ${assetId} -> Public ID: ${publicId}`);

        return res.json({
            assetId,
            publicId,
            status: 'ready',
            delivery,
            telemetryEventId: telemetryBinding.success ? telemetryBinding.eventId : null,
            telemetryBound: telemetryBinding.success,
            telemetryReason: telemetryBinding.success ? null : telemetryBinding.reason ?? 'ACTION_EXECUTOR_FAILURE',
            mode: 'REMOTE_S3',
        });
    } catch (error) {
        if (uploadId) {
            if (ORBITAL_LOCAL_DEV_MODE) {
                releaseLocalSeal(uploadId);
            } else {
                await UploadRegistry.release(uploadId);
            }
        }

        console.error('[ORBITAL FORGE] Finalize Hatası:', error);
        return res.status(500).json({ error: 'Finalize Failed.' });
    }
});

// INTERNAL RESOLVER (Edge Worker için)
app.get('/internal/media/resolve', async (req, res) => {
    try {
        const { publicId } = req.query;
        if (!publicId) {
            return res.status(400).json({ error: 'Missing publicId' });
        }

        if (ORBITAL_LOCAL_DEV_MODE) {
            const asset = getLocalAssetByPublicId(publicId);
            if (!asset) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.json({
                assetId: asset.assetId,
                tenantId: asset.tenantId,
                storageKey: asset.storageKey,
                publicationState: asset.publicationState,
                visibility: asset.visibility,
                contentType: asset.mimeType,
            });
        }

        const rq = `SELECT asset_id, tenant_id, storage_key, publication_state, visibility, mime_type FROM sovereign_media_registry WHERE public_id = $1`;
        const { rows } = await dbVault.query(rq, [publicId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.json({
            assetId: rows[0].asset_id,
            tenantId: rows[0].tenant_id,
            storageKey: rows[0].storage_key,
            publicationState: rows[0].publication_state,
            visibility: rows[0].visibility,
            contentType: rows[0].mime_type,
        });
    } catch (error) {
        return res.status(500).json({ error: 'Resolver failed' });
    }
});

app.listen(PORT, () => {
    console.log(`[SOVEREIGN CORE] Orbital Forge & Internal Resolver (Port ${PORT}) Devrede. 🚀`);
    if (ORBITAL_LOCAL_DEV_MODE) {
        console.log(`[SOVEREIGN CORE] Orbital Forge local dev fallback aktif. Registry: ${LOCAL_STATE_PATH}`);
    }
});
