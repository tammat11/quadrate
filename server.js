const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { Client } = require('pg');
const mysql = require('mysql2/promise');

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

const ROOT_DIR = __dirname;
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(ROOT_DIR, '.env'));
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const BOOTSTRAP_CACHE_FILE = path.join(ROOT_DIR, '.bootstrap-cache.json');
const ACCOUNT_COEFF_FILE = path.join(ROOT_DIR, 'account_coefficients.json');
const BITRIX_BASE = process.env.BITRIX_BASE || '';
const BITRIX_PORTAL_BASE = BITRIX_BASE ? BITRIX_BASE.replace(/\/rest\/.*$/, '') : '';
const CLOCKSTER_BASE = process.env.CLOCKSTER_BASE || 'https://api.clockster.com/company/v2';
const CLOCKSTER_TOKEN = process.env.CLOCKSTER_TOKEN || '';
const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || '';
const WHATSAPP_BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN || '';
const CABINET_CODE_TARGET_PHONE = normalizePhone(process.env.CABINET_CODE_TARGET_PHONE || '');
const CABINET_PARTNER_PICKER_PHONE = normalizePhone(process.env.CABINET_PARTNER_PICKER_PHONE || '77070522006');
const CABINET_SESSION_SECRET = process.env.CABINET_SESSION_SECRET || WHATSAPP_BOT_TOKEN || 'cabinet-dev-secret';
const CABINET_CODE_TTL = Number(process.env.CABINET_CODE_TTL_MS || 5 * 60 * 1000);
const CABINET_SESSION_TTL = Number(process.env.CABINET_SESSION_TTL_MS || 14 * 24 * 60 * 60 * 1000);
const CABINET_DATABASE_URL = process.env.CABINET_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
const CABINET_DB_DISABLED = process.env.CABINET_DB_DISABLED === '1' || process.env.CABINET_DB_DISABLED === 'true';
const BOOTSTRAP_PROXY_URL = process.env.BOOTSTRAP_PROXY_URL || '';
const BOOTSTRAP_PROXY_TOKEN = process.env.BOOTSTRAP_PROXY_TOKEN || '';
const MANAGEMENT_PROXY_URL = process.env.MANAGEMENT_PROXY_URL || '';
const MANAGEMENT_PROXY_TOKEN = process.env.MANAGEMENT_PROXY_TOKEN || '';
const MANAGEMENT_MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || '',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DBNAME || process.env.MYSQL_DATABASE || ''
};
const DB_CONFIG = {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || ''
};
const CABINET_DB_CONFIG = {
    connectionString: CABINET_DATABASE_URL,
    host: process.env.CABINET_DB_HOST || process.env.DB_HOST || '',
    port: Number(process.env.CABINET_DB_PORT || process.env.DB_PORT || 5432),
    user: process.env.CABINET_DB_USER || process.env.DB_USER || '',
    password: process.env.CABINET_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.CABINET_DB_NAME || process.env.DB_NAME || '',
    ssl: process.env.CABINET_DB_SSL === '1' || process.env.CABINET_DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined
};
const FOT_HUMAN_EXPENSE_TYPES = ['employee', 'pieceworker', 'additional', 'driver', 'curator'];
const BOOTSTRAP_CACHE_VERSION = 4;
const BOOTSTRAP_CACHE_TTL = 5 * 60 * 1000;
const CABINET_LIST_IBLOCK_ID = 109;
const CABINET_EMPLOYEE_PROP = 'PROPERTY_733';
const CABINET_PARTNER_PROP = 'PROPERTY_765';
const bootstrapCache = {
    timestamp: 0,
    data: null,
    promise: null
};
const cabinetCodeStore = new Map();
const cabinetSessionStore = new Map();
const cabinetAccountsCache = {
    timestamp: 0,
    data: null,
    promise: null
};
const cabinetDbState = {
    schemaReady: false,
    schemaPromise: null
};
const bootstrapDbState = {
    lastSnapshot: null
};

const SELECT_DEALS = ['ID', 'CATEGORY_ID', 'STAGE_ID', 'COMPANY_ID', 'CONTACT_ID', 'UF_CRM_ACTIVE_ADDRESS', 'UF_CRM_1743669674', 'ASSIGNED_BY_ID', 'MOVED_TIME', 'CLOSEDATE', 'DATE_CREATE', 'OPPORTUNITY', 'UF_CRM_1707724024179', 'UF_CRM_1707145268405'];
const SELECT_REMARKS = ['ID', 'TITLE', 'UF_CRM_1743669674', 'ASSIGNED_BY_ID', 'DATE_CREATE', 'UF_CRM_REVIEWDATE', 'UF_CRM_FITBACK', 'UF_CRM_1719824872888', 'UF_CRM_1732104149680'];
const MANAGEMENT_VIEW_COLUMNS = [
    'external_id',
    'Название',
    'Номер_воронки',
    'Наименовение_воронки',
    'Наименование_стадии',
    'Наименование_ИП_инфо',
    'Ответственное_лицо_ИП_инфо',
    'Адрес_объекта_инфо',
    'Адрес_объекта_инфо_ID',
    'BIN_партнера',
    'Наименовение_компании_1',
    'ФИО_1',
    'Кураторы',
    'Сдельщики',
    'Месяц_начисления',
    'Пользовательский',
    'Реализация с НДС',
    'НДС',
    'УМС ELS',
    'ФОТ ОФФ Битрикс',
    'Kaspi/ JTI',
    'ФОТ НЕОФ',
    'Авансирования',
    'Аренда спецтехники',
    'Транспортные расходы',
    'Ген. Уборка',
    'УМС',
    'Сумма_Товара',
    'Ремонт',
    'Сумма_на_снятие',
    'Консалтинг',
    'Оборудование',
    'ИП_НДС_или_без_НДС',
    'Налоги_по_зарплате',
    'ОФ ЗП 1С',
    'Самозанятые',
    'Реализация без НДС',
    'ИТОГО ФОТ',
    'ИТОГО УМС',
    'Бух. Услуги',
    'Налоги самозанятых',
    'ИПН/КПН',
    'Eco Line УМС',
    'Расходы ИП',
    'Маржа Партнера',
    'Маржа'
];

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

