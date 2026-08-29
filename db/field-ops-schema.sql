-- Схема field_ops в БД kvadrat_cabinet — данные под новую матрицу «Квадрат мечты»
-- для показателей, у которых пока нет источника в Bitrix: аудит-чек-лист (45 критериев)
-- и объезды партнёров/кураторов. См. план перехода на новую матрицу scoring в dashboard.js
-- (getAuditQ/getRoundsQ сейчас — заглушки Q=1.0, будут читать эти таблицы).
--
-- Создаётся от имени kvadrat_app (без sudo/superuser — CREATEDB ему не дан,
-- но CREATE SCHEMA/TABLE внутри kvadrat_cabinet разрешён).

CREATE SCHEMA IF NOT EXISTS field_ops AUTHORIZATION kvadrat_app;

-- Каталог критериев чек-листа аудита (заполняется вручную/через будущее приложение)
CREATE TABLE IF NOT EXISTS field_ops.audit_checklist_items (
    id          SERIAL PRIMARY KEY,
    code        TEXT UNIQUE NOT NULL,
    category    TEXT,
    label       TEXT NOT NULL,
    weight      NUMERIC(6,2) NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Один аудит-визит на объект
CREATE TABLE IF NOT EXISTS field_ops.audit_checks (
    id            SERIAL PRIMARY KEY,
    deal_id       TEXT,           -- ID сделки-объекта (категория 79) в Bitrix
    partner_id    TEXT NOT NULL,  -- Bitrix user ID партнёра
    auditor_name  TEXT,
    checked_at    DATE NOT NULL,
    total_items   INTEGER NOT NULL DEFAULT 0,
    passed_items  INTEGER NOT NULL DEFAULT 0,
    score_pct     NUMERIC(5,2),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_checks_partner_date
    ON field_ops.audit_checks (partner_id, checked_at);

-- Ответы по каждому критерию в рамках одного аудит-визита
CREATE TABLE IF NOT EXISTS field_ops.audit_check_answers (
    id          SERIAL PRIMARY KEY,
    check_id    INTEGER NOT NULL REFERENCES field_ops.audit_checks(id) ON DELETE CASCADE,
    item_id     INTEGER NOT NULL REFERENCES field_ops.audit_checklist_items(id),
    passed      BOOLEAN NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (check_id, item_id)
);

-- Объезды партнёров и кураторов (норматив: 1 объезд/объект/месяц)
CREATE TABLE IF NOT EXISTS field_ops.partner_rounds (
    id          SERIAL PRIMARY KEY,
    partner_id  TEXT NOT NULL,
    deal_id     TEXT,             -- посещённый объект (категория 79), если объезд по объекту
    curator_id  TEXT,
    round_date  DATE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'skipped')),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_rounds_partner_date
    ON field_ops.partner_rounds (partner_id, round_date);

GRANT USAGE ON SCHEMA field_ops TO kvadrat_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA field_ops TO kvadrat_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA field_ops TO kvadrat_app;
