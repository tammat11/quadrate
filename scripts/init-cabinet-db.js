const fs = require('node:fs');
const path = require('node:path');
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

async function main() {
    const rootDir = path.join(__dirname, '..');
    loadEnvFile(path.join(rootDir, '.env.local'));
    loadEnvFile(path.join(rootDir, '.env'));

    const connectionString = process.env.CABINET_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
    const config = connectionString
        ? {
            connectionString,
            ssl: process.env.CABINET_DB_SSL === '1' || process.env.CABINET_DB_SSL === 'true'
                ? { rejectUnauthorized: false }
                : undefined
        }
        : {
            host: process.env.CABINET_DB_HOST || process.env.DB_HOST || '',
            port: Number(process.env.CABINET_DB_PORT || process.env.DB_PORT || 5432),
            user: process.env.CABINET_DB_USER || process.env.DB_USER || '',
            password: process.env.CABINET_DB_PASSWORD || process.env.DB_PASSWORD || '',
            database: process.env.CABINET_DB_NAME || process.env.DB_NAME || '',
            ssl: process.env.CABINET_DB_SSL === '1' || process.env.CABINET_DB_SSL === 'true'
                ? { rejectUnauthorized: false }
                : undefined
        };

    if (!config.connectionString && (!config.host || !config.user || !config.password || !config.database)) {
        throw new Error('Cabinet DB env vars are not configured');
    }

    const schemaPath = path.join(rootDir, 'db', 'cabinet-schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const client = new Client(config);
    await client.connect();
    try {
        await client.query(sql);
        console.log(`Cabinet DB schema initialized from ${schemaPath}`);
    } finally {
        await client.end();
    }
}

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});