function sendJsonWithHeaders(res, statusCode, payload, headers = {}) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
    res.end(JSON.stringify(payload));
}

function getCabinetDbConfig() {
    if (CABINET_DB_DISABLED) return null;
    if (CABINET_DB_CONFIG.connectionString) {
        return {
            connectionString: CABINET_DB_CONFIG.connectionString,
            ssl: CABINET_DB_CONFIG.ssl
        };
    }
    if (!CABINET_DB_CONFIG.host || !CABINET_DB_CONFIG.user || !CABINET_DB_CONFIG.password || !CABINET_DB_CONFIG.database) {
        return null;
    }
    return {
        host: CABINET_DB_CONFIG.host,
        port: CABINET_DB_CONFIG.port,
        user: CABINET_DB_CONFIG.user,
        password: CABINET_DB_CONFIG.password,
        database: CABINET_DB_CONFIG.database,
        ssl: CABINET_DB_CONFIG.ssl
    };
}

function getManagementMysqlConfig() {
    if (!MANAGEMENT_MYSQL_CONFIG.host || !MANAGEMENT_MYSQL_CONFIG.user || !MANAGEMENT_MYSQL_CONFIG.password || !MANAGEMENT_MYSQL_CONFIG.database) {
        return null;
    }
    return { ...MANAGEMENT_MYSQL_CONFIG };
}

function hasCabinetDbConfig() {
    return Boolean(getCabinetDbConfig());
}

async function withPgClient(config, callback) {
    const client = new Client(config);
    await client.connect();
    try {
        return await callback(client);
    } finally {
        await client.end();
    }
}

async function withMysqlClient(config, callback) {
    const client = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        charset: 'utf8mb4'
    });
    try {
        await client.query("SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci");
        await client.query("SET collation_connection = 'utf8mb4_0900_ai_ci'");
        return await callback(client);
    } finally {
        await client.end();
    }
}

async function queryCabinetDb(queryText, params = []) {
    const config = getCabinetDbConfig();
    if (!config) throw new Error('Cabinet DB is not configured');
    return withPgClient(config, client => client.query(queryText, params));
}

async function queryManagementMysql(queryText, params = []) {
    const config = getManagementMysqlConfig();
    if (!config) throw new Error('Management MySQL is not configured');
    return withMysqlClient(config, client => client.query(queryText, params));
}

function quoteMysqlIdentifier(identifier) {
    return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function parseMonthKeyRange(monthKey) {
    if (!/^\d{4}-\d{2}$/.test(String(monthKey || ''))) return null;
    const [year, month] = String(monthKey).split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10)
    };
}

async function fetchManagementRows(monthKey = '') {
    const config = getManagementMysqlConfig();
    if (!config) return [];

    const selectColumns = [
        ...MANAGEMENT_VIEW_COLUMNS.map(quoteMysqlIdentifier),
        `DATE_FORMAT(${quoteMysqlIdentifier('Месяц_начисления')}, '%Y-%m') AS ${quoteMysqlIdentifier('__month_key')}`
    ].join(', ');
    const sqlParts = [`SELECT ${selectColumns} FROM ${quoteMysqlIdentifier('Marja_full')}`];
    const params = [];
    const monthRange = parseMonthKeyRange(monthKey);
    if (monthRange) {
        sqlParts.push(`WHERE ${quoteMysqlIdentifier('Месяц_начисления')} >= ? AND ${quoteMysqlIdentifier('Месяц_начисления')} < ?`);
        params.push(monthRange.start, monthRange.end);
    }
    sqlParts.push(`ORDER BY ${quoteMysqlIdentifier('Месяц_начисления')} DESC, ${quoteMysqlIdentifier('external_id')} DESC`);
    const sql = sqlParts.join(' ');
    const [rows] = await queryManagementMysql(sql, params);
    return rows;
}

