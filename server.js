const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { Client } = require('pg');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex <= 0) continue;
        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

const PORT = Number(process.env.PORT || 4173);
const ROOT_DIR = __dirname;
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(ROOT_DIR, '.env'));
const BOOTSTRAP_CACHE_FILE = path.join(ROOT_DIR, '.bootstrap-cache.json');
const ACCOUNT_COEFF_FILE = path.join(ROOT_DIR, 'account_coefficients.json');
const BITRIX_BASE = process.env.BITRIX_BASE || '';
const CLOCKSTER_BASE = process.env.CLOCKSTER_BASE || 'https://api.clockster.com/company/v2';
const CLOCKSTER_TOKEN = process.env.CLOCKSTER_TOKEN || '';
const DB_CONFIG = {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || ''
};
const BOOTSTRAP_CACHE_TTL = 5 * 60 * 1000;
const bootstrapCache = {
    timestamp: 0,
    data: null,
    promise: null
};

const SELECT_DEALS = ['ID', 'CATEGORY_ID', 'STAGE_ID', 'COMPANY_ID', 'CONTACT_ID', 'UF_CRM_ACTIVE_ADDRESS', 'UF_CRM_1743669674', 'ASSIGNED_BY_ID', 'MOVED_TIME', 'CLOSEDATE', 'DATE_CREATE', 'OPPORTUNITY', 'UF_CRM_1707724024179', 'UF_CRM_1707145268405'];
const SELECT_REMARKS = ['ID', 'UF_CRM_1743669674', 'ASSIGNED_BY_ID', 'DATE_CREATE', 'UF_CRM_REVIEWDATE', 'UF_CRM_FITBACK', 'UF_CRM_1719824872888', 'UF_CRM_1732104149680'];

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function getMissingBootstrapEnvVars() {
    const missing = [];
    if (!BITRIX_BASE) missing.push('BITRIX_BASE');
    return missing;
}

function loadBootstrapCacheFromDisk() {
    try {
        if (!fs.existsSync(BOOTSTRAP_CACHE_FILE)) return;
        const raw = fs.readFileSync(BOOTSTRAP_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed?.data) return;
        bootstrapCache.timestamp = Number(parsed.timestamp) || Date.now();
        bootstrapCache.data = parsed.data;
    } catch (error) {
        console.warn('loadBootstrapCacheFromDisk failed:', error.message || error);
    }
}

function saveBootstrapCacheToDisk(data) {
    try {
        fs.writeFileSync(BOOTSTRAP_CACHE_FILE, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (error) {
        console.warn('saveBootstrapCacheToDisk failed:', error.message || error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 10 * 1024 * 1024) {
                reject(new Error('Request body too large'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(raw));
        req.on('error', reject);
    });
}

function proxyRequest(targetUrl, { method = 'GET', headers = {}, body = null } = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);
        const options = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || 443,
            path: `${url.pathname}${url.search}`,
            method,
            headers
        };

        const upstream = https.request(options, response => {
            let raw = '';
            response.on('data', chunk => { raw += chunk; });
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode || 500,
                    headers: response.headers,
                    body: raw
                });
            });
        });

        upstream.on('error', reject);
        if (body) upstream.write(body);
        upstream.end();
    });
}

function serveStatic(req, res) {
    const requestPath = req.url === '/' ? '/index.html' : new URL(req.url, `http://${req.headers.host}`).pathname;
    if (requestPath === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
    const filePath = path.join(ROOT_DIR, safePath);
    if (!filePath.startsWith(ROOT_DIR)) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            sendJson(res, 404, { error: 'File not found' });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(content);
    });
}

