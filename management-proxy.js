const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
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

const PORT = Number(process.env.MANAGEMENT_PROXY_PORT || 3011);
const HOST = process.env.MANAGEMENT_PROXY_HOST || '0.0.0.0';
const MANAGEMENT_PROXY_TOKEN = process.env.MANAGEMENT_PROXY_TOKEN || '';
const BOOTSTRAP_UPSTREAM_URL = process.env.BOOTSTRAP_UPSTREAM_URL || 'http://127.0.0.1:3008/api/bootstrap';
const CABINET_UPSTREAM_BASE_URL = process.env.CABINET_UPSTREAM_BASE_URL || 'http://127.0.0.1:3008';
const WHATSAPP_INTERNAL_API_URL = process.env.WHATSAPP_INTERNAL_API_URL || 'http://127.0.0.1:3010/send';
const WHATSAPP_INTERNAL_API_SECRET = process.env.WHATSAPP_INTERNAL_API_SECRET || '';
const MANAGEMENT_MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || '',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DBNAME || process.env.MYSQL_DATABASE || ''
};

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

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

function getManagementMysqlConfig() {
    if (!MANAGEMENT_MYSQL_CONFIG.host || !MANAGEMENT_MYSQL_CONFIG.user || !MANAGEMENT_MYSQL_CONFIG.password || !MANAGEMENT_MYSQL_CONFIG.database) {
        return null;
    }
    return { ...MANAGEMENT_MYSQL_CONFIG };
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

async function fetchManagementRows(monthKey = '') {
    const config = getManagementMysqlConfig();
    if (!config) {
        throw new Error('Management MySQL is not configured');
    }
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
    const [rows] = await withMysqlClient(config, client => client.query(sql, params));
    return rows;
}

function isAuthorized(req) {
    if (!MANAGEMENT_PROXY_TOKEN) return true;
    const header = req.headers.authorization || '';
    return header === `Bearer ${MANAGEMENT_PROXY_TOKEN}`;
}

async function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 1024 * 1024) {
                reject(new Error('Request body too large'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(raw));
        req.on('error', reject);
    });
}

async function proxyToUpstream(target, { method = 'GET', headers = {}, body = null } = {}) {
    const response = await fetch(target, {
        method,
        headers,
        body
    });
    return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text()
    };
}

async function requestListener(req, res) {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (requestUrl.pathname === '/health') {
        sendJson(res, 200, { ok: true });
        return;
    }
    if (!isAuthorized(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
    }
    if (requestUrl.pathname === '/api/bootstrap') {
        try {
            const target = new URL(BOOTSTRAP_UPSTREAM_URL);
            if (requestUrl.searchParams.get('refresh') === '1') {
                target.searchParams.set('refresh', '1');
            }
            const upstream = await proxyToUpstream(target);
            res.writeHead(upstream.status, {
                'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            });
            res.end(upstream.body);
            return;
        } catch (error) {
            sendJson(res, 502, { error: error.message || 'Bootstrap proxy failed' });
            return;
        }
    }
    if (requestUrl.pathname.startsWith('/api/cabinet/')) {
        try {
            const target = new URL(`${CABINET_UPSTREAM_BASE_URL.replace(/\/$/, '')}${requestUrl.pathname}${requestUrl.search}`);
            const body = req.method === 'POST' ? await readRequestBody(req) : null;
            const headers = {};
            const contentType = req.headers['content-type'];
            if (contentType) headers['Content-Type'] = contentType;
            if (body) headers['Content-Length'] = Buffer.byteLength(body);
            const upstream = await proxyToUpstream(target, {
                method: req.method || 'GET',
                headers,
                body
            });
            const responseHeaders = {
                'Content-Type': upstream.headers['content-type'] || 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            };
            if (upstream.headers['set-cookie']) {
                responseHeaders['Set-Cookie'] = upstream.headers['set-cookie'];
            }
            res.writeHead(upstream.status, responseHeaders);
            res.end(upstream.body);
            return;
        } catch (error) {
            sendJson(res, 502, { error: error.message || 'Cabinet proxy failed' });
            return;
        }
    }
    if (requestUrl.pathname === '/api/whatsapp-send-code') {
        if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
        }
        if (!WHATSAPP_INTERNAL_API_SECRET) {
            sendJson(res, 500, { error: 'WhatsApp internal API secret is not configured' });
            return;
        }
        try {
            const body = await readRequestBody(req);
            const response = await fetch(WHATSAPP_INTERNAL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-secret': WHATSAPP_INTERNAL_API_SECRET
                },
                body
            });
            const payload = await response.text();
            res.writeHead(response.status, {
                'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            });
            res.end(payload);
            return;
        } catch (error) {
            sendJson(res, 502, { error: error.message || 'WhatsApp proxy failed' });
            return;
        }
    }
    if (requestUrl.pathname !== '/api/management-report') {
        sendJson(res, 404, { error: 'Not found' });
        return;
    }
    if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }
    try {
        const month = String(requestUrl.searchParams.get('month') || '').trim();
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

if (require.main === module) {
    http.createServer((req, res) => {
        requestListener(req, res).catch(error => {
            sendJson(res, 500, { error: error.message || 'Internal server error' });
        });
    }).listen(PORT, HOST, () => {
        console.log(`Management proxy running at http://${HOST}:${PORT}/`);
    });
}

module.exports = {
    requestListener
};