async function fetchManagementReportFromProxy(monthKey = '') {
    if (!MANAGEMENT_PROXY_URL) return null;
    const target = new URL(MANAGEMENT_PROXY_URL);
    if (monthKey) target.searchParams.set('month', monthKey);
    const headers = {};
    if (MANAGEMENT_PROXY_TOKEN) {
        headers.Authorization = `Bearer ${MANAGEMENT_PROXY_TOKEN}`;
    }
    const response = await fetch(target, {
        headers,
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error(`Management proxy HTTP ${response.status}`);
    }
    return response.json();
}

async function fetchBootstrapFromProxy(forceRefresh = false) {
    if (!BOOTSTRAP_PROXY_URL) return null;
    const target = new URL(BOOTSTRAP_PROXY_URL);
    if (forceRefresh) target.searchParams.set('refresh', '1');
    const headers = {};
    if (BOOTSTRAP_PROXY_TOKEN) {
        headers.Authorization = `Bearer ${BOOTSTRAP_PROXY_TOKEN}`;
    }
    const response = await fetch(target, {
        headers,
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error(`Bootstrap proxy HTTP ${response.status}`);
    }
    return response.json();
}

async function ensureCabinetDbSchema() {
    if (!hasCabinetDbConfig()) return false;
    if (cabinetDbState.schemaReady) return true;
    if (!cabinetDbState.schemaPromise) {
        cabinetDbState.schemaPromise = withPgClient(getCabinetDbConfig(), async client => {
            await client.query(`
                CREATE TABLE IF NOT EXISTS cabinet_accounts (
                    phone TEXT NOT NULL,
                    list_element_id TEXT NOT NULL,
                    list_element_name TEXT NOT NULL DEFAULT '',
                    partner_bitrix_id TEXT NOT NULL DEFAULT '',
                    employee_id TEXT NOT NULL DEFAULT '',
                    employee_name TEXT NOT NULL DEFAULT '',
                    phone_masked TEXT NOT NULL DEFAULT '',
                    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    PRIMARY KEY (phone, list_element_id)
                );
            `);
            await client.query(`
                ALTER TABLE cabinet_accounts
                ADD COLUMN IF NOT EXISTS partner_bitrix_id TEXT NOT NULL DEFAULT '';
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS cabinet_auth_codes (
                    phone TEXT PRIMARY KEY,
                    code_hash TEXT NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS cabinet_sessions (
                    token TEXT PRIMARY KEY,
                    phone TEXT NOT NULL,
                    accounts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS cabinet_sync_runs (
                    id BIGSERIAL PRIMARY KEY,
                    source TEXT NOT NULL,
                    status TEXT NOT NULL,
                    accounts_count INTEGER NOT NULL DEFAULT 0,
                    note TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS bootstrap_snapshots (
                    snapshot_key TEXT PRIMARY KEY,
                    payload_json JSONB NOT NULL,
                    source TEXT NOT NULL DEFAULT 'dashboard-bootstrap',
                    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS bootstrap_sync_runs (
                    id BIGSERIAL PRIMARY KEY,
                    source TEXT NOT NULL,
                    status TEXT NOT NULL,
                    note TEXT NOT NULL DEFAULT '',
                    counts_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `);
        })
            .then(() => {
                cabinetDbState.schemaReady = true;
                return true;
            })
            .finally(() => {
                cabinetDbState.schemaPromise = null;
            });
    }
    return cabinetDbState.schemaPromise;
}

async function loadBootstrapSnapshotFromDb(snapshotKey = 'default') {
    if (!hasCabinetDbConfig()) return null;
    await ensureCabinetDbSchema();
    const { rows } = await queryCabinetDb(`
        SELECT payload_json, generated_at
        FROM bootstrap_snapshots
        WHERE snapshot_key = $1
        LIMIT 1
    `, [snapshotKey]);
    const row = rows[0];
    if (!row || !row.payload_json) return null;
    return {
        ...row.payload_json,
        bitrixPortalBase: row.payload_json.bitrixPortalBase || BITRIX_PORTAL_BASE || '',
        timestamp: row.payload_json.timestamp || new Date(row.generated_at).getTime()
    };
}

async function saveBootstrapSnapshotToDb(payload, snapshotKey = 'default') {
    if (!hasCabinetDbConfig()) return false;
    await ensureCabinetDbSchema();
    await queryCabinetDb(`
        INSERT INTO bootstrap_snapshots (snapshot_key, payload_json, source, generated_at)
        VALUES ($1, $2::jsonb, $3, NOW())
        ON CONFLICT (snapshot_key)
        DO UPDATE SET
            payload_json = EXCLUDED.payload_json,
            source = EXCLUDED.source,
            generated_at = NOW()
    `, [snapshotKey, JSON.stringify(payload), 'dashboard-bootstrap']);
    bootstrapDbState.lastSnapshot = payload;
    return true;
}

async function writeBootstrapSyncRun(status, note = '', counts = {}) {
    if (!hasCabinetDbConfig()) return;
    await ensureCabinetDbSchema();
    await queryCabinetDb(`
        INSERT INTO bootstrap_sync_runs (source, status, note, counts_json)
        VALUES ($1, $2, $3, $4::jsonb)
    `, ['dashboard-bootstrap', status, String(note || ''), JSON.stringify(counts || {})]);
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
        if (parsed.cacheVersion !== BOOTSTRAP_CACHE_VERSION) return;
        bootstrapCache.timestamp = Number(parsed.timestamp) || Date.now();
        bootstrapCache.data = {
            ...parsed.data,
            bitrixPortalBase: parsed.data.bitrixPortalBase || BITRIX_PORTAL_BASE || ''
        };
    } catch (error) {
        console.warn('loadBootstrapCacheFromDisk failed:', error.message || error);
    }
}

function saveBootstrapCacheToDisk(data) {
    try {
        fs.writeFileSync(BOOTSTRAP_CACHE_FILE, JSON.stringify({
            cacheVersion: BOOTSTRAP_CACHE_VERSION,
            timestamp: Date.now(),
            data
        }));
    } catch (error) {
        console.warn('saveBootstrapCacheToDisk failed:', error.message || error);
    }
}

async function handleSharedCache(req, res) {
    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        const raw = await readRequestBody(req);
        const parsed = JSON.parse(raw || '{}');
        if (!parsed || typeof parsed !== 'object') {
            sendJson(res, 400, { error: 'Invalid snapshot payload' });
            return;
        }

        const baseSnapshot = bootstrapCache.data || await loadBootstrapSnapshotFromDb() || {};
        const payload = {
            ...baseSnapshot,
            ...parsed,
            bitrixPortalBase: parsed.bitrixPortalBase || baseSnapshot.bitrixPortalBase || BITRIX_PORTAL_BASE || ''
        };
        bootstrapCache.timestamp = Number(payload.timestamp) || Date.now();
        bootstrapCache.data = payload;
        saveBootstrapCacheToDisk(payload);
        await saveBootstrapSnapshotToDb(payload);
        sendJson(res, 200, { ok: true });
    } catch (error) {
        sendJson(res, 400, { error: error.message || 'Shared cache save failed' });
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
        const transport = url.protocol === 'http:' ? http : https;
        const options = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || (url.protocol === 'http:' ? 80 : 443),
            path: `${url.pathname}${url.search}`,
            method,
            headers
        };

        const upstream = transport.request(options, response => {
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

function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `7${digits}`;
    if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
    return digits;
}

function maskPhone(value) {
    const phone = normalizePhone(value);
    if (phone.length < 4) return '';
    return `${phone.slice(0, 1)}***${phone.slice(-4)}`;
}

function parseCookies(req) {
    const raw = req.headers.cookie || '';
    return Object.fromEntries(raw.split(';').map(part => {
        const index = part.indexOf('=');
        if (index < 0) return ['', ''];
        return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }).filter(([key]) => key));
}

function toBase64Url(value) {
    return Buffer.from(String(value), 'utf8').toString('base64url');
}

function signCabinetSessionPayload(payload) {
    return crypto
        .createHmac('sha256', CABINET_SESSION_SECRET)
        .update(payload)
        .digest('base64url');
}

function createStatelessCabinetSessionToken(phone, accounts, expiresAt) {
    const payload = toBase64Url(JSON.stringify({
        v: 1,
        phone,
        accounts: Array.isArray(accounts) ? accounts : [],
        expiresAt
    }));
    const signature = signCabinetSessionPayload(payload);
    return `stateless.${payload}.${signature}`;
}

function parseStatelessCabinetSessionToken(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || parts[0] !== 'stateless') return null;
    const payload = parts[1];
    const signature = parts[2];
    if (signCabinetSessionPayload(payload) !== signature) return null;
    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!parsed || typeof parsed !== 'object') return null;
        const expiresAt = Number(parsed.expiresAt) || 0;
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
        return {
            token,
            phone: normalizePhone(parsed.phone),
            accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
            expiresAt
        };
    } catch (_) {
        return null;
    }
}