async function handleBitrix(req, res) {
    if (!BITRIX_BASE) {
        sendJson(res, 500, { error: 'BITRIX_BASE is not configured' });
        return;
    }
    const methodName = req.url.replace(/^\/api\/bitrix\//, '').replace(/\?.*$/, '');
    if (!methodName) {
        sendJson(res, 400, { error: 'Missing Bitrix method' });
        return;
    }

    try {
        const body = await readRequestBody(req);
        const upstream = await proxyRequest(`${BITRIX_BASE}${methodName}.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body || '')
            },
            body
        });

        res.writeHead(upstream.statusCode, {
            'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8'
        });
        res.end(upstream.body);
    } catch (error) {
        sendJson(res, 502, { error: error.message || 'Bitrix proxy failed' });
    }
}

async function handleClockster(req, res) {
    if (!CLOCKSTER_TOKEN) {
        sendJson(res, 500, { error: 'CLOCKSTER_TOKEN is not configured' });
        return;
    }
    const incomingUrl = new URL(req.url, `http://${req.headers.host}`);
    const upstreamUrl = `${CLOCKSTER_BASE}${incomingUrl.pathname.replace(/^\/api\/clockster/, '')}${incomingUrl.search}`;

    try {
        const upstream = await proxyRequest(upstreamUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${CLOCKSTER_TOKEN}`
            }
        });

        res.writeHead(upstream.statusCode, {
            'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8'
        });
        res.end(upstream.body);
    } catch (error) {
        sendJson(res, 502, { error: error.message || 'Clockster proxy failed' });
    }
}

async function postJson(url, payload, headers = {}, attempt = 0) {
    const body = JSON.stringify(payload);
    const upstream = await proxyRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            ...headers
        },
        body
    });

    if (upstream.statusCode === 429 && attempt < 6) {
        await sleep(500 * (attempt + 1));
        return postJson(url, payload, headers, attempt + 1);
    }

    const parsed = JSON.parse(upstream.body || '{}');
    if (parsed.error) {
        throw new Error(parsed.error_description || parsed.error);
    }
    return parsed;
}

async function fetchAllDeals(categoryId, select) {
    const first = await postJson(`${BITRIX_BASE}crm.deal.list.json`, {
        filter: { CATEGORY_ID: String(categoryId) },
        select,
        start: 0
    });
    const items = Array.isArray(first.result) ? [...first.result] : [];
    const total = Number(first.total) || items.length;

    for (let start = items.length; start < total; start += 50) {
        const page = await postJson(`${BITRIX_BASE}crm.deal.list.json`, {
            filter: { CATEGORY_ID: String(categoryId) },
            select,
            start
        });
        if (Array.isArray(page.result)) items.push(...page.result);
    }

    return items;
}

async function fetchAllItems(entityTypeId, filter = {}) {
    const first = await postJson(`${BITRIX_BASE}crm.item.list.json`, {
        entityTypeId: String(entityTypeId),
        filter,
        select: ['*', 'UF_*'],
        start: 0
    });
    const firstItems = Array.isArray(first.result?.items) ? first.result.items : [];
    const items = [...firstItems];
    const total = Number(first.total) || items.length;

    for (let start = items.length; start < total; start += 50) {
        const page = await postJson(`${BITRIX_BASE}crm.item.list.json`, {
            entityTypeId: String(entityTypeId),
            filter,
            select: ['*', 'UF_*'],
            start
        });
        const batch = Array.isArray(page.result?.items) ? page.result.items : [];
        items.push(...batch);
    }

    return items;
}

async function fetchAllListElements(iblockId) {
    const items = [];
    let start = 0;

    while (true) {
        const page = await postJson(`${BITRIX_BASE}lists.element.get.json`, {
            IBLOCK_TYPE_ID: 'lists',
            IBLOCK_ID: iblockId,
            start
        });
        let batch = page.result || [];
        if (!Array.isArray(batch)) batch = Object.values(batch);
        if (!batch.length) break;
        items.push(...batch);
        if (page.next == null || page.next === false) break;
        start = Number(page.next);
        if (!Number.isFinite(start)) break;
    }

    return items;
}

async function fetchAllUsers() {
    const items = [];
    let start = 0;

    while (true) {
        const page = await postJson(`${BITRIX_BASE}user.get.json`, { start });
        const batch = Array.isArray(page.result) ? page.result : [];
        if (!batch.length) break;
        items.push(...batch);
        if (page.next == null || page.next === false) break;
        start = Number(page.next);
        if (!Number.isFinite(start)) break;
    }

    return items;
}

async function fetchAllCompanies() {
    const items = [];
    let start = 0;

    while (true) {
        const page = await postJson(`${BITRIX_BASE}crm.company.list.json`, {
            select: ['ID', 'TITLE'],
            order: { ID: 'ASC' },
            start
        });
        const batch = Array.isArray(page.result) ? page.result : [];
        if (!batch.length) break;
        items.push(...batch);
        if (page.next == null || page.next === false) break;
        start = Number(page.next);
        if (!Number.isFinite(start)) break;
    }

    return items;
}

function loadAccountCoefficientRows() {
    try {
        if (!fs.existsSync(ACCOUNT_COEFF_FILE)) return [];
        const raw = fs.readFileSync(ACCOUNT_COEFF_FILE, 'utf8');
        const rows = JSON.parse(raw);
        return Array.isArray(rows) ? rows : [];
    } catch (error) {
        console.warn('loadAccountCoefficientRows failed:', error.message || error);
        return [];
    }
}

async function fetchFotDbItems() {
    if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password || !DB_CONFIG.database) {
        return [];
    }
    const client = new Client(DB_CONFIG);
    await client.connect();

    try {
        const { rows } = await client.query(`
            SELECT
                d.partner_id,
                u.name AS partner_name,
                d1.period_year,
                d1.period_month,
                d1.object_bitrix_id,
                COUNT(*)::int AS payments_count,
                COALESCE(SUM(d1.amount), 0)::text AS total_amount
            FROM distribution_batch_items d1
            LEFT JOIN distribution_batches d ON d1.batch_id = d.id
            LEFT JOIN users u ON d.partner_id = u.id
            WHERE d1.is_rolled_back IS FALSE
              AND d.partner_id IS NOT NULL
              AND d1.period_year >= 2026
              AND d1.object_bitrix_id IS NOT NULL
              AND d1.object_bitrix_id <> ''
            GROUP BY d.partner_id, u.name, d1.period_year, d1.period_month, d1.object_bitrix_id
        `);
        return rows;
    } finally {
        await client.end();
    }
}

async function buildBootstrapData() {
    const missingEnvVars = getMissingBootstrapEnvVars();
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required env vars: ${missingEnvVars.join(', ')}`);
    }

    const [
        partnerList,
        refList,
        users,
        companies
    ] = await Promise.all([
        fetchAllListElements(117),
        fetchAllListElements(115),
        fetchAllUsers(),
        fetchAllCompanies()
    ]);

    const [
        deals69,
        remarkDeals,
        callsItems,
        disciplineItems,
        opuItems,
        managementItems,
        fotDbItems
    ] = await Promise.all([
        fetchAllDeals(69, SELECT_DEALS),
        fetchAllDeals(81, SELECT_REMARKS),
        fetchAllItems(1364, { categoryId: 431 }),
        fetchAllItems(1364, { categoryId: 439 }),
        fetchAllItems(1254, { categoryId: 311 }),
        fetchAllItems(1254, { categoryId: 441 }),
        fetchFotDbItems().catch(error => {
            console.warn('fetchFotDbItems failed:', error.message || error);
            return [];
        })
    ]);

    const partnerMap = {};
    for (const el of partnerList) {
        const id = String(el.ID ?? '').trim();
        const name = String(el.NAME ?? '').trim() || id;
        if (id) partnerMap[id] = name;
    }

    const list115PartnerByElementId = {};
    for (const el of refList) {
        const id = String(el.ID ?? '');
        const partnerId =
            el.PROPERTY_905 ??
            el.PROPERTY_905_VALUE ??
            el.PROPERTIES?.PROPERTY_905?.VALUE ??
            el.PROPERTIES?.PROPERTY_905;
        if (id && partnerId != null && partnerId !== '') {
            list115PartnerByElementId[id] = String(partnerId);
        }
    }

    const userMap = {};
    for (const user of users) {
        userMap[user.ID] = `${user.NAME || ''} ${user.LAST_NAME || ''}`.trim();
    }

    const companyMap = {};
    for (const company of companies) {
        const id = String(company.ID ?? '').trim();
        const title = String(company.TITLE ?? '').trim() || id;
        if (id) companyMap[id] = title;
    }

    const accountCoefficientRows = loadAccountCoefficientRows();

    return {
        partnerMap,
        companyMap,
        list115PartnerByElementId,
        lastUserMap: userMap,
        accountCoefficientRows,
        deals69,
        deals79: [],
        remarkDeals,
        callsItems,
        disciplineItems,
        opuItems,
        managementItems,
        fotDbItems,
        counts: {
            partners117: partnerList.length,
            refs115: refList.length,
            users: users.length,
            companies: companies.length,
            deals69: deals69.length,
            remarks81: remarkDeals.length,
            calls431: callsItems.length,
            discipline439: disciplineItems.length,
            training311: opuItems.length,
            management441: managementItems.length,
            fotDbItems: fotDbItems.length,
            accountCoefficientRows: accountCoefficientRows.length
        }
    };
}

async function handleBootstrap(req, res) {
    const now = Date.now();
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const forceRefresh = requestUrl.searchParams.get('refresh') === '1';

    if (!forceRefresh && bootstrapCache.data && now - bootstrapCache.timestamp < BOOTSTRAP_CACHE_TTL) {
        sendJson(res, 200, bootstrapCache.data);
        return;
    }

    if (!bootstrapCache.promise || forceRefresh) {
        bootstrapCache.promise = buildBootstrapData()
            .then(data => {
                bootstrapCache.timestamp = Date.now();
                bootstrapCache.data = data;
                saveBootstrapCacheToDisk(data);
                return data;
            })
            .finally(() => {
                bootstrapCache.promise = null;
            });
    }

    try {
        const data = await bootstrapCache.promise;
        sendJson(res, 200, data);
    } catch (error) {
        sendJson(res, 502, { error: error.message || 'Bootstrap load failed' });
    }
}

async function requestListener(req, res) {
    if (!req.url) {
        sendJson(res, 400, { error: 'Missing URL' });
        return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith('/api/bitrix/')) {
        await handleBitrix(req, res);
        return;
    }

    if (pathname.startsWith('/api/clockster/')) {
        await handleClockster(req, res);
        return;
    }

    if (pathname === '/api/bootstrap') {
        await handleBootstrap(req, res);
        return;
    }

    serveStatic(req, res);
}

loadBootstrapCacheFromDisk();

function createServer() {
    return http.createServer((req, res) => {
        requestListener(req, res).catch(error => {
            sendJson(res, 500, { error: error.message || 'Internal server error' });
        });
    });
}

if (require.main === module) {
    createServer().listen(PORT, '127.0.0.1', () => {
        console.log(`Dashboard server running at http://127.0.0.1:${PORT}/`);
    });
}

module.exports = {
    requestListener,
    createServer
};