function getListPropertyValue(element, propName) {
    if (!element || !propName) return undefined;
    const variants = [
        propName,
        `${propName}_VALUE`,
        propName.replace(/^PROPERTY_/, ''),
        `${propName.replace(/^PROPERTY_/, '')}_VALUE`
    ];
    for (const key of variants) {
        if (Object.hasOwn(element, key)) return element[key];
    }
    return element.PROPERTIES?.[propName]?.VALUE
        ?? element.PROPERTIES?.[propName.replace(/^PROPERTY_/, '')]?.VALUE
        ?? element.PROPERTIES?.[propName]
        ?? element.PROPERTIES?.[propName.replace(/^PROPERTY_/, '')];
}

function normalizeBitrixUserId(value) {
    if (Array.isArray(value)) return value.map(normalizeBitrixUserId).find(Boolean) || '';
    if (value && typeof value === 'object') {
        const directValue = value.VALUE ?? value.value ?? value.ID ?? value.id;
        if (directValue != null && directValue !== '' && /^\d+$/.test(String(directValue).trim())) {
            return normalizeBitrixUserId(directValue);
        }
        return Object.values(value).map(normalizeBitrixUserId).find(Boolean) || '';
    }
    if (value == null) return '';
    const normalized = String(value).trim();
    return /^\d+$/.test(normalized) ? normalized : '';
}

function getUserPhone(user) {
    return normalizePhone(
        user?.PERSONAL_MOBILE
        || user?.PERSONAL_PHONE
        || user?.WORK_PHONE
        || user?.UF_PHONE_INNER
        || user?.phone
    );
}

function getUserName(user) {
    return `${user?.NAME || ''} ${user?.LAST_NAME || ''}`.trim() || user?.LOGIN || `Пользователь ${user?.ID || ''}`;
}

function normalizeCabinetAccount(account = {}) {
    const phone = normalizePhone(account.phone);
    return {
        phone,
        listElementId: String(account.listElementId ?? '').trim(),
        listElementName: String(account.listElementName ?? '').trim(),
        partnerBitrixId: String(account.partnerBitrixId ?? '').trim(),
        employeeId: String(account.employeeId ?? '').trim(),
        employeeName: String(account.employeeName ?? '').trim(),
        phoneMasked: maskPhone(phone)
    };
}

function flattenCabinetAccounts(accountsByPhone = {}) {
    const rows = [];
    for (const [phone, accounts] of Object.entries(accountsByPhone || {})) {
        for (const account of accounts || []) {
            rows.push(normalizeCabinetAccount({ ...account, phone }));
        }
    }
    return rows;
}

function groupCabinetAccounts(rows = []) {
    const grouped = {};
    for (const row of rows || []) {
        const account = normalizeCabinetAccount(row);
        if (!account.phone || !account.listElementId) continue;
        if (!grouped[account.phone]) grouped[account.phone] = [];
                grouped[account.phone].push({
                    listElementId: account.listElementId,
                    listElementName: account.listElementName,
                    partnerBitrixId: account.partnerBitrixId,
                    employeeId: account.employeeId,
                    employeeName: account.employeeName,
                    phoneMasked: account.phoneMasked
        });
    }
    return grouped;
}

async function buildCabinetAccounts() {
    const missingEnvVars = getMissingBootstrapEnvVars();
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required env vars: ${missingEnvVars.join(', ')}`);
    }

    const [elements, users] = await Promise.all([
        fetchAllListElements(CABINET_LIST_IBLOCK_ID),
        fetchAllUsers()
    ]);
    const usersById = new Map(users.map(user => [String(user.ID), user]));
    const accountsByPhone = {};

    for (const element of elements) {
        const employeeId = normalizeBitrixUserId(getListPropertyValue(element, CABINET_EMPLOYEE_PROP));
        if (!employeeId) continue;
        const partnerBitrixId = normalizeBitrixUserId(getListPropertyValue(element, CABINET_PARTNER_PROP));

        const user = usersById.get(String(employeeId));
        const phone = getUserPhone(user);
        if (!phone) continue;

        if (!accountsByPhone[phone]) accountsByPhone[phone] = [];
        accountsByPhone[phone].push({
            listElementId: String(element.ID ?? element.id ?? ''),
            listElementName: String(element.NAME ?? element.name ?? element.TITLE ?? '').trim(),
            partnerBitrixId,
            employeeId: String(employeeId),
            employeeName: getUserName(user),
            phoneMasked: maskPhone(phone)
        });
    }

    return accountsByPhone;
}

async function writeCabinetSyncRun(status, accountsCount, note = '') {
    if (!hasCabinetDbConfig()) return;
    await ensureCabinetDbSchema();
    await queryCabinetDb(`
        INSERT INTO cabinet_sync_runs (source, status, accounts_count, note)
        VALUES ($1, $2, $3, $4)
    `, ['bitrix-109', status, Number(accountsCount) || 0, String(note || '')]);
}

async function syncCabinetAccountsToDb(accountsByPhone) {
    if (!hasCabinetDbConfig()) return false;
    const rows = flattenCabinetAccounts(accountsByPhone);
    await ensureCabinetDbSchema();

    await withPgClient(getCabinetDbConfig(), async client => {
        await client.query('BEGIN');
        try {
            await client.query('DELETE FROM cabinet_accounts');
            for (const row of rows) {
                await client.query(`
                    INSERT INTO cabinet_accounts (
                        phone,
                        list_element_id,
                        list_element_name,
                        partner_bitrix_id,
                        employee_id,
                        employee_name,
                        phone_masked,
                        synced_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                `, [
                    row.phone,
                    row.listElementId,
                    row.listElementName,
                    row.partnerBitrixId,
                    row.employeeId,
                    row.employeeName,
                    row.phoneMasked
                ]);
            }
            await client.query(`
                INSERT INTO cabinet_sync_runs (source, status, accounts_count, note)
                VALUES ($1, $2, $3, $4)
            `, ['bitrix-109', 'ok', rows.length, 'syncCabinetAccountsToDb']);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    });
    return true;
}

async function loadCabinetAccountsFromDb() {
    if (!hasCabinetDbConfig()) return null;
    await ensureCabinetDbSchema();
    const { rows } = await queryCabinetDb(`
        SELECT
            phone,
            list_element_id,
            list_element_name,
            partner_bitrix_id,
            employee_id,
            employee_name,
            phone_masked
        FROM cabinet_accounts
        ORDER BY phone, list_element_name, list_element_id
    `);
    return groupCabinetAccounts(rows.map(row => ({
        phone: row.phone,
        listElementId: row.list_element_id,
        listElementName: row.list_element_name,
        partnerBitrixId: row.partner_bitrix_id,
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        phoneMasked: row.phone_masked
    })));
}

async function getCabinetAccounts(forceRefresh = false) {
    if (!forceRefresh && cabinetAccountsCache.data && Date.now() - cabinetAccountsCache.timestamp < BOOTSTRAP_CACHE_TTL) {
        return cabinetAccountsCache.data;
    }

    if (!cabinetAccountsCache.promise || forceRefresh) {
        cabinetAccountsCache.promise = (async () => {
            try {
                if (!forceRefresh && hasCabinetDbConfig()) {
                    const fromDb = await loadCabinetAccountsFromDb();
                    if (fromDb && Object.keys(fromDb).length > 0) {
                        cabinetAccountsCache.timestamp = Date.now();
                        cabinetAccountsCache.data = fromDb;
                        return fromDb;
                    }
                }

                const built = await buildCabinetAccounts();
                if (hasCabinetDbConfig()) {
                    await syncCabinetAccountsToDb(built);
                }
                cabinetAccountsCache.timestamp = Date.now();
                cabinetAccountsCache.data = built;
                return built;
            } catch (error) {
                if (hasCabinetDbConfig()) {
                    try {
                        await writeCabinetSyncRun('error', 0, error.message || 'sync failed');
                    } catch (_) {}
                }
                if (cabinetAccountsCache.data) return cabinetAccountsCache.data;
                throw error;
            } finally {
                cabinetAccountsCache.promise = null;
            }
        })();
    }

    return cabinetAccountsCache.promise;
}

async function deleteCabinetCode(phone) {
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb('DELETE FROM cabinet_auth_codes WHERE phone = $1', [phone]);
        return;
    }
    cabinetCodeStore.delete(phone);
}

async function getCabinetCodeRecord(phone) {
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        const { rows } = await queryCabinetDb(`
            SELECT phone, code_hash, attempts, expires_at
            FROM cabinet_auth_codes
            WHERE phone = $1
            LIMIT 1
        `, [phone]);
        const row = rows[0];
        if (!row) return null;
        return {
            phone: row.phone,
            codeHash: row.code_hash,
            attempts: Number(row.attempts) || 0,
            expiresAt: new Date(row.expires_at).getTime()
        };
    }
    return cabinetCodeStore.get(phone) || null;
}

async function upsertCabinetCode(phone, codeHash, expiresAt) {
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb(`
            INSERT INTO cabinet_auth_codes (phone, code_hash, attempts, expires_at, created_at, updated_at)
            VALUES ($1, $2, 0, TO_TIMESTAMP($3 / 1000.0), NOW(), NOW())
            ON CONFLICT (phone)
            DO UPDATE SET
                code_hash = EXCLUDED.code_hash,
                attempts = 0,
                expires_at = EXCLUDED.expires_at,
                updated_at = NOW()
        `, [phone, codeHash, Number(expiresAt)]);
        return;
    }
    cabinetCodeStore.set(phone, { codeHash, attempts: 0, expiresAt });
}

async function incrementCabinetCodeAttempts(phone) {
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb(`
            UPDATE cabinet_auth_codes
            SET attempts = attempts + 1, updated_at = NOW()
            WHERE phone = $1
        `, [phone]);
        return;
    }
    const record = cabinetCodeStore.get(phone);
    if (record) record.attempts += 1;
}

async function deleteCabinetSessionByToken(token) {
    if (!token) return;
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb('DELETE FROM cabinet_sessions WHERE token = $1', [token]);
        return;
    }
    cabinetSessionStore.delete(token);
}

async function updateCabinetSessionAccounts(token, accounts) {
    if (!token) return;
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb(`
            UPDATE cabinet_sessions
            SET accounts_json = $2::jsonb
            WHERE token = $1
        `, [token, JSON.stringify(accounts || [])]);
        return;
    }
    const session = cabinetSessionStore.get(token);
    if (session) session.accounts = accounts || [];
}

async function cleanupCabinetStores() {
    const now = Date.now();
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb('DELETE FROM cabinet_auth_codes WHERE expires_at <= NOW()');
        await queryCabinetDb('DELETE FROM cabinet_sessions WHERE expires_at <= NOW()');
        return;
    }
    for (const [phone, record] of cabinetCodeStore.entries()) {
        if (!record || record.expiresAt <= now) cabinetCodeStore.delete(phone);
    }
    for (const [token, session] of cabinetSessionStore.entries()) {
        if (!session || session.expiresAt <= now) cabinetSessionStore.delete(token);
    }
}

async function sendWhatsAppCode(phone, code) {
    const targetPhone = CABINET_CODE_TARGET_PHONE || phone;
    const targetNote = targetPhone === phone ? '' : ` Запрошен для номера ${maskPhone(phone)}.`;
    const message = `Код входа в кабинет Квадрат мечты: ${code}. Действует 5 минут.${targetNote}`;
    if (!WHATSAPP_BOT_URL) {
        return { sent: false, devCode: code };
    }

    const body = JSON.stringify({ phone, to: targetPhone, code, message });
    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    };
    if (WHATSAPP_BOT_TOKEN) {
        headers.Authorization = `Bearer ${WHATSAPP_BOT_TOKEN}`;
        headers['x-secret'] = WHATSAPP_BOT_TOKEN;
    }

    const upstream = await proxyRequest(WHATSAPP_BOT_URL, {
        method: 'POST',
        headers,
        body
    });

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
        throw new Error(`WhatsApp bot HTTP ${upstream.statusCode}`);
    }

    return { sent: true };
}

async function createCabinetSession(phone, accounts) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + CABINET_SESSION_TTL;
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        await queryCabinetDb(`
            INSERT INTO cabinet_sessions (token, phone, accounts_json, expires_at, created_at)
            VALUES ($1, $2, $3::jsonb, TO_TIMESTAMP($4 / 1000.0), NOW())
        `, [token, phone, JSON.stringify(accounts || []), Number(expiresAt)]);
        return { token, expiresAt };
    }
    cabinetSessionStore.set(token, { phone, accounts, expiresAt });
    return { token, expiresAt };
}

async function getCabinetSession(req) {
    const token = parseCookies(req).cabinet_session;
    if (!token) return null;
    const statelessSession = parseStatelessCabinetSessionToken(token);
    if (statelessSession) return statelessSession;
    await cleanupCabinetStores();
    if (hasCabinetDbConfig()) {
        await ensureCabinetDbSchema();
        const { rows } = await queryCabinetDb(`
            SELECT token, phone, accounts_json, expires_at
            FROM cabinet_sessions
            WHERE token = $1
            LIMIT 1
        `, [token]);
        const row = rows[0];
        if (!row) return null;
        const expiresAt = new Date(row.expires_at).getTime();
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
            await deleteCabinetSessionByToken(token);
            return null;
        }
        return {
            token: row.token,
            phone: normalizePhone(row.phone),
            accounts: Array.isArray(row.accounts_json) ? row.accounts_json : [],
            expiresAt
        };
    }
    const session = cabinetSessionStore.get(token);
    if (!session || session.expiresAt <= Date.now()) {
        cabinetSessionStore.delete(token);
        return null;
    }
    return { token, ...session };
}

function shouldRefreshSessionAccounts(sessionAccounts = []) {
    return (sessionAccounts || []).some(account => account && typeof account === 'object' && !account.partnerBitrixId);
}

function canChooseCabinetPartner(phone) {
    return Boolean(CABINET_PARTNER_PICKER_PHONE) && normalizePhone(phone) === CABINET_PARTNER_PICKER_PHONE;
}

async function loadCabinetAccountsForPhone(phone, forceRefresh = false) {
    const allowPartnerPicker = canChooseCabinetPartner(phone);
    try {
        const accountsByPhone = await getCabinetAccounts(forceRefresh);
        return {
            accounts: accountsByPhone[phone] || [],
            allowPartnerPicker
        };
    } catch (error) {
        if (!allowPartnerPicker) throw error;
        console.warn(`Cabinet accounts lookup failed for picker phone ${phone}:`, error.message || error);
        return {
            accounts: [],
            allowPartnerPicker
        };
    }
}

function cabinetCookie(token, expiresAt) {
    const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return `cabinet_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

async function handleCabinetAuth(req, res, pathname) {
    if (pathname === '/api/cabinet/me') {
        const session = await getCabinetSession(req);
        if (!session) {
            sendJson(res, 200, { authenticated: false });
            return;
        }
        let accounts = Array.isArray(session.accounts) ? session.accounts : [];
        if (hasCabinetDbConfig() || shouldRefreshSessionAccounts(accounts)) {
            const accountsByPhone = await getCabinetAccounts(false).catch(() => null);
            const latest = accountsByPhone?.[normalizePhone(session.phone)] || [];
            if (latest.length > 0) {
                accounts = latest;
                if (JSON.stringify(accounts) !== JSON.stringify(session.accounts || [])) {
                    await updateCabinetSessionAccounts(session.token, accounts);
                }
            }
        }
        sendJson(res, 200, {
            authenticated: true,
            phoneMasked: maskPhone(session.phone),
            canChoosePartner: canChooseCabinetPartner(session.phone),
            accounts
        });
        return;
    }

    if (pathname === '/api/cabinet/logout') {
        const session = await getCabinetSession(req);
        if (session?.token) await deleteCabinetSessionByToken(session.token);
        sendJsonWithHeaders(res, 200, { ok: true }, {
            'Set-Cookie': 'cabinet_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        });
        return;
    }

    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    const raw = await readRequestBody(req);
    const payload = JSON.parse(raw || '{}');

    if (pathname === '/api/cabinet/request-code') {
        const phone = normalizePhone(payload.phone);
        if (!phone) {
            sendJson(res, 400, { error: 'Введите номер WhatsApp' });
            return;
        }

        const { accounts, allowPartnerPicker } = await loadCabinetAccountsForPhone(phone, Boolean(payload.refresh));
        if (accounts.length === 0 && !allowPartnerPicker) {
            sendJson(res, 404, { error: 'Номер не найден в инфоблоке 109' });
            return;
        }

        if (allowPartnerPicker) {
            const expiresAt = Date.now() + CABINET_SESSION_TTL;
            const token = createStatelessCabinetSessionToken(phone, accounts, expiresAt);
            sendJsonWithHeaders(res, 200, {
                ok: true,
                autoLogin: true,
                phoneMasked: maskPhone(phone),
                canChoosePartner: true,
                accounts
            }, {
                'Set-Cookie': cabinetCookie(token, expiresAt)
            });
            return;
        }

        const code = String(crypto.randomInt(100000, 999999));
        await upsertCabinetCode(
            phone,
            crypto.createHash('sha256').update(code).digest('hex'),
            Date.now() + CABINET_CODE_TTL
        );
        const result = await sendWhatsAppCode(phone, code);
        sendJson(res, 200, {
            ok: true,
            phoneMasked: maskPhone(phone),
            devCode: result.devCode
        });
        return;
    }

    if (pathname === '/api/cabinet/verify-code') {
        const phone = normalizePhone(payload.phone);
        const code = String(payload.code || '').replace(/\D/g, '');
        const record = await getCabinetCodeRecord(phone);
        if (!record || record.expiresAt <= Date.now()) {
            await deleteCabinetCode(phone);
            sendJson(res, 400, { error: 'Код устарел, запросите новый' });
            return;
        }
        if (record.attempts >= 5) {
            await deleteCabinetCode(phone);
            sendJson(res, 429, { error: 'Слишком много попыток, запросите новый код' });
            return;
        }

        const codeHash = crypto.createHash('sha256').update(code).digest('hex');
        if (codeHash !== record.codeHash) {
            await incrementCabinetCodeAttempts(phone);
            sendJson(res, 400, { error: 'Неверный код' });
            return;
        }

        const { accounts, allowPartnerPicker } = await loadCabinetAccountsForPhone(phone);
        if (accounts.length === 0 && !allowPartnerPicker) {
            sendJson(res, 404, { error: 'Номер больше не привязан к кабинету' });
            return;
        }

        await deleteCabinetCode(phone);
        const session = await createCabinetSession(phone, accounts);
        sendJsonWithHeaders(res, 200, {
            ok: true,
            phoneMasked: maskPhone(phone),
            canChoosePartner: canChooseCabinetPartner(phone),
            accounts
        }, {
            'Set-Cookie': cabinetCookie(session.token, session.expiresAt)
        });
        return;
    }

    sendJson(res, 404, { error: 'Cabinet endpoint not found' });
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
                d1.period_label,
                COUNT(*)::int AS payments_count,
                COALESCE(SUM(d1.amount), 0)::text AS total_amount
            FROM distribution_batch_items d1
            LEFT JOIN distribution_batches d ON d1.batch_id = d.id
            LEFT JOIN users u ON d.partner_id = u.id
            WHERE d1.is_rolled_back IS FALSE
              AND d.partner_id IS NOT NULL
              AND d1.period_year >= 2026
              AND d1.expense_type = ANY($1)
            GROUP BY d.partner_id, u.name, d1.period_year, d1.period_month, d1.period_label
        `, [FOT_HUMAN_EXPENSE_TYPES]);
        return rows;
    } finally {
        await client.end();
    }
}

function assembleBootstrapPayload(data = {}) {
    const partnerMap = data.partnerMap || {};
    const companyMap = data.companyMap || {};
    const list115PartnerByElementId = data.list115PartnerByElementId || {};
    const lastUserMap = data.lastUserMap || {};
    const accountCoefficientRows = data.accountCoefficientRows || [];
    const deals69 = Array.isArray(data.deals69) ? data.deals69 : [];
    const deals79 = Array.isArray(data.deals79) ? data.deals79 : [];
    const remarkDeals = Array.isArray(data.remarkDeals) ? data.remarkDeals : [];
    const callsItems = Array.isArray(data.callsItems) ? data.callsItems : [];
    const disciplineItems = Array.isArray(data.disciplineItems) ? data.disciplineItems : [];
    const opuItems = Array.isArray(data.opuItems) ? data.opuItems : [];
    const managementItems = Array.isArray(data.managementItems) ? data.managementItems : [];
    const fotDbItems = Array.isArray(data.fotDbItems) ? data.fotDbItems : [];

    return {
        bitrixPortalBase: BITRIX_PORTAL_BASE,
        partnerMap,
        companyMap,
        list115PartnerByElementId,
        lastUserMap,
        accountCoefficientRows,
        deals69,
        deals79,
        remarkDeals,
        callsItems,
        disciplineItems,
        opuItems,
        managementItems,
        fotDbItems,
        counts: {
            partners117: Object.keys(partnerMap).length,
            refs115: Object.keys(list115PartnerByElementId).length,
            users: Object.keys(lastUserMap).length,
            companies: Object.keys(companyMap).length,
            deals69: deals69.length,
            deals79: deals79.length,
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
        deals79,
        remarkDeals,
        callsItems,
        disciplineItems,
        opuItems,
        managementItems,
        fotDbItems
    ] = await Promise.all([
        fetchAllDeals(69, SELECT_DEALS),
        fetchAllDeals(79, SELECT_DEALS),
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

    return assembleBootstrapPayload({
        partnerMap,
        companyMap,
        list115PartnerByElementId,
        lastUserMap: userMap,
        accountCoefficientRows,
        deals69,
        deals79,
        remarkDeals,
        callsItems,
        disciplineItems,
        opuItems,
        managementItems,
        fotDbItems
    });
}

async function handleBootstrap(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const forceRefresh = requestUrl.searchParams.get('refresh') === '1';

    if (BOOTSTRAP_PROXY_URL) {
        try {
            const payload = await fetchBootstrapFromProxy(forceRefresh);
            bootstrapCache.timestamp = Number(payload?.timestamp) || Date.now();
            bootstrapCache.data = payload;
            sendJson(res, 200, payload);
            return;
        } catch (error) {
            console.warn('fetchBootstrapFromProxy failed:', error.message || error);
        }
    }

    if (!forceRefresh) {
        if (bootstrapCache.data) {
            sendJson(res, 200, {
                ...bootstrapCache.data,
                bitrixPortalBase: bootstrapCache.data.bitrixPortalBase || BITRIX_PORTAL_BASE || ''
            });
            return;
        }
        const dbSnapshot = await loadBootstrapSnapshotFromDb().catch(error => {
            console.warn('loadBootstrapSnapshotFromDb failed:', error.message || error);
            return null;
        });
        if (dbSnapshot) {
            bootstrapCache.timestamp = Number(dbSnapshot.timestamp) || Date.now();
            bootstrapCache.data = dbSnapshot;
            sendJson(res, 200, {
                ...dbSnapshot,
                bitrixPortalBase: dbSnapshot.bitrixPortalBase || BITRIX_PORTAL_BASE || ''
            });
            return;
        }
    }

    if (!bootstrapCache.promise || forceRefresh) {
        bootstrapCache.promise = buildBootstrapData()
            .then(async data => {
                const payload = {
                    ...data,
                    bitrixPortalBase: data.bitrixPortalBase || BITRIX_PORTAL_BASE || '',
                    timestamp: Date.now()
                };
                bootstrapCache.timestamp = payload.timestamp;
                bootstrapCache.data = payload;
                saveBootstrapCacheToDisk(payload);
                await saveBootstrapSnapshotToDb(payload).catch(async error => {
                    console.warn('saveBootstrapSnapshotToDb failed:', error.message || error);
                    await writeBootstrapSyncRun('error', error.message || 'save snapshot failed', data.counts || {})
                        .catch(syncError => {
                            console.warn('writeBootstrapSyncRun(error) failed:', syncError.message || syncError);
                        });
                    return false;
                });
                await writeBootstrapSyncRun('ok', forceRefresh ? 'refresh=1' : 'rebuild', data.counts || {})
                    .catch(error => {
                        console.warn('writeBootstrapSyncRun(ok) failed:', error.message || error);
                    });
                return payload;
            })
            .finally(() => {
                bootstrapCache.promise = null;
            });
    }

    try {
        const data = await bootstrapCache.promise;
        sendJson(res, 200, {
            ...data,
            bitrixPortalBase: data.bitrixPortalBase || BITRIX_PORTAL_BASE || ''
        });
    } catch (error) {
        sendJson(res, 502, { error: error.message || 'Bootstrap load failed' });
    }
}

async function handleBootstrapSync(req, res) {
    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        const data = await buildBootstrapData();
        const payload = {
            ...data,
            bitrixPortalBase: data.bitrixPortalBase || BITRIX_PORTAL_BASE || '',
            timestamp: Date.now()
        };
        bootstrapCache.timestamp = payload.timestamp;
        bootstrapCache.data = payload;
        saveBootstrapCacheToDisk(payload);
        await saveBootstrapSnapshotToDb(payload).catch(error => {
            console.warn('saveBootstrapSnapshotToDb failed:', error.message || error);
            return false;
        });
        await writeBootstrapSyncRun('ok', 'manual sync endpoint', data.counts || {}).catch(error => {
            console.warn('writeBootstrapSyncRun(ok) failed:', error.message || error);
        });
        sendJson(res, 200, {
            ok: true,
            timestamp: payload.timestamp,
            counts: data.counts || {}
        });
    } catch (error) {
        await writeBootstrapSyncRun('error', error.message || 'manual sync failed').catch(syncError => {
            console.warn('writeBootstrapSyncRun(error) failed:', syncError.message || syncError);
        });
        sendJson(res, 502, { error: error.message || 'Bootstrap sync failed' });
    }
}

async function handleManagementReport(req, res) {
    if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);
        const month = String(requestUrl.searchParams.get('month') || '').trim();
        if (MANAGEMENT_PROXY_URL) {
            const payload = await fetchManagementReportFromProxy(month);
            sendJson(res, 200, payload);
            return;
        }
        const rows = await fetchManagementRows(month);
        sendJson(res, 200, {
            source: 'Marja_full',
            month: month || 'all',
            rows,
            counts: {
                rows: rows.length,
                months: new Set(rows.map(row => row.__month_key || '')).size
            }
        });
    } catch (error) {
        sendJson(res, 502, { error: error.message || 'Management report failed' });
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

    if (pathname === '/api/bootstrap/sync') {
        await handleBootstrapSync(req, res);
        return;
    }

    if (pathname === '/api/management-report') {
        await handleManagementReport(req, res);
        return;
    }

    if (pathname === '/api/shared-cache') {
        await handleSharedCache(req, res);
        return;
    }

    if (pathname.startsWith('/api/cabinet/')) {
        await handleCabinetAuth(req, res, pathname);
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
    createServer().listen(PORT, HOST, () => {
        console.log(`Dashboard server running at http://${HOST}:${PORT}/`);
    });
}

module.exports = {
    requestListener,
    createServer,
    assembleBootstrapPayload,
    normalizePhone,
    normalizeBitrixUserId,
    flattenCabinetAccounts,
    groupCabinetAccounts,
    getCabinetDbConfig
};
