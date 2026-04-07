const BITRIX_PROXY_URL = '/api/bitrix/';
const CLOCKSTER_PROXY_URL = '/api/clockster';
const BOOTSTRAP_URL = '/api/bootstrap';

// ——— Конфиг ———
const CATEGORY_REALIZATION = '69';
const CATEGORY_REMARKS = '81';
const EXCLUDED_PARTNERS = ['IC Line', 'Баканова Д.', 'Ибрашев Э.', 'Исабек Б.', 'Без партнёра', 'Мусаев А.'];

const FIELDS = {
    REMARK_DATE: 'UF_CRM_REVIEWDATE',
    FEEDBACK_DATE: 'UF_CRM_FITBACK',
    REMARK_SOURCE: 'UF_CRM_1719824872888',
    AUDIT_CHECK_DATE: 'UF_CRM_1732104149680',
    MONTH_ACCRUAL: 'UF_CRM_1707145268405',
    PARTNER: 'UF_CRM_1743669674',
    CALLS_PARTNER: 'UF_CRM_173_PARTNER',
    CALLS_DATE: 'UF_CRM_173_1775114484085',
    OPU_PARTNER: 'UF_CRM_127_1756273714',
    OPU_MONTH: 'UF_CRM_127_1756272780',
    OPU_MONTH_NUMBER: 'UF_CRM_127_1756290422310',
    AREA: 'UF_CRM_1707724024179',
    OPU_AVERAGE_SUM: 'UF_CRM_KASJD12',
    MGMT_SCORE: 'UF_CRM_127_MGMT_SCORE'
};

const CATEGORY_REALIZATION_COPY = '79';
const FOT_TRIGGER_STAGE_IDS = new Set(['C69:UC_966DTL', 'C79:UC_JK572B']);
const FOT_DB_MONTH_SHIFT = 0;
const FOT_DB_PARTNER_OVERRIDES = {
    '2361989': 105,
    '2361991': 1509,
    '2361995': 1432,
    '2361997': 83,
    '2361999': 15,
    '2362003': 1770,
    '2362005': 1116,
    '2362007': 374,
    '2362009': 1716,
    '2362011': 1534,
    '2362015': 2051,
    '2362017': 1427,
    '2362019': 1657,
    '2362023': 1912,
    '2362025': 10,
    '2362027': 14,
    '2362029': 2248,
    '2362031': 1937,
    '2362033': 153,
    '2362041': 1504,
    '2656525': 1943,
    '3144937': 21,
    '3370865': 92,
    '3421309': 1794,
    '3849905': 106
};
const HOURS_BASED_DISCIPLINE_PARTNERS = new Set(['3370865', '2362023']);
const HOURS_BASED_DISCIPLINE_NAMES = new Set(['туймебеков б.', 'ли а.']);
const MANUAL_DISCIPLINE_LIMITS = {
    '2362011': { maxQ: 0.2, penaltyPercent: 80, label: 'Ильиных Татьяна' },
    '2362009': { maxQ: 0.8, penaltyPercent: 20, label: 'Илиясов Р.' },
    '3370865': { maxQ: 0.6, penaltyPercent: 40, label: 'Туймебеков Б.' }
};
const REMARKS_RELIEF_MAX = 0.35;
const CLOCKSTER_PARTNER_TO_USER = {
    '3421309': 566091,
    '2362011': 474121,
    '2362007': 553792,
    '2361995': 558744,
    '3849905': 559053,
    '2361999': 558252,
    '2362025': 594445,
    '2362021': 559063,
    '2362017': 545732,
    '2361991': 552826,
    '2362005': 553469,
    '2362041': 550874,
    '2362015': 550288,
    '2362019': 549431,
    '2362031': 558295,
    '2362003': 565933,
    '2362009': 558807,
    '2362013': 554970,
    '2362033': 559610,
    '3144937': 556023,
    '3370865': 578019,
    '2362029': 579840,
    '3960581': 614391,
    '2361989': 558240,
    '2362027': 570178,
    '2361997': 558236
};
const CLOCKSTER_HOURS_BASED_PARTNERS = new Set(['3370865', '2362023']);
const CALLS_SCORE_FIELDS = [
    {
        field: 'UF_CRM_173_1771396927',
        map: { '1': 1, '2': 2, '3': 3, '141215': 1, '141217': 2, '141219': 3 }
    },
    {
        field: 'UF_CRM_173_1771397355616',
        map: { 'Да': 3, 'Нет': 0, '141221': 3, '141223': 0 }
    },
    {
        field: 'UF_CRM_173_1771397383665',
        map: { 'Да': 3, 'Нет': 0, '141225': 3, '141227': 0 }
    },
    {
        field: 'UF_CRM_173_1771398284442',
        map: { 'Да': 3, 'Нет': 0, '141229': 3, '141231': 0 }
    },
    {
        field: 'UF_CRM_173_1771398356499',
        map: { '1': 1, '2': 2, '3': 3, '141233': 1, '141235': 2, '141237': 3 }
    }
];

const LIST_PARTNERS_IBLOCK_ID = 117;
const LIST_CALLS_REF_IBLOCK_ID = 115;
const LIST_115_PARTNER_PROP = 'PROPERTY_905';
const ENTITY_CALLS = '1364';
const ENTITY_OPU = '1254';
const CATEGORY_CALLS = 431;
const CATEGORY_DISCIPLINE = 439;
const CATEGORY_TRAINING = 311;
const CATEGORY_MANAGEMENT = 441;
const REPORTING_MONTH_START = '2026-03';
const REPORTING_MONTH_END = '2027-03';
const SUMMARY_FILTER_VALUE = 'summary';
const AUDIT_REMARK_SOURCE_IDS = new Set(['43609']);
const AUDIT_REMARK_SOURCE_LABELS = new Set(['от аудитора замечание', 'от аудитора замечания']);
const NEGATIVE_REMARK_SOURCE_IDS = new Set(['43609', '43607', '43735', '43709', '151243']);
const NEGATIVE_REMARK_LABEL_PARTS = ['замечание'];
const POSITIVE_REMARK_SOURCE_IDS = new Set(['43713', '43711', '43715']);
const POSITIVE_REMARK_SOURCE_LABEL_PARTS = ['положительный отзыв'];
const AUDIT_NEGATIVE_DEAL_PENALTY = 0.5;

const MATRIX = {
    relations: [
        { key: 'calls', influence: 3, weight: 4 },
        { key: 'remarks', influence: 2, weight: 4 },
        { key: 'audit', influence: 2, weight: 5 },
    ],
    money: [
        { key: 'realization', influence: 2, weight: 6 },
        { key: 'upravlenka', influence: 3, weight: 6 },
    ],
    operations: [
        { key: 'clockster', influence: 3, weight: 6 },
        { key: 'training', influence: 1, weight: 8 },
        { key: 'discipline', influence: 3, weight: 3 },
        { key: 'umsrm', influence: 3, weight: 2 },
    ]
};

const OPU_COMPLEXITY_SOURCE = [
    { value: 93, aliases: ['Абдуахат Болатбек', 'Болатбек А.'] },
    { value: 47, aliases: ['Айгерим Кабиева', 'Кабиева А.'] },
    { value: 88, aliases: ['Айжан Алматы Айткулова', 'Айткулова А.'] },
    { value: 81, aliases: ['Ания Аубакирова', 'Аубакирова А.'] },
    { value: 154, aliases: ['Бакытгул Калиаскар', 'Калиаскар Б.'] },
    { value: 182, aliases: ['Гульмира Оспанова', 'Оспанова Г'] },
    { value: 208, aliases: ['Елена НПО Зобова', 'Зобова Е.'] },
    { value: 93, aliases: ['Ербол Алматы Нысанбеков', 'Нысанбеков Е.'] },
    { value: 33, aliases: ['Еркебулан Нуртас'] },
    { value: 12, aliases: ['Жандос Альсейтов'] },
    { value: 85, aliases: ['Зоя Рузиева', 'Рузиева Зоя'] },
    { value: 96, aliases: ['Исабек Болатбек', 'Исабек Б.'] },
    { value: 49, aliases: ['Марат Исмагамбетов', 'Исмагамбетов М'] },
    { value: 66, aliases: ['Мукарям Назарова', 'Назарова М.'] },
    { value: 34, aliases: ['Мухаббат Алматы Куатова', 'Куатова М.'] },
    { value: 104, aliases: ['Ольга Астана Полоз', 'Полоз О.'] },
    { value: 120, aliases: ['Рабинур Алматы Мусаева', 'Мусаева Р.'] },
    { value: 75, aliases: ['Рашид Илиясов', 'Илиясов Р.'] },
    { value: 138, aliases: ['Римма Бут', 'Бут Р.'] },
    { value: 25, aliases: ['Роза Алматы Ерасылова', 'Роза Ерасылова'] },
    { value: 1, aliases: ['Сабит Матов'] },
    { value: 167, aliases: ['Сабыржан Алдонгаров'] },
    { value: 137, aliases: ['Сара Токенова', 'Токенова Сара'] },
    { value: 144, aliases: ['Татьяна Ильиных', 'Ильиных Татьяна'] },
    { value: 141, aliases: ['Татьяна Кан', 'Кан Т.'] },
    { value: 54, aliases: ['Татьяна Черней', 'Черней Т.'] },
    { value: 76, aliases: ['Юлия Айтуганова', 'Айтуганова Ю.'] }
];

const HIDDEN_COMPLEXITY_BOOSTS = {
    '2362025': { area: 0.05, opu: 0.05, account: 0.03 }, // Мусаева Р.
    '2362027': { area: 0.05, opu: 0.05 }  // Нысанбеков Е.
};

const CACHE_KEY = 'dashboardCacheV3';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

// ——— Глобальное состояние ———
let deals69 = [];
let deals79 = [];
let remarkDeals = [];
let callsItems = [];
let disciplineItems = [];
let opuItems = [];
let managementItems = [];
let fotDbItems = [];
let partnersData = {};
let matrixRows = [];
let partnerMap = {};
let companyMap = {};
let list115PartnerByElementId = {};
let accountCoefficientRows = [];
let accountCoefficientLookup = {};
let callsByPartner = {};   // индекс: partnerId -> [items]
let opuByPartner = {};     // индекс: partnerId -> [items]
let fotTriggerDealsByPartner = {};
let lastUserMap = {};
let clocksterMetricsByPartner = {};
let clocksterMetricsCache = {};
let disciplineStatsByPartner = {};
let managementScoresByPartner = {};
let remarkMetricsByPartner = {};
let auditCountsByPartner = {};
let accountCoeffStatsByPartner = {};
let opuComplexityStatsByPartner = {};
let remarksReliefBenchmark = null;
let complexityBenchmarks = {
    objects: null,
    area: null,
    opu: null
};
let fotDbStatsByPartnerMonth = {};
let fotDbPartnerLookup = {};
let selectedExamplePartnerId = '';
let expandedMatrixGroups = {
    relations: false,
    money: false,
    operations: false
};
let lastRenderedTimestamp = 0;

const MATRIX_GROUP_CONFIG = [
    {
        id: 'relations',
        label: 'Отношения',
        scoreField: 'relationsScore',
        sub: '3 крит.',
        items: [
            { key: 'calls', label: 'Обзвон' },
            { key: 'remarks', label: 'Замечания' },
            { key: 'audit', label: 'Аудит' }
        ]
    },
    {
        id: 'money',
        label: 'Деньги',
        scoreField: 'moneyScore',
        sub: '2 крит.',
        items: [
            { key: 'realization', label: 'ФОТ' },
            { key: 'upravlenka', label: 'Управленка' }
        ]
    },
    {
        id: 'operations',
        label: 'ОПУ',
        scoreField: 'operationsScore',
        sub: '4 крит.',
        items: [
            { key: 'clockster', label: 'Клостер' },
            { key: 'training', label: 'Обучение' },
            { key: 'discipline', label: 'Дисциплины' },
            { key: 'umsrm', label: 'УМС/РМ' }
        ]
    }
];

function normalizeComparableName(value) {
    return String(value || '')
        .replace(/[\s\u00A0]+/g, ' ')
        .trim()
        .toLowerCase();
}

function buildOpuComplexityStats() {
    const aliasLookup = {};
    for (const item of OPU_COMPLEXITY_SOURCE) {
        for (const alias of item.aliases || []) {
            aliasLookup[normalizeComparableName(alias)] = {
                value: Number(item.value) || 0,
                sourceName: alias
            };
        }
    }

    opuComplexityStatsByPartner = {};
    for (const [pid, name] of Object.entries(partnerMap || {})) {
        const entry = aliasLookup[normalizeComparableName(name)];
        if (!entry) continue;
        opuComplexityStatsByPartner[String(pid)] = {
            value: entry.value,
            sourceName: entry.sourceName
        };
    }

    complexityBenchmarks.opu = buildComplexityBenchmark(OPU_COMPLEXITY_SOURCE.map(item => Number(item.value) || 0));
}

function normalizeAccountLookupText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[«»"'`]/g, ' ')
        .replace(/[\s\u00A0]+/g, ' ')
        .trim();
}

function normalizeAccountResponsible(value) {
    return normalizeAccountLookupText(value);
}

function normalizeAccountCompany(value) {
    return normalizeAccountLookupText(value)
        .replace(/\b(тоо|too|ao|ао|ип)\b/gi, ' ')
        .replace(/[\s\u00A0]+/g, ' ')
        .trim();
}

function getAccountCoeffKey(responsibleName, companyTitle) {
    return `${normalizeAccountResponsible(responsibleName)}|${normalizeAccountCompany(companyTitle)}`;
}

function rebuildAccountCoefficientLookup() {
    accountCoefficientLookup = {};
    for (const row of accountCoefficientRows || []) {
        const key = getAccountCoeffKey(row?.responsible, row?.company);
        if (!key || key === '|') continue;
        accountCoefficientLookup[key] = {
            coeff: Number.isFinite(Number(row?.coeff)) ? Number(row.coeff) : null,
            status: row?.status ?? null,
            responsible: row?.responsible ?? '',
            company: row?.company ?? ''
        };
    }
}

function compareMonthKeys(a, b) {
    return String(a || '').localeCompare(String(b || ''));
}

function isMonthKey(value) {
    return /^\d{4}-\d{2}$/.test(value || '');
}

function isMonthInReportingRange(monthKey) {
    if (!isMonthKey(monthKey)) return false;
    return compareMonthKeys(monthKey, REPORTING_MONTH_START) >= 0
        && compareMonthKeys(monthKey, REPORTING_MONTH_END) <= 0;
}

function isSummaryFilter(monthKey) {
    return monthKey === SUMMARY_FILTER_VALUE;
}

function doesMonthMatchSelection(itemMonth, selectedMonth) {
    if (selectedMonth === 'all') return true;
    if (isSummaryFilter(selectedMonth)) return isMonthInReportingRange(itemMonth);
    return itemMonth === selectedMonth;
}

function getCallsReportMonths(selectedMonth) {
    if (selectedMonth === 'all') return null;
    if (isSummaryFilter(selectedMonth)) {
        return [...new Set(['2026-02', ...getAllowedReportingMonths()])];
    }
    if (selectedMonth === '2026-03') return ['2026-02', '2026-03'];
    return [selectedMonth];
}

function getAllowedReportingMonths() {
    const months = [];
    const [startYear, startMonth] = REPORTING_MONTH_START.split('-').map(Number);
    const [endYear, endMonth] = REPORTING_MONTH_END.split('-').map(Number);
    const cursor = new Date(startYear, startMonth - 1, 1);
    const limit = new Date(endYear, endMonth - 1, 1);

    while (cursor <= limit) {
        months.push(formatMonthKey(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
}

function normalizeSelectedMonth(monthKey) {
    if (monthKey === 'all' || monthKey === SUMMARY_FILTER_VALUE) return SUMMARY_FILTER_VALUE;
    if (isMonthInReportingRange(monthKey)) return monthKey;
    return REPORTING_MONTH_START;
}

function getDefaultMonthSelection(referenceDate = new Date()) {
    const baseDate = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
        ? referenceDate
        : new Date();
    const previousMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    return normalizeSelectedMonth(formatMonthKey(previousMonth));
}

function formatMonthLabel(monthKey) {
    if (!isMonthKey(monthKey)) return monthKey;
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const label = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function setupMonthSelect() {
    if (typeof document === 'undefined') return;
    const select = document.getElementById('monthSelect');
    if (!select) return;

    const allowedMonths = getAllowedReportingMonths();
    const currentValue = normalizeSelectedMonth(select.value || getDefaultMonthSelection());

    select.innerHTML = '';
    {
        const option = document.createElement('option');
        option.value = SUMMARY_FILTER_VALUE;
        option.textContent = 'Общий свод';
        select.appendChild(option);
    }
    for (const monthKey of allowedMonths) {
        const option = document.createElement('option');
        option.value = monthKey;
        option.textContent = formatMonthLabel(monthKey);
        select.appendChild(option);
    }

    select.value = isSummaryFilter(currentValue) || isMonthInReportingRange(currentValue)
        ? currentValue
        : REPORTING_MONTH_START;
}

function getSelectedMonth() {
    if (typeof document === 'undefined') return 'all';
    const rawValue = document.getElementById('monthSelect')?.value;
    return normalizeSelectedMonth(rawValue || getDefaultMonthSelection());
}

function formatMonthKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function shiftMonthKey(monthKey, delta) {
    if (!/^\d{4}-\d{2}$/.test(monthKey || '')) return monthKey;
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return formatMonthKey(date);
}

function getClocksterMonthKey() {
    return getSelectedMonth();
}

function getMonthDateRange(monthKey) {
    if (!/^\d{4}-\d{2}$/.test(monthKey || '')) return null;
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const toIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { date_start: toIso(start), date_end: toIso(end) };
}

function extractDealMonthKey(deal, fallbackFields = []) {
    const rawMonth = normalizeScalar(getFieldValue(deal, FIELDS.MONTH_ACCRUAL));
    if (rawMonth) {
        const parsed = new Date(rawMonth);
        const monthKey = formatMonthKey(parsed);
        if (monthKey) return monthKey;
        const text = String(rawMonth).trim();
        const directMonth = text.match(/^(\d{4})-(\d{2})/);
        if (directMonth) return `${directMonth[1]}-${directMonth[2]}`;
    }

    for (const fieldName of fallbackFields) {
        const raw = normalizeScalar(getFieldValue(deal, fieldName));
        if (!raw) continue;
        const monthKey = formatMonthKey(new Date(raw));
        if (monthKey) return monthKey;
    }

    return '';
}

function extractTrainingMonthKey(item) {
    const rawMonthNumber = normalizeScalar(getFieldValue(item, FIELDS.OPU_MONTH_NUMBER));
    const monthNumber = Number.parseInt(String(rawMonthNumber ?? '').trim(), 10);

    if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        const rawAccrualMonth = normalizeScalar(getFieldValue(item, FIELDS.OPU_MONTH));
        if (rawAccrualMonth) {
            const parsedAccrual = new Date(rawAccrualMonth);
            if (!Number.isNaN(parsedAccrual.getTime())) {
                return `${parsedAccrual.getFullYear()}-${String(monthNumber).padStart(2, '0')}`;
            }
        }

        const rawCreated = normalizeScalar(getFieldValue(item, 'CREATED_TIME'));
        const rawUpdated = normalizeScalar(getFieldValue(item, 'UPDATED_TIME'));
        const referenceDate = [rawCreated, rawUpdated]
            .map(raw => raw ? new Date(raw) : null)
            .find(date => date && !Number.isNaN(date.getTime()));

        if (referenceDate) {
            let year = referenceDate.getFullYear();
            const referenceMonth = referenceDate.getMonth() + 1;

            // Если запись создана/обновлена на стыке года, подгоняем год под номер месяца.
            if (monthNumber - referenceMonth >= 6) {
                year -= 1;
            } else if (referenceMonth - monthNumber >= 6) {
                year += 1;
            }

            return `${year}-${String(monthNumber).padStart(2, '0')}`;
        }
    }

    return extractDealMonthKey(item, [FIELDS.OPU_MONTH, 'CREATED_TIME', 'UPDATED_TIME']);
}

function dealMatchesMonth(deal, monthKey, fallbackFields = []) {
    if (!monthKey || monthKey === 'all') return true;
    return extractDealMonthKey(deal, fallbackFields) === monthKey;
}

function getFilteredDeals69() {
    // 69 — это текущая база объектов в работе. Пользователь просил не резать её по месяцу,
    // потому что объектов там мало меняется, а месячный фильтр нужен для событийных категорий.
    return deals69;
}

function getFilteredDeals79() {
    const selectedMonth = getSelectedMonth();
    if (selectedMonth === 'all') return deals79;
    if (isSummaryFilter(selectedMonth)) {
        return deals79.filter(deal => isMonthInReportingRange(extractDealMonthKey(deal, ['CLOSEDATE', 'DATE_CREATE', 'MOVED_TIME'])));
    }
    return deals79.filter(deal => dealMatchesMonth(deal, selectedMonth, ['CLOSEDATE', 'DATE_CREATE', 'MOVED_TIME']));
}

function getFilteredRemarkDeals() {
    const selectedMonth = getSelectedMonth();
    if (selectedMonth === 'all') return remarkDeals;
    if (isSummaryFilter(selectedMonth)) {
        return remarkDeals.filter(deal => isMonthInReportingRange(getRemarkReportMonth(deal)));
    }
    return remarkDeals.filter(deal => getRemarkReportMonth(deal) === selectedMonth);
}

// ——— Select-поля для разных воронок ———
const SELECT_DEALS = ['ID', 'CATEGORY_ID', 'STAGE_ID', 'COMPANY_ID', 'CONTACT_ID', 'UF_CRM_ACTIVE_ADDRESS', FIELDS.PARTNER, 'ASSIGNED_BY_ID', 'MOVED_TIME', 'CLOSEDATE', 'DATE_CREATE', 'OPPORTUNITY', FIELDS.AREA, FIELDS.MONTH_ACCRUAL];
const SELECT_REMARKS = ['ID', FIELDS.PARTNER, 'ASSIGNED_BY_ID', 'DATE_CREATE', FIELDS.REMARK_DATE, FIELDS.FEEDBACK_DATE, FIELDS.REMARK_SOURCE];

// ——— Хелперы расчётов ———

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toDateOnly(value) {
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calculateRemarkLateDays(remarkDate, feedbackDate) {
    if (!remarkDate || !feedbackDate) return null;
    const startDate = toDateOnly(remarkDate);
    const endDate = toDateOnly(feedbackDate);
    if (!startDate || !endDate) return null;

    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(deadlineDate.getDate() + 2);

    const diffDays = Math.floor((endDate - deadlineDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function calculateRemarkPenalty(remarkDate, feedbackDate) {
    const lateDays = calculateRemarkLateDays(remarkDate, feedbackDate);
    if (lateDays == null) return 0;
    return lateDays * 0.05;
}

function getRemarkReportMonth(deal) {
    // Месяц для замечаний сверяем по дате создания строки.
    return extractDealMonthKey(deal, ['DATE_CREATE']);
}

function getAuditReportMonth(deal) {
    return extractDealMonthKey(deal, [FIELDS.AUDIT_CHECK_DATE]);
}

function isAuditRemarkSource(value) {
    const raw = normalizeScalar(value);
    if (raw == null || raw === '') return false;
    const normalized = String(raw).trim().toLowerCase();
    return AUDIT_REMARK_SOURCE_IDS.has(String(raw).trim()) || AUDIT_REMARK_SOURCE_LABELS.has(normalized);
}

function isPositiveRemarkSource(value) {
    const raw = normalizeScalar(value);
    if (raw == null || raw === '') return false;
    const rawString = String(raw).trim();
    const normalized = rawString.toLowerCase();
    return POSITIVE_REMARK_SOURCE_IDS.has(rawString)
        || POSITIVE_REMARK_SOURCE_LABEL_PARTS.some(part => normalized.includes(part));
}

function isNegativeRemarkSource(value) {
    const raw = normalizeScalar(value);
    if (raw == null || raw === '') return false;
    const rawString = String(raw).trim();
    const normalized = rawString.toLowerCase();
    if (isPositiveRemarkSource(rawString)) return false;
    return NEGATIVE_REMARK_SOURCE_IDS.has(rawString)
        || NEGATIVE_REMARK_LABEL_PARTS.some(part => normalized.includes(part));
}

function buildRemarkMetrics(selectedMonth) {
    const metrics = {};

    for (const deal of remarkDeals) {
        const reportMonth = getRemarkReportMonth(deal);
        if (!doesMonthMatchSelection(reportMonth, selectedMonth)) continue;
        if (!isNegativeRemarkSource(getFieldValue(deal, FIELDS.REMARK_SOURCE))) continue;

        const pid = normalizePartnerId(deal);
        if (pid === '__no_partner__') continue;

        if (!metrics[pid]) {
            metrics[pid] = {
                rowCount: 0,
                scoredCount: 0,
                skippedMissingRemarkDate: 0,
                skippedMissingFeedbackDate: 0,
                auditDealsCount: 0,
                totalLateDays: 0,
                totalPenalty: 0,
                items: []
            };
        }

        const remarkDate = normalizeScalar(getFieldValue(deal, FIELDS.REMARK_DATE));
        const feedbackDate = normalizeScalar(getFieldValue(deal, FIELDS.FEEDBACK_DATE));
        const lateDays = calculateRemarkLateDays(remarkDate, feedbackDate);
        const penalty = lateDays == null ? 0 : lateDays * 0.05;
        const sourceValue = getFieldValue(deal, FIELDS.REMARK_SOURCE);

        metrics[pid].rowCount += 1;
        if (isAuditRemarkSource(sourceValue)) {
            metrics[pid].auditDealsCount += 1;
        }
        if (!remarkDate) {
            metrics[pid].skippedMissingRemarkDate += 1;
        } else if (!feedbackDate) {
            metrics[pid].skippedMissingFeedbackDate += 1;
        } else if (lateDays == null) {
            metrics[pid].skippedMissingRemarkDate += 1;
        } else {
            metrics[pid].scoredCount += 1;
            metrics[pid].totalLateDays += lateDays;
            metrics[pid].totalPenalty += penalty;
        }

        metrics[pid].items.push({
            id: getFieldValue(deal, 'ID') ?? deal?.id,
            remarkDate,
            feedbackDate,
            lateDays,
            penalty
        });
    }

    return metrics;
}

function buildAuditCounts(selectedMonth) {
    const counts = {};

    for (const deal of remarkDeals) {
        if (!isAuditRemarkSource(getFieldValue(deal, FIELDS.REMARK_SOURCE))) continue;

        const reportMonth = getAuditReportMonth(deal);
        if (!doesMonthMatchSelection(reportMonth, selectedMonth)) continue;

        const pid = normalizePartnerId(deal);
        if (pid === '__no_partner__') continue;

        counts[pid] = (counts[pid] || 0) + 1;
    }

    return counts;
}

function normalizeBitrixFieldName(fieldName) {
    if (!fieldName) return fieldName;
    if (/^[a-z]/.test(fieldName)) return fieldName;
    const dynamicMatch = fieldName.match(/^UF_CRM_(\d+)_(.+)$/);
    if (dynamicMatch && /^\d/.test(dynamicMatch[2])) {
        return `ufCrm${dynamicMatch[1]}_${dynamicMatch[2]}`;
    }
    return fieldName
        .toLowerCase()
        .split('_')
        .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function getFieldValue(item, fieldName) {
    if (!item || !fieldName) return undefined;
    if (Object.hasOwn(item, fieldName)) return item[fieldName];

    const variants = [
        normalizeBitrixFieldName(fieldName),
        fieldName.toUpperCase(),
        fieldName.replace(/^UF_CRM_/, 'ufCrm_')
    ].filter(Boolean);

    for (const variant of new Set(variants)) {
        if (Object.hasOwn(item, variant)) return item[variant];
    }

    const compactFieldName = String(fieldName).toLowerCase().replace(/_/g, '');
    for (const [key, value] of Object.entries(item)) {
        if (String(key).toLowerCase().replace(/_/g, '') === compactFieldName) {
            return value;
        }
    }

    return undefined;
}

function normalizeScalar(value) {
    if (Array.isArray(value)) return normalizeScalar(value[0]);
    if (value && typeof value === 'object') {
        return normalizeScalar(value.VALUE ?? value.value ?? value.ID ?? value.id ?? value.NAME ?? value.title);
    }
    return value;
}

function normalizePartnerRef(value) {
    const normalized = normalizeScalar(value);
    return normalized == null ? '' : String(normalized).trim();
}

function normalizeStageId(deal) {
    return normalizePartnerRef(getFieldValue(deal, 'STAGE_ID') ?? deal?.stageId);
}

function getDealPartnerId(deal) {
    const raw = getFieldValue(deal, FIELDS.PARTNER);
    const id = normalizePartnerRef(raw);
    if (id && partnerMap[id]) return id;
    return '__no_partner__';
}

function getCallsPartnerId(item) {
    const directPid = normalizePartnerRef(getFieldValue(item, FIELDS.CALLS_PARTNER));
    if (directPid) return directPid;
    const ref115 = normalizePartnerRef(getFieldValue(item, 'UF_CRM_173_1771396870'));
    return list115PartnerByElementId[ref115] ?? ref115;
}

function scoreCallsFieldValue(rawValue, scoreMap = null) {
    const value = normalizeScalar(rawValue);
    if (value == null || value === '') return null;

    const text = String(value).trim();
    if (scoreMap && Object.hasOwn(scoreMap, text)) return scoreMap[text];

    const num = parseFloat(text.replace(',', '.'));
    if (!Number.isNaN(num)) return num;

    return null;
}

// ——— Bitrix API ———

async function fetchBitrix(method, params = {}, attempt = 0) {
    try {
        const response = await fetch(`${BITRIX_PROXY_URL}${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        if (response.status === 429 && attempt < 5) {
            await sleep(400 * (attempt + 1));
            return fetchBitrix(method, params, attempt + 1);
        }
        if (!response.ok) {
            console.warn(`Bitrix ${method}: HTTP ${response.status}`);
            return { result: [], total: 0 };
        }
        const data = await response.json();
        if (data.error) {
            console.warn(`Bitrix ${method}:`, data.error_description || data.error);
            return { result: [], total: 0 };
        }
        if (data.result === undefined && Array.isArray(data)) return { result: data, total: data.length };
        return data;
    } catch (e) {
        console.error(`Error fetching ${method}:`, e);
        return { result: [], total: 0 };
    }
}

async function fetchBootstrapData(forceRefresh = false) {
    const url = forceRefresh ? `${BOOTSTRAP_URL}?refresh=1` : BOOTSTRAP_URL;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Bootstrap HTTP ${response.status}`);
    }
    return response.json();
}

// ——— UI: Лоадер ———

function showLoader(show, text = '', progress = null) {
    const l = document.getElementById('loader');
    if (!l) return;
    l.style.display = show ? 'flex' : 'none';
    const statusEl = document.getElementById('loaderStatus');
    if (statusEl && text) statusEl.textContent = text;
    const bar = document.getElementById('loaderProgressFill');
    if (bar && typeof progress === 'number') {
        bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
    }
}

// ——— Загрузка сделок: параллельная ———

async function fetchAllDeals(categoryId, selectFields, label = 'сделок') {
    const firstRes = await fetchBitrix('crm.deal.list', {
        filter: { 'CATEGORY_ID': categoryId },
        select: ['ID'],
        start: 0
    });
    const total = firstRes?.total ?? 0;
    const firstBatch = Array.isArray(firstRes?.result) ? firstRes.result : [];

    if (total === 0 && firstBatch.length === 0) return [];
    if (total <= 50) {
        const fullRes = await fetchBitrix('crm.deal.list', {
            filter: { 'CATEGORY_ID': categoryId },
            select: selectFields,
            start: 0
        });
        return Array.isArray(fullRes?.result) ? fullRes.result : [];
    }

    const batchSize = 50;
    const pages = Math.ceil(total / batchSize);
    const all = [...firstBatch];
    showLoader(true, `Загрузка ${label}: ${total} шт.`, null);

    for (let i = 1; i < pages; i++) {
        const res = await fetchBitrix('crm.deal.list', {
            filter: { 'CATEGORY_ID': categoryId },
            select: selectFields,
            start: i * batchSize
        });
        const batch = Array.isArray(res?.result) ? res.result : [];
        all.push(...batch);
        const progress = Math.round((i / Math.max(1, pages - 1)) * 100);
        showLoader(true, `Загрузка ${label}: ${all.length}/${total}`, progress);
    }
    return all;
}

// ——— Загрузка списков и смарт-процессов ———

async function fetchPartnersList117() {
    const out = {};
    try {
        const list = await fetchAllListElements(LIST_PARTNERS_IBLOCK_ID);
        for (const el of list) {
            const id = String(el.ID ?? el.id ?? '').trim();
            const name = (el.NAME ?? el.name ?? '').trim() || id;
            if (id) out[id] = name;
        }
    } catch (e) { console.warn('fetchPartnersList117', e); }
    return out;
}

async function fetchList115PartnerMap() {
    const out = {};
    try {
        const list = await fetchAllListElements(LIST_CALLS_REF_IBLOCK_ID);
        for (const el of list) {
            const id = String(el.ID ?? el.id ?? '');
            const pv = el[LIST_115_PARTNER_PROP] ?? el[LIST_115_PARTNER_PROP + '_VALUE'] ?? el.PROPERTIES?.[LIST_115_PARTNER_PROP]?.VALUE ?? el.PROPERTIES?.[LIST_115_PARTNER_PROP];
            const pid = pv != null && pv !== '' ? String(pv) : '';
            if (id && pid) out[id] = pid;
        }
    } catch (e) { console.warn('fetchList115PartnerMap', e); }
    return out;
}

async function fetchAllListElements(iblockId) {
    const all = [];
    let start = 0;

    while (true) {
        const res = await fetchBitrix('lists.element.get', {
            IBLOCK_TYPE_ID: 'lists',
            IBLOCK_ID: iblockId,
            start
        });

        let batch = res?.result || [];
        if (!Array.isArray(batch)) batch = Object.values(batch);
        if (!batch.length) break;

        all.push(...batch);

        const next = res?.next;
        if (next == null || next === false) break;
        start = Number(next);
        if (!Number.isFinite(start)) break;
    }

    return all;
}

async function fetchAllUsers() {
    const all = [];
    let start = 0;

    while (true) {
        const res = await fetchBitrix('user.get', { start });
        const batch = Array.isArray(res?.result) ? res.result : [];
        if (!batch.length) break;

        all.push(...batch);

        const next = res?.next;
        if (next == null || next === false) break;
        start = Number(next);
        if (!Number.isFinite(start)) break;
    }

    return all;
}

async function fetchSmartProcessItems(entityTypeId, filter = {}) {
    try {
        const firstRes = await fetchBitrix('crm.item.list', {
            entityTypeId: String(entityTypeId),
            filter,
            select: ['*', 'UF_*'],
            start: 0
        });
        const firstBatch = firstRes?.result?.items || firstRes?.result || [];
        const total = Number(firstRes?.total) || (Array.isArray(firstBatch) ? firstBatch.length : 0);
        if (!Array.isArray(firstBatch) || firstBatch.length === 0) return [];
        if (total <= firstBatch.length) return firstBatch;

        const batchSize = 50;
        const pages = Math.ceil(total / batchSize);
        const items = [...firstBatch];

        for (let i = 1; i < pages; i++) {
            const res = await fetchBitrix('crm.item.list', {
                entityTypeId: String(entityTypeId),
                filter,
                select: ['*', 'UF_*'],
                start: i * batchSize
            });
            const batch = res?.result?.items || res?.result || [];
            if (Array.isArray(batch)) items.push(...batch);
        }
        return items;
    } catch (e) {
        console.warn('fetchSmartProcessItems', entityTypeId, e);
        return [];
    }
}

// ——— Нормализация partnerId ———

function normalizePartnerId(deal) {
    return getDealPartnerId(deal);
}

function getPartnerNameById(pid) {
    return (partnersData[pid]?.name ?? partnerMap[pid] ?? '').trim();
}

function getDealAccountCoefficientEntry(deal) {
    const responsibleName = lastUserMap[String(getFieldValue(deal, 'ASSIGNED_BY_ID') ?? deal?.ASSIGNED_BY_ID ?? '')] || '';
    const companyTitle = companyMap[String(getFieldValue(deal, 'COMPANY_ID') ?? deal?.COMPANY_ID ?? '')] || '';
    const key = getAccountCoeffKey(responsibleName, companyTitle);
    const entry = accountCoefficientLookup[key];

    return {
        key,
        responsibleName,
        companyTitle,
        coeff: Number.isFinite(entry?.coeff) ? Number(entry.coeff) : 1.0,
        matched: Number.isFinite(entry?.coeff),
        status: entry?.status ?? null
    };
}

function buildAccountCoeffStats() {
    accountCoeffStatsByPartner = {};

    for (const deal of deals69) {
        const pid = normalizePartnerId(deal);
        if (!pid || pid === '__no_partner__') continue;

        if (!accountCoeffStatsByPartner[pid]) {
            accountCoeffStatsByPartner[pid] = {
                totalDeals: 0,
                matchedDeals: 0,
                unmatchedDeals: 0,
                totalCoeff: 0,
                companies: new Set()
            };
        }

        const stats = accountCoeffStatsByPartner[pid];
        const entry = getDealAccountCoefficientEntry(deal);
        stats.totalDeals += 1;
        stats.totalCoeff += entry.coeff;
        if (entry.companyTitle) stats.companies.add(entry.companyTitle);
        if (entry.matched) {
            stats.matchedDeals += 1;
        } else {
            stats.unmatchedDeals += 1;
        }
    }

    for (const stats of Object.values(accountCoeffStatsByPartner)) {
        stats.coeff = stats.totalDeals > 0 ? stats.totalCoeff / stats.totalDeals : 1.0;
        stats.companyCount = stats.companies.size;
        delete stats.companies;
    }
}

function usesHoursBasedDiscipline(pid) {
    const name = getPartnerNameById(pid).toLowerCase();
    return HOURS_BASED_DISCIPLINE_PARTNERS.has(String(pid)) || HOURS_BASED_DISCIPLINE_NAMES.has(name);
}

function usesHoursBasedClockster(pid) {
    return CLOCKSTER_HOURS_BASED_PARTNERS.has(String(pid));
}

function normalizeHumanName(name = '') {
    return String(name)
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^a-zа-я0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getNameTokens(name = '') {
    return normalizeHumanName(name)
        .split(' ')
        .filter(Boolean)
        .filter(token => token.length > 1);
}

function getSurnameStem(name = '') {
    const firstToken = getNameTokens(name)[0] || '';
    return firstToken.replace(/[ая]$/u, '');
}

function scorePartnerNameMatch(bitrixName, dbName) {
    const bitrixTokens = getNameTokens(bitrixName);
    const dbTokens = getNameTokens(dbName);
    if (!bitrixTokens.length || !dbTokens.length) return 0;

    let score = 0;
    const dbSet = new Set(dbTokens);
    for (const token of new Set(bitrixTokens)) {
        if (dbSet.has(token)) {
            score += token.length > 3 ? 3 : 1;
            continue;
        }
        if (dbTokens.some(other => other.startsWith(token) || token.startsWith(other))) {
            score += 2;
        }
    }

    const bitrixStem = getSurnameStem(bitrixName);
    const dbStem = getSurnameStem(dbName);
    if (bitrixStem && bitrixStem === dbStem) score += 5;

    return score;
}

function getFotDbMonthKeyFromRow(item) {
    const year = Number(item?.period_year);
    const monthZeroBased = Number(item?.period_month);
    if (!Number.isFinite(year) || !Number.isFinite(monthZeroBased)) return null;
    return `${year}-${String(monthZeroBased + 1).padStart(2, '0')}`;
}

function getFotDbMonthsForSelection(selectedMonth = getSelectedMonth()) {
    if (isSummaryFilter(selectedMonth)) {
        return [...new Set(
            getAllowedReportingMonths()
                .map(monthKey => shiftMonthKey(monthKey, FOT_DB_MONTH_SHIFT))
                .filter(Boolean)
        )];
    }

    return [shiftMonthKey(selectedMonth, FOT_DB_MONTH_SHIFT)].filter(Boolean);
}

function buildFotDbIndexes() {
    fotDbStatsByPartnerMonth = {};

    for (const item of fotDbItems) {
        const dbPartnerId = String(item?.partner_id ?? '').trim();
        const partnerName = String(item?.partner_name ?? '').trim();
        const monthKey = getFotDbMonthKeyFromRow(item);
        const objectBitrixId = String(item?.object_bitrix_id ?? '').trim();
        if (!dbPartnerId || !monthKey || !objectBitrixId) continue;

        if (!fotDbStatsByPartnerMonth[dbPartnerId]) fotDbStatsByPartnerMonth[dbPartnerId] = {};
        if (!fotDbStatsByPartnerMonth[dbPartnerId][monthKey]) {
            fotDbStatsByPartnerMonth[dbPartnerId][monthKey] = {
                partnerName,
                objectIds: new Set(),
                paymentsCount: 0,
                totalAmount: 0
            };
        }

        const stats = fotDbStatsByPartnerMonth[dbPartnerId][monthKey];
        stats.objectIds.add(objectBitrixId);
        stats.paymentsCount += Number(item?.payments_count) || 0;
        stats.totalAmount += parseFloat(item?.total_amount) || 0;
        if (!stats.partnerName && partnerName) stats.partnerName = partnerName;
    }
}

function buildFotDbPartnerLookup() {
    const uniqueDbPartners = new Map();

    for (const item of fotDbItems) {
        const dbPartnerId = String(item?.partner_id ?? '').trim();
        const partnerName = String(item?.partner_name ?? '').trim();
        if (!dbPartnerId || !partnerName) continue;
        if (!uniqueDbPartners.has(dbPartnerId)) {
            uniqueDbPartners.set(dbPartnerId, { dbPartnerId, dbPartnerName: partnerName });
        }
    }

    const dbPartners = [...uniqueDbPartners.values()];
    const lookup = {};

    for (const [bitrixPartnerId, partnerName] of Object.entries(partnerMap || {})) {
        const forcedDbPartnerId = FOT_DB_PARTNER_OVERRIDES[bitrixPartnerId];
        if (forcedDbPartnerId) {
            const forced = uniqueDbPartners.get(String(forcedDbPartnerId));
            lookup[bitrixPartnerId] = {
                dbPartnerId: String(forcedDbPartnerId),
                dbPartnerName: forced?.dbPartnerName || '',
                source: 'override'
            };
            continue;
        }

        const ranked = dbPartners
            .map(item => ({
                ...item,
                score: scorePartnerNameMatch(partnerName, item.dbPartnerName)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        const best = ranked[0];
        const second = ranked[1];
        if (!best) continue;

        const secondScore = second?.score ?? 0;
        if (best.score >= 8 && best.score >= secondScore + 2) {
            lookup[bitrixPartnerId] = {
                dbPartnerId: String(best.dbPartnerId),
                dbPartnerName: best.dbPartnerName,
                source: 'match'
            };
        }
    }

    fotDbPartnerLookup = lookup;
}

function getFotDbStats(pid) {
    const totalObjects = partnersData[pid]?.dealsCount || 0;
    if (totalObjects <= 0) {
        return {
            totalObjects: 0,
            paidObjects: 0,
            paymentsCount: 0,
            totalAmount: 0,
            monthKeys: [],
            hasMapping: false
        };
    }

    const mapping = fotDbPartnerLookup[String(pid)];
    const monthKeys = getFotDbMonthsForSelection();
    if (!mapping) {
        return {
            totalObjects,
            paidObjects: 0,
            paymentsCount: 0,
            totalAmount: 0,
            monthKeys,
            hasMapping: false
        };
    }

    const byMonth = fotDbStatsByPartnerMonth[String(mapping.dbPartnerId)] || {};
    const objectIds = new Set();
    let paymentsCount = 0;
    let totalAmount = 0;

    for (const monthKey of monthKeys) {
        const stats = byMonth[monthKey];
        if (!stats) continue;
        for (const objectId of stats.objectIds) objectIds.add(objectId);
        paymentsCount += Number(stats.paymentsCount) || 0;
        totalAmount += Number(stats.totalAmount) || 0;
    }

    return {
        totalObjects,
        paidObjects: objectIds.size,
        paymentsCount,
        totalAmount,
        monthKeys,
        hasMapping: true,
        dbPartnerId: String(mapping.dbPartnerId),
        dbPartnerName: mapping.dbPartnerName || ''
    };
}

async function fetchClocksterAttendanceReport(monthKey) {
    const userIds = Object.values(CLOCKSTER_PARTNER_TO_USER);
    if (userIds.length === 0) return [];

    const range = getMonthDateRange(monthKey);
    if (!range) return [];

    const response = await fetch(`${CLOCKSTER_PROXY_URL}/attendance/report?${new URLSearchParams({
        users: userIds.join(','),
        per_page: '50',
        ...range
    })}`);

    if (!response.ok) {
        console.warn('Clockster attendance report HTTP', response.status);
        return [];
    }

    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
}

function mergeClocksterMetrics(metricList) {
    const merged = {};

    for (const metrics of metricList) {
        for (const [partnerId, metric] of Object.entries(metrics || {})) {
            if (!merged[partnerId]) {
                merged[partnerId] = {
                    visits: 0,
                    hours: 0,
                    uniqueObjectsSet: new Set()
                };
            }

            merged[partnerId].visits += Number(metric.visits) || 0;
            merged[partnerId].hours += Number(metric.hours) || 0;

            const objectIds = Array.isArray(metric.objectIds) ? metric.objectIds : [];
            for (const objectId of objectIds) {
                merged[partnerId].uniqueObjectsSet.add(String(objectId));
            }
        }
    }

    const normalized = {};
    for (const [partnerId, metric] of Object.entries(merged)) {
        normalized[partnerId] = {
            visits: metric.visits,
            hours: metric.hours,
            uniqueObjects: metric.uniqueObjectsSet.size,
            objectIds: [...metric.uniqueObjectsSet]
        };
    }

    return normalized;
}

function buildClocksterMetrics(reportRows) {
    const userIdToPartnerId = Object.fromEntries(
        Object.entries(CLOCKSTER_PARTNER_TO_USER).map(([partnerId, userId]) => [String(userId), String(partnerId)])
    );
    const metrics = {};

    for (const row of reportRows) {
        const clocksterUserId = String(row?.user?.id ?? '');
        const partnerId = userIdToPartnerId[clocksterUserId];
        if (!partnerId) continue;

        let uniqueObjectVisits = 0;
        let spentHours = 0;
        const uniqueCoveredObjects = new Set();
        const dates = row?.dates || {};

        for (const [dateKey, dateData] of Object.entries(dates)) {
            const attendance = Array.isArray(dateData?.attendance) ? dateData.attendance.slice() : [];
            if (attendance.length === 0) continue;

            attendance.sort((a, b) => String(a?.datetime || '').localeCompare(String(b?.datetime || '')));
            const perLocation = new Map();

            for (const event of attendance) {
                const locationId = event?.location?.id ?? event?.location?.title ?? 'unknown';
                const locationKey = `${dateKey}|${locationId}`;
                if (!perLocation.has(locationKey)) perLocation.set(locationKey, []);
                perLocation.get(locationKey).push(event);
            }

            for (const [locationKey, events] of perLocation.entries()) {
                const hasArrival = events.some(e => Number(e?.status) === 1);
                if (!hasArrival) continue;

                uniqueObjectVisits += 1;
                uniqueCoveredObjects.add(String(locationKey.split('|').slice(1).join('|')));

                const firstIn = events.find(e => Number(e?.status) === 1 && e?.datetime);
                const reversed = [...events].reverse();
                const lastOut = reversed.find(e => Number(e?.status) === 0 && e?.datetime);
                if (!firstIn || !lastOut) continue;

                const start = new Date(firstIn.datetime);
                const end = new Date(lastOut.datetime);
                const diffHours = (end - start) / (1000 * 60 * 60);
                if (Number.isFinite(diffHours) && diffHours > 0) {
                    spentHours += diffHours;
                }
            }
        }

        metrics[partnerId] = {
            visits: uniqueObjectVisits,
            hours: spentHours,
            uniqueObjects: uniqueCoveredObjects.size,
            objectIds: [...uniqueCoveredObjects]
        };
    }

    return metrics;
}

async function refreshClocksterMetrics() {
    const monthKey = getClocksterMonthKey();
    if (clocksterMetricsCache[monthKey]) {
        clocksterMetricsByPartner = clocksterMetricsCache[monthKey];
        return;
    }

    try {
        let metrics;
        if (isSummaryFilter(monthKey)) {
            const allMonthMetrics = [];
            for (const reportingMonth of getAllowedReportingMonths()) {
                const reportRows = await fetchClocksterAttendanceReport(reportingMonth);
                allMonthMetrics.push(buildClocksterMetrics(reportRows));
            }
            metrics = mergeClocksterMetrics(allMonthMetrics);
        } else {
            const reportRows = await fetchClocksterAttendanceReport(monthKey);
            metrics = buildClocksterMetrics(reportRows);
        }
        clocksterMetricsCache[monthKey] = metrics;
        clocksterMetricsByPartner = metrics;
    } catch (error) {
        console.warn('Clockster metrics fetch failed', error);
        clocksterMetricsByPartner = {};
    }
}

// ——— Построение индексов для Q-функций ———

function buildIndexes() {
    const selectedMonth = getSelectedMonth();
    const callsMonths = getCallsReportMonths(selectedMonth);
    remarkMetricsByPartner = buildRemarkMetrics(selectedMonth);
    remarksReliefBenchmark = buildComplexityBenchmark(
        Object.values(remarkMetricsByPartner)
            .map(metric => Number(metric?.rowCount) || 0)
            .filter(value => value > 0)
    );
    auditCountsByPartner = buildAuditCounts(selectedMonth);
    buildOpuComplexityStats();
    buildAccountCoeffStats();
    buildFotDbIndexes();
    buildFotDbPartnerLookup();

    callsByPartner = {};
    for (const item of callsItems) {
        const itemMonth = extractDealMonthKey(item, [FIELDS.CALLS_DATE, 'CREATED_TIME', 'UPDATED_TIME']);
        if (callsMonths ? !callsMonths.includes(itemMonth) : false) continue;
        const pid = getCallsPartnerId(item);
        if (!pid) continue;
        if (!callsByPartner[pid]) callsByPartner[pid] = [];
        callsByPartner[pid].push(item);
    }

    opuByPartner = {};
    for (const item of opuItems) {
        const itemMonth = extractTrainingMonthKey(item);
        if (!doesMonthMatchSelection(itemMonth, selectedMonth)) continue;
        const pid = normalizePartnerRef(getFieldValue(item, FIELDS.OPU_PARTNER));
        if (!pid) continue;
        if (!opuByPartner[pid]) opuByPartner[pid] = [];
        opuByPartner[pid].push(item);
    }

    fotTriggerDealsByPartner = {};
    for (const deal of [...getFilteredDeals69(), ...getFilteredDeals79()]) {
        const pid = normalizePartnerId(deal);
        if (pid === '__no_partner__') continue;
        const stageId = normalizeStageId(deal);
        if (!FOT_TRIGGER_STAGE_IDS.has(stageId)) continue;
        if (!fotTriggerDealsByPartner[pid]) fotTriggerDealsByPartner[pid] = [];
        fotTriggerDealsByPartner[pid].push(deal);
    }

    disciplineStatsByPartner = {};
    for (const item of disciplineItems) {
        const itemMonth = extractDealMonthKey(item, ['UF_CRM_173_1774512981459', 'CREATED_TIME', 'UPDATED_TIME']);
        if (!doesMonthMatchSelection(itemMonth, selectedMonth)) continue;

        for (const pid of Object.keys(partnerMap)) {
            if (!disciplineStatsByPartner[pid]) disciplineStatsByPartner[pid] = { totalMeetings: 0, absences: 0 };
            disciplineStatsByPartner[pid].totalMeetings += 1;
        }

        const absentPartners = getFieldValue(item, 'UF_CRM_173_NOPARTNER');
        const normalizedAbsent = Array.isArray(absentPartners) ? absentPartners : (absentPartners ? [absentPartners] : []);
        for (const rawPid of normalizedAbsent) {
            const pid = normalizePartnerRef(rawPid);
            if (!pid) continue;
            if (!disciplineStatsByPartner[pid]) disciplineStatsByPartner[pid] = { totalMeetings: 0, absences: 0 };
            disciplineStatsByPartner[pid].absences += 1;
        }
    }

    managementScoresByPartner = {};
    for (const item of managementItems) {
        const pid = normalizePartnerRef(getFieldValue(item, FIELDS.OPU_PARTNER));
        if (!pid) continue;

        const itemMonth = extractDealMonthKey(item, [FIELDS.OPU_MONTH, 'CREATED_TIME', 'UPDATED_TIME']);
        if (!doesMonthMatchSelection(itemMonth, selectedMonth)) continue;

        const score = parseFloat(getFieldValue(item, FIELDS.MGMT_SCORE));
        if (Number.isNaN(score)) continue;

        const updatedAt = normalizeScalar(getFieldValue(item, 'UPDATED_TIME')) || normalizeScalar(getFieldValue(item, 'CREATED_TIME')) || '';
        const current = managementScoresByPartner[pid];
        if (!current || String(updatedAt) > String(current.updatedAt || '')) {
            managementScoresByPartner[pid] = { score: Math.max(0, Math.min(1, score)), updatedAt };
        }
    }
}

// ——— Обработка данных ———

function processData() {
    partnersData = {};
    const filteredDeals69 = getFilteredDeals69();

    for (const deal of filteredDeals69) {
        const pid = normalizePartnerId(deal);
        if (pid === '__no_partner__') continue;

        if (!partnersData[pid]) {
            partnersData[pid] = {
                name: partnerMap[pid],
                dealsCount: 0, totalScore: 0, remarksCount: 0,
                totalOpportunity: 0, totalArea: 0,
                dealIds: [], realizationScores: [], remarkScores: [], remarkLateDaysTotal: 0, remarkMissingDateCount: 0, remarkMissingFeedbackCount: 0, history: []
            };
        }
        const p = partnersData[pid];
        p.totalOpportunity += Number(deal.OPPORTUNITY) || 0;
        const areaVal = Number(deal[FIELDS.AREA] ?? deal[FIELDS.AREA + '_VALUE']) || 0;
        p.totalArea += areaVal;
        p.dealsCount++;
        p.totalScore += 1.0;
        p.dealIds.push(deal.ID);
        p.history.push({ date: deal.DATE_CREATE, score: 1.0 });
    }

    for (const [pid, metric] of Object.entries(remarkMetricsByPartner)) {
        if (!partnersData[pid]) continue;
        partnersData[pid].remarksCount = metric.rowCount;
        partnersData[pid].remarkScores = metric.items
            .map(item => item.penalty)
            .filter(penalty => Number.isFinite(penalty) && penalty > 0);
        partnersData[pid].remarkLateDaysTotal = metric.totalLateDays;
        partnersData[pid].remarkMissingDateCount = metric.skippedMissingRemarkDate;
        partnersData[pid].remarkMissingFeedbackCount = metric.skippedMissingFeedbackDate;
    }

    if (partnerMap) {
        for (const id of Object.keys(partnerMap)) {
            if (!partnersData[id]) {
                partnersData[id] = {
                    name: partnerMap[id],
                    dealsCount: 0, totalScore: 0, remarksCount: 0,
                    totalOpportunity: 0, totalArea: 0,
                    dealIds: [], realizationScores: [], remarkScores: [], remarkLateDaysTotal: 0, remarkMissingDateCount: 0, remarkMissingFeedbackCount: 0, history: []
                };
            }
        }
    }

    buildComplexityBenchmarks();
}

// ——— Q-функции (используют индексы) ———

function getCallsQ(pid) {
    const items = callsByPartner[pid];
    if (!items || items.length === 0) return 0.5;

    let totalScore = 0;
    let totalAnswers = 0;

    for (const item of items) {
        for (const config of CALLS_SCORE_FIELDS) {
            const score = scoreCallsFieldValue(getFieldValue(item, config.field), config.map);
            if (score == null) continue;
            totalScore += score;
            totalAnswers++;
        }
    }

    if (totalAnswers === 0) return 0.5;
    return Math.min(1, (totalScore / totalAnswers) / 3);
}

function getRemarksQ(pid) {
    const p = partnersData[pid];
    if (!p || p.remarkScores.length === 0) return 1.0;
    const totalPenalty = p.remarkScores.reduce((sum, penalty) => sum + penalty, 0);
    const reliefFactor = getRemarksReliefFactor(pid);
    return Math.max(0, Math.min(1, 1 - (totalPenalty / reliefFactor)));
}

function getRealizationQ(pid) {
    void pid;
    return 1.0;
}

function findNumericField(item, patterns) {
    if (!item || typeof item !== 'object') return null;
    for (const key of Object.keys(item)) {
        const val = item[key];
        if (val == null) continue;
        const v = parseFloat(val);
        if (!Number.isNaN(v) && patterns.some(p => p.test(key.toLowerCase()))) return v;
    }
    return null;
}

function getTrainingQ(pid) {
    const items = opuByPartner[pid];
    if (!items || items.length === 0) return 0.4;
    let total = 0;
    let count = 0;
    for (const i of items) {
        const avgSum = parseFloat(getFieldValue(i, FIELDS.OPU_AVERAGE_SUM));
        if (Number.isNaN(avgSum)) continue;
        total += avgSum;
        count++;
    }
    if (count === 0) return 0.4;
    return Math.min(1, (total / count) / 10);
}

function getDisciplineBaseQ(pid) {
    const stats = disciplineStatsByPartner[String(pid)];
    if (!stats || stats.totalMeetings <= 0) return 1.0;
    return Math.max(0, 1 - (stats.absences / stats.totalMeetings));
}

function getDisciplineManualRule(pid) {
    return MANUAL_DISCIPLINE_LIMITS[String(pid)] || null;
}

function getDisciplineQ(pid) {
    const baseQ = getDisciplineBaseQ(pid);
    const manualRule = getDisciplineManualRule(pid);
    if (!manualRule) return baseQ;
    return Math.min(baseQ, manualRule.maxQ);
}

function getAuditQ(pid) {
    return auditCountsByPartner[String(pid)] ?? 0;
}
function getUpravlenkaQ(pid) {
    const record = managementScoresByPartner[String(pid)];
    return record ? record.score : 1.0;
}
function getClocksterQ(pid) {
    const totalObjects = deals69.reduce((sum, deal) => {
        return sum + (normalizePartnerId(deal) === pid ? 1 : 0);
    }, 0);
    if (totalObjects <= 0) return 1.0;

    const metric = clocksterMetricsByPartner[String(pid)];
    if (!metric) return 0;

    if (usesHoursBasedClockster(pid)) {
        return Math.min(1, metric.hours / totalObjects);
    }

    return Math.min(1, (metric.visits ?? 0) / totalObjects);
}
function getUmsrmQ(_pid) { return 1.0; }

function formatMetricNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '0';
    return Number(value).toFixed(digits).replace(/\.00$/, '');
}

function roundTo(value, digits = 2) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const factor = 10 ** digits;
    return Math.round(numeric * factor) / factor;
}

function formatPercent(value, digits = 0) {
    if (!Number.isFinite(value)) return '0%';
    return `${(Number(value) * 100).toFixed(digits).replace(/\.00$/, '')}%`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getCallsMetricDetail(pid) {
    const items = callsByPartner[pid] || [];
    let totalScore = 0;
    let totalAnswers = 0;

    for (const item of items) {
        for (const config of CALLS_SCORE_FIELDS) {
            const score = scoreCallsFieldValue(getFieldValue(item, config.field), config.map);
            if (score == null) continue;
            totalScore += score;
            totalAnswers += 1;
        }
    }

    if (totalAnswers === 0) {
        return { format: 'percent', digits: 0, sub: 'нет данных', title: 'Нет заполненных ответов по обзвону' };
    }

    const maxScore = totalAnswers * 3;
    return {
        format: 'percent',
        digits: 0,
        sub: `${formatMetricNumber(totalScore, 0)}/${formatMetricNumber(maxScore, 0)}`,
        title: `Сумма баллов: ${formatMetricNumber(totalScore, 0)} из ${formatMetricNumber(maxScore, 0)}`
    };
}

function getRemarksMetricDetail(pid) {
    const metric = remarkMetricsByPartner[String(pid)];
    if (!metric || metric.rowCount === 0) {
        return { format: 'percent', digits: 0, sub: 'нет данных', title: 'Нет замечаний в выбранном срезе' };
    }

    const reliefFactor = getRemarksReliefFactor(pid);

    const notes = [];
    if (metric.skippedMissingRemarkDate) {
        notes.push(`без даты замечания: ${metric.skippedMissingRemarkDate}`);
    }
    if (metric.skippedMissingFeedbackDate) {
        notes.push(`без обратной связи: ${metric.skippedMissingFeedbackDate}`);
    }
    const missingNote = notes.length ? `, ${notes.join(', ')}` : '';

    return {
        format: 'percent',
        digits: 0,
        sub: `${metric.totalLateDays}/${metric.rowCount}`,
        title: `Дней просрочки: ${metric.totalLateDays}, замечаний: ${metric.rowCount}, штраф: ${formatMetricNumber(metric.totalPenalty, 2)}, послабление за объем: x${formatMetricNumber(reliefFactor, 2)}${missingNote}`
    };
}

function getAuditMetricDetail(pid) {
    const count = auditCountsByPartner[String(pid)] ?? 0;
    return {
        displayValue: count,
        digits: 0,
        sub: 'сделок',
        title: `Отрицательных аудитов по полю "Дата проверки объекта": ${formatMetricNumber(count, 0)}; штраф: -${formatMetricNumber(count * AUDIT_NEGATIVE_DEAL_PENALTY, 0)} бал.`
    };
}

function getRealizationMetricDetail(pid) {
    void pid;
    return { format: 'percent', digits: 0, displayText: '-', sub: 'заглушка', title: 'ФОТ временно отключён и не влияет на расчёт' };
}

function getUpravlenkaMetricDetail(pid) {
    const record = managementScoresByPartner[String(pid)];
    if (!record) {
        return { format: 'percent', digits: 0, sub: 'нет оценки', title: 'Нет ручной оценки управленки за выбранный период' };
    }
    return {
        format: 'percent',
        digits: 0,
        sub: `${formatMetricNumber(record.score, 2)}/1`,
        title: `Ручной балл управленки: ${formatMetricNumber(record.score, 2)}`
    };
}

function getClocksterMetricDetail(pid) {
    const totalObjects = deals69.reduce((sum, deal) => sum + (normalizePartnerId(deal) === pid ? 1 : 0), 0);
    const metric = clocksterMetricsByPartner[String(pid)];

    if (usesHoursBasedClockster(pid)) {
        const hours = metric?.hours ?? 0;
        return {
            format: 'percent',
            digits: 0,
            sub: `${formatMetricNumber(hours, 1)}ч/${formatMetricNumber(totalObjects, 0)}`,
            title: `Часы на объектах: ${formatMetricNumber(hours, 1)}, объектов в 69: ${formatMetricNumber(totalObjects, 0)}`
        };
    }

    const visits = metric?.visits ?? 0;
    const uniqueObjects = metric?.uniqueObjects ?? 0;
    return {
        format: 'percent',
        digits: 0,
        sub: `${formatMetricNumber(visits, 0)}/${formatMetricNumber(totalObjects, 0)}`,
        title: `Дедуп приходов Адрес+Дата: ${formatMetricNumber(visits, 0)}, уникальных объектов: ${formatMetricNumber(uniqueObjects, 0)}, объектов в 69: ${formatMetricNumber(totalObjects, 0)}`
    };
}

function getTrainingMetricDetail(pid) {
    const items = opuByPartner[pid] || [];
    let total = 0;
    let count = 0;

    for (const item of items) {
        const avgSum = parseFloat(getFieldValue(item, FIELDS.OPU_AVERAGE_SUM));
        if (Number.isNaN(avgSum)) continue;
        total += avgSum;
        count += 1;
    }

    if (count === 0) {
        return { format: 'percent', digits: 0, sub: '4/10', title: 'Нет записей обучения за выбранный период; применяется дефолт 40%' };
    }

    const avg = total / count;
    return {
        format: 'percent',
        digits: 0,
        sub: `${formatMetricNumber(avg, 2)}/10`,
        title: `Средняя сумма: ${formatMetricNumber(avg, 2)} из 10`
    };
}

function getDisciplineMetricDetail(pid) {
    const stats = disciplineStatsByPartner[String(pid)];
    const manualRule = getDisciplineManualRule(pid);

    if (!stats || stats.totalMeetings <= 0) {
        return {
            format: 'percent',
            digits: 0,
            sub: '',
            title: manualRule
                ? `Ограничение по дисциплине для ${manualRule.label}: максимум ${formatPercent(manualRule.maxQ)}`
                : 'Нет планерок дисциплины за выбранный период'
        };
    }

    const present = Math.max(0, stats.totalMeetings - stats.absences);
    return {
        format: 'percent',
        digits: 0,
        sub: manualRule ? '' : `${formatMetricNumber(present, 0)}/${formatMetricNumber(stats.totalMeetings, 0)}`,
        title: `Присутствий: ${formatMetricNumber(present, 0)} из ${formatMetricNumber(stats.totalMeetings, 0)}, пропусков: ${formatMetricNumber(stats.absences, 0)}${manualRule ? `; лимит по дисциплине: ${formatPercent(manualRule.maxQ)}` : ''}`
    };
}

function getUmsrmMetricDetail() {
    return { format: 'percent', digits: 0, displayText: '-', sub: 'заглушка', title: 'УМС/РМ пока не подключен к реальным данным' };
}

function buildMetricDetails(pid) {
    return {
        calls: getCallsMetricDetail(pid),
        remarks: getRemarksMetricDetail(pid),
        audit: getAuditMetricDetail(pid),
        realization: getRealizationMetricDetail(pid),
        upravlenka: getUpravlenkaMetricDetail(pid),
        clockster: getClocksterMetricDetail(pid),
        training: getTrainingMetricDetail(pid),
        discipline: getDisciplineMetricDetail(pid),
        umsrm: getUmsrmMetricDetail(pid)
    };
}

const MATRIX_CRITERIA_BY_KEY = Object.fromEntries(
    Object.values(MATRIX)
        .flat()
        .map(criteria => [criteria.key, criteria])
);

function renderMetricCell(value, detail) {
    const sub = detail?.sub || '';
    const title = detail?.title ? ` title="${detail.title.replace(/"/g, '&quot;')}"` : '';
    const displayValue = Number(detail?.displayValue ?? value ?? 0);
    const digits = Number.isFinite(detail?.digits) ? detail.digits : 2;
    const mainValue = typeof detail?.displayText === 'string'
        ? detail.displayText
        : detail?.format === 'percent'
        ? formatPercent(displayValue, digits)
        : (Number.isFinite(displayValue) ? displayValue.toFixed(digits) : '0');
    return `<td${title}><div class="metric-main">${mainValue}</div><div class="metric-sub">${sub}</div></td>`;
}

function renderSummaryCell(value, detail) {
    const sub = detail?.sub || '';
    const title = detail?.title ? ` title="${detail.title.replace(/"/g, '&quot;')}"` : '';
    return `<td${title}><div class="metric-main">${(value ?? 0).toFixed(1)}</div><div class="metric-sub">${sub}</div></td>`;
}

function getVisibleMatrixColumns() {
    const columns = [{ type: 'partner', label: 'Партнер' }];

    for (const group of MATRIX_GROUP_CONFIG) {
        columns.push({
            type: 'group-summary',
            label: group.label,
            groupId: group.id,
            scoreField: group.scoreField,
            sub: group.sub
        });

        if (expandedMatrixGroups[group.id]) {
            for (const item of group.items) {
                columns.push({
                    type: 'metric',
                    label: item.label,
                    metricKey: item.key,
                    groupId: group.id
                });
            }
        }
    }

    columns.push({ type: 'raw-total', label: 'Сумма' });
    columns.push({ type: 'coeff', label: 'Коэфф.' });
    columns.push({ type: 'total', label: 'Итог' });

    return columns;
}

function getMatrixColumnClasses(columns, index) {
    const prevColumn = columns[index - 1];
    const column = columns[index];
    const nextColumn = columns[index + 1];
    const classes = [];

    if (column.type !== 'partner') {
        classes.push('matrix-col-value');
    }

    if (column.type === 'group-summary') {
        classes.push('matrix-col-summary');
    }

    if (column.type === 'raw-total' || column.type === 'coeff' || column.type === 'total') {
        classes.push('matrix-col-total-cell');
    }

    const isGroupStart = Boolean(column.groupId) && (!prevColumn || column.groupId !== prevColumn.groupId);
    if (isGroupStart) {
        classes.push('matrix-col-group-start');
    }

    if (index < columns.length - 1) {
        classes.push('matrix-col-divider');
    }

    const isPartnerBoundary = column.type === 'partner';
    const isGroupBoundary = Boolean(column.groupId) && (!nextColumn || column.groupId !== nextColumn.groupId);
    const isTotalsBoundary = column.type === 'raw-total' || column.type === 'coeff';

    if (isPartnerBoundary || isGroupBoundary || isTotalsBoundary) {
        classes.push('matrix-col-group-end');
    }

    return classes.join(' ');
}

function areAllMatrixGroupsExpanded() {
    return Object.values(expandedMatrixGroups).every(Boolean);
}

function getExamplePartnerRow() {
    if (!matrixRows.length) return null;
    return matrixRows.find(row => row.bitrixPartnerId === selectedExamplePartnerId) || matrixRows[0];
}

function getExampleMetricValue(detail, value) {
    if (typeof detail?.displayText === 'string') return detail.displayText;
    if (detail?.format === 'percent') return formatPercent(value);
    return formatMetricNumber(value, Number.isFinite(detail?.digits) ? detail.digits : 2);
}

function buildExampleMetricMarkup(label, value, lines = []) {
    return `
        <div class="example-calc-metric">
            <div class="example-calc-metric-head">
                <span class="example-calc-metric-label">${escapeHtml(label)}</span>
                <strong class="example-calc-metric-value">${escapeHtml(value)}</strong>
            </div>
            ${lines.map(line => `<div class="example-calc-metric-sub">${escapeHtml(line)}</div>`).join('')}
        </div>
    `;
}

function formatExampleCalculation(row) {
    const q = row.q;
    const details = row.details || {};
    const complexityParts = row.complexityParts || {
        objectsCoeff: 1,
        areaCoeff: 1,
        opuCoeff: 1,
        accountCoeff: 1,
        total: row.complexityCoeff || 1
    };
    const accountCoeffStats = accountCoeffStatsByPartner[String(row.bitrixPartnerId)] || null;
    const callsCriteria = MATRIX_CRITERIA_BY_KEY.calls;
    const remarksCriteria = MATRIX_CRITERIA_BY_KEY.remarks;
    const realizationCriteria = MATRIX_CRITERIA_BY_KEY.realization;
    const upravlenkaCriteria = MATRIX_CRITERIA_BY_KEY.upravlenka;
    const clocksterCriteria = MATRIX_CRITERIA_BY_KEY.clockster;
    const trainingCriteria = MATRIX_CRITERIA_BY_KEY.training;
    const disciplineCriteria = MATRIX_CRITERIA_BY_KEY.discipline;
    const umsrmCriteria = MATRIX_CRITERIA_BY_KEY.umsrm;

    const columns = [
        {
            title: 'Отношения',
            items: [
                buildExampleMetricMarkup('Обзвон', getExampleMetricValue(details.calls, q.calls), [
                    `Ответы: ${details.calls?.sub || 'нет данных'}`,
                    `Вклад: ${(callsCriteria.weight * q.calls * callsCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Замечания', getExampleMetricValue(details.remarks, q.remarks), [
                    `Дни просрочки / замечания: ${details.remarks?.sub || 'нет данных'}`,
                    `Послабление объёма: x${formatMetricNumber(getRemarksReliefFactor(row.bitrixPartnerId), 2)}`,
                    `Вклад: ${(remarksCriteria.weight * q.remarks * remarksCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Аудит качества', `${formatMetricNumber(q.audit, 0)} сделок`, [
                    `Штраф: ${formatMetricNumber(q.audit, 0)} × ${AUDIT_NEGATIVE_DEAL_PENALTY} = -${formatMetricNumber(row.auditPenaltyScore || 0, 0)} бал.`
                ])
            ]
        },
        {
            title: 'Деньги',
            items: [
                buildExampleMetricMarkup('ФОТ', getExampleMetricValue(details.realization, q.realization), [
                    `Оплачено / всего: ${details.realization?.sub || 'нет данных'}`,
                    `Вклад: ${(realizationCriteria.weight * q.realization * realizationCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Управленка', getExampleMetricValue(details.upravlenka, q.upravlenka), [
                    `Оценка: ${details.upravlenka?.sub || 'нет данных'}`,
                    `Вклад: ${(upravlenkaCriteria.weight * q.upravlenka * upravlenkaCriteria.influence).toFixed(1)} бал.`
                ])
            ]
        },
        {
            title: 'ОПУ',
            items: [
                buildExampleMetricMarkup('Клокстер', getExampleMetricValue(details.clockster, q.clockster), [
                    `База: ${details.clockster?.sub || 'нет данных'}`,
                    `Вклад: ${(clocksterCriteria.weight * q.clockster * clocksterCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Обучение', getExampleMetricValue(details.training, q.training), [
                    `Средняя сумма: ${details.training?.sub || 'нет данных'}`,
                    `Вклад: ${(trainingCriteria.weight * q.training * trainingCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Дисциплины', getExampleMetricValue(details.discipline, q.discipline), [
                    ...(details.discipline?.sub ? [`Планерки: ${details.discipline.sub}`] : []),
                    `Вклад: ${(disciplineCriteria.weight * q.discipline * disciplineCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('УМС/РМ', getExampleMetricValue(details.umsrm, q.umsrm), [
                    `Источник: ${details.umsrm?.sub || 'заглушка'}`,
                    `Вклад: ${(umsrmCriteria.weight * q.umsrm * umsrmCriteria.influence).toFixed(1)} бал.`
                ])
            ]
        }
    ];

    const columnsHtml = columns.map(column => `
        <section class="example-calc-column">
            <div class="example-calc-column-title">${escapeHtml(column.title)}</div>
            ${column.items.join('')}
        </section>
    `).join('');

    const totalHtml = `
        <div class="example-calc-total-title">Итог</div>
        <div class="example-calc-total-grid">
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Отношения</div>
                <div class="example-calc-total-value">${escapeHtml((row.relationsScore || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Деньги</div>
                <div class="example-calc-total-value">${escapeHtml((row.moneyScore || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">ОПУ</div>
                <div class="example-calc-total-value">${escapeHtml((row.operationsScore || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Сумма</div>
                <div class="example-calc-total-value">${escapeHtml((row.rawTotal || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">К. объектов</div>
                <div class="example-calc-total-value">${escapeHtml((complexityParts.objectsCoeff || 1).toFixed(3))}</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">К. площади</div>
                <div class="example-calc-total-value">${escapeHtml((complexityParts.areaCoeff || 1).toFixed(3))}</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">К. ОПУ</div>
                <div class="example-calc-total-value">${escapeHtml((complexityParts.opuCoeff || 1).toFixed(3))}</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">К. аккаунта</div>
                <div class="example-calc-total-value">${escapeHtml((complexityParts.accountCoeff || 1).toFixed(3))}</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Коэфф. общий</div>
                <div class="example-calc-total-value">${escapeHtml((row.complexityCoeff || 1).toFixed(3))}</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Минус аудит</div>
                <div class="example-calc-total-value">-${escapeHtml((row.auditPenaltyScore || 0).toFixed(2))} бал.</div>
            </div>
        </div>
        <div class="example-calc-total-meta">
            Объекты: ${escapeHtml(formatMetricNumber(row.dealsCount || 0, 0))} · площадь: ${escapeHtml((row.totalArea || 0).toFixed(1))} м²<br>
            Аккаунт: ${escapeHtml(`${accountCoeffStats?.matchedDeals || 0}/${accountCoeffStats?.totalDeals || 0}`)} · нейтрально: ${escapeHtml(formatMetricNumber(accountCoeffStats?.unmatchedDeals || 0, 0))}<br>
            Промежуточный итог: ${escapeHtml((row.preAuditTotalScore || 0).toFixed(2))} бал.
        </div>
        <div class="example-calc-final">
            <div class="example-calc-final-label">Финальный итог</div>
            <div class="example-calc-final-value">${escapeHtml((row.matrixTotalScore || 0).toFixed(2))} бал.</div>
        </div>
    `;

    return { columnsHtml, totalHtml };
}

function renderExampleCalculation() {
    const examplePanel = document.getElementById('exampleCalcPanel');
    const examplePartner = document.getElementById('exampleCalcPartner');
    const exampleFormula = document.getElementById('exampleCalcFormula');
    const exampleTotal = document.getElementById('exampleCalcTotal');
    const exampleSelect = document.getElementById('exampleCalcSelect');

    if (!examplePanel || !examplePartner || !exampleFormula || !exampleTotal || !exampleSelect || matrixRows.length === 0) {
        if (examplePanel) examplePanel.style.display = 'none';
        return;
    }

    if (!selectedExamplePartnerId || !matrixRows.some(row => row.bitrixPartnerId === selectedExamplePartnerId)) {
        selectedExamplePartnerId = matrixRows[0].bitrixPartnerId;
    }

    exampleSelect.innerHTML = matrixRows.map(row => {
        const selectedAttr = row.bitrixPartnerId === selectedExamplePartnerId ? ' selected' : '';
        return `<option value="${row.bitrixPartnerId}"${selectedAttr}>${row.name}</option>`;
    }).join('');

    exampleSelect.onchange = () => {
        selectedExamplePartnerId = exampleSelect.value;
        renderExampleCalculation();
        saveCache();
    };

    const row = getExamplePartnerRow();
    if (!row) {
        examplePanel.style.display = 'none';
        return;
    }

    examplePartner.textContent = `${row.name} · итог ${row.matrixTotalScore.toFixed(2)} · ${row.dealsCount} объектов · ID ${row.bitrixPartnerId}`;
    const { columnsHtml, totalHtml } = formatExampleCalculation(row);
    exampleFormula.innerHTML = columnsHtml;
    exampleTotal.innerHTML = totalHtml;
    examplePanel.style.display = 'block';
}

function setAllMatrixGroups(expanded) {
    for (const key of Object.keys(expandedMatrixGroups)) {
        expandedMatrixGroups[key] = expanded;
    }
}

function renderMatrixGroupControls() {
    const container = document.getElementById('matrixGroupControls');
    if (!container) return;

    container.innerHTML = '';
    const allExpanded = areAllMatrixGroupsExpanded();

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = `matrix-toggle matrix-toggle-all${allExpanded ? ' is-active' : ''}`;
    allButton.textContent = 'Все';
    allButton.title = allExpanded ? 'Свернуть все категории' : 'Раскрыть все категории';
    allButton.setAttribute('aria-pressed', allExpanded ? 'true' : 'false');
    allButton.addEventListener('click', () => {
        setAllMatrixGroups(!areAllMatrixGroupsExpanded());
        renderUI();
        saveCache();
    });
    container.appendChild(allButton);

    for (const group of MATRIX_GROUP_CONFIG) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `matrix-toggle${expandedMatrixGroups[group.id] ? ' is-active' : ''}`;
        button.textContent = group.label;
        button.title = expandedMatrixGroups[group.id]
            ? `Скрыть детали блока "${group.label}"`
            : `Показать детали блока "${group.label}"`;
        button.setAttribute('aria-pressed', expandedMatrixGroups[group.id] ? 'true' : 'false');
        button.addEventListener('click', () => {
            expandedMatrixGroups[group.id] = !expandedMatrixGroups[group.id];
            renderUI();
            saveCache();
        });
        container.appendChild(button);
    }
}

function renderMatrixHeader() {
    const head = document.getElementById('matrixHead');
    if (!head) return;

    const columns = getVisibleMatrixColumns();
    head.innerHTML = `<tr>${columns.map((column, index) => `<th class="${getMatrixColumnClasses(columns, index)}">${column.label}</th>`).join('')}</tr>`;
}

function blockScore(criteriaList, getQ) {
    return criteriaList.reduce((sum, c) => sum + c.weight * getQ(c.key) * c.influence, 0);
}

function getPercentileValue(values, percentile) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * (percentile / 100);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.min(lowerIndex + 1, sorted.length - 1);
    const fraction = index - lowerIndex;
    return sorted[lowerIndex] * (1 - fraction) + sorted[upperIndex] * fraction;
}

function buildComplexityBenchmark(values) {
    const numericValues = (values || []).filter(value => Number.isFinite(value) && value >= 0);
    if (numericValues.length === 0) {
        return { p10: 0, p50: 0, p90: 0 };
    }

    return {
        p10: getPercentileValue(numericValues, 10),
        p50: getPercentileValue(numericValues, 50),
        p90: getPercentileValue(numericValues, 90)
    };
}

function getRemarksReliefFactor(pid) {
    const metric = remarkMetricsByPartner[String(pid)];
    const rowCount = Number(metric?.rowCount) || 0;
    const benchmark = remarksReliefBenchmark;
    const p50 = Number(benchmark?.p50) || 0;
    const p90 = Number(benchmark?.p90) || 0;

    if (rowCount <= 0 || p90 <= p50 || rowCount <= p50) return 1.0;
    if (rowCount >= p90) return 1 + REMARKS_RELIEF_MAX;

    const ratio = (rowCount - p50) / (p90 - p50);
    return 1 + (Math.max(0, Math.min(1, ratio)) * REMARKS_RELIEF_MAX);
}

function buildComplexityBenchmarks() {
    const rows = Object.entries(partnersData)
        .map(([pid, partner]) => ({
            pid,
            name: (partner?.name ?? partnerMap[pid] ?? '').trim(),
            dealsCount: Number(partner?.dealsCount) || 0,
            totalArea: Number(partner?.totalArea) || 0
        }))
        .filter(item => item.name && !isExcluded(item.name) && item.dealsCount > 0);

    complexityBenchmarks = {
        ...complexityBenchmarks,
        objects: buildComplexityBenchmark(rows.map(item => item.dealsCount)),
        area: buildComplexityBenchmark(rows.map(item => item.totalArea))
    };
}

function getPercentileBasedComplexityCoeff(value, benchmark) {
    const numericValue = Number(value) || 0;
    const p10 = Number(benchmark?.p10) || 0;
    const p50 = Number(benchmark?.p50) || 0;
    const p90 = Number(benchmark?.p90) || 0;

    if (p50 <= p10 || p90 <= p50) return 1.0;
    if (numericValue <= p10) return 0.8;
    if (numericValue >= p90) return 1.2;

    if (numericValue <= p50) {
        return 0.8 + ((numericValue - p10) / (p50 - p10)) * 0.2;
    }

    return 1.0 + ((numericValue - p50) / (p90 - p50)) * 0.2;
}

function getComplexityOpu(pid) {
    const stat = opuComplexityStatsByPartner[String(pid)];
    if (!stat) return 1.0;
    const baseCoeff = getPercentileBasedComplexityCoeff(stat.value, complexityBenchmarks.opu);
    return applyHiddenComplexityBoost(pid, 'opu', baseCoeff);
}

function getObjectsComplexityCoeff(pid) {
    const p = partnersData[pid];
    return getPercentileBasedComplexityCoeff(p?.dealsCount || 0, complexityBenchmarks.objects);
}

function getAreaComplexityCoeff(pid) {
    const p = partnersData[pid];
    const baseCoeff = getPercentileBasedComplexityCoeff(p?.totalArea || 0, complexityBenchmarks.area);
    return applyHiddenComplexityBoost(pid, 'area', baseCoeff);
}

function getAccountComplexityCoeff(pid) {
    const baseCoeff = accountCoeffStatsByPartner[String(pid)]?.coeff ?? 1.0;
    return applyHiddenComplexityBoost(pid, 'account', baseCoeff);
}

function applyHiddenComplexityBoost(pid, part, coeff) {
    const delta = Number(HIDDEN_COMPLEXITY_BOOSTS[String(pid)]?.[part]) || 0;
    return Math.max(0.8, Math.min(1.2, (Number(coeff) || 1) + delta));
}

function getComplexityParts(pid) {
    const objectsCoeff = getObjectsComplexityCoeff(pid);
    const areaCoeff = getAreaComplexityCoeff(pid);
    const opuCoeff = getComplexityOpu(pid);
    const accountCoeff = getAccountComplexityCoeff(pid);
    const total = (objectsCoeff + areaCoeff + opuCoeff + accountCoeff) / 4;

    return {
        objectsCoeff,
        areaCoeff,
        opuCoeff,
        accountCoeff,
        total
    };
}

function getComplexityCoeff(pid) {
    return getComplexityParts(pid).total;
}

function buildComplexityTooltip(row) {
    const parts = row?.complexityParts || {};
    const objectBench = complexityBenchmarks.objects || {};
    const areaBench = complexityBenchmarks.area || {};
    const opuBench = complexityBenchmarks.opu || {};
    const accountStats = accountCoeffStatsByPartner[String(row?.bitrixPartnerId)] || {};
    const opuStats = opuComplexityStatsByPartner[String(row?.bitrixPartnerId)] || null;

    const lines = [
        `Общий коэф.: ${(row?.complexityCoeff || 1).toFixed(3)}`,
        '',
        `К. объектов: ${(parts.objectsCoeff || 1).toFixed(3)}`,
        `Объектов в 69: ${row?.dealsCount || 0}`,
        `Сеть p10/p50/p90: ${Math.round(objectBench.p10 || 0)} / ${Math.round(objectBench.p50 || 0)} / ${Math.round(objectBench.p90 || 0)}`,
        '',
        `К. площади: ${(parts.areaCoeff || 1).toFixed(3)}`,
        `Площадь: ${(row?.totalArea || 0).toFixed(1)} м²`,
        `Сеть p10/p50/p90: ${Math.round(areaBench.p10 || 0)} / ${Math.round(areaBench.p50 || 0)} / ${Math.round(areaBench.p90 || 0)} м²`,
        '',
        `К. ОПУ: ${(parts.opuCoeff || 1).toFixed(3)}`,
        `Значение ОПУ: ${opuStats ? opuStats.value : '-'}`,
        `Источник: ${opuStats?.sourceName || 'нет ручного значения'}`,
        `Сеть p10/p50/p90: ${Math.round(opuBench.p10 || 0)} / ${Math.round(opuBench.p50 || 0)} / ${Math.round(opuBench.p90 || 0)}`,
        '',
        `К. аккаунта: ${(parts.accountCoeff || 1).toFixed(3)}`,
        `Совпало сделок: ${accountStats.matchedDeals || 0}/${accountStats.totalDeals || 0}`,
        `Не найдено: ${accountStats.unmatchedDeals || 0}`
    ];

    return lines.join('\n').replace(/"/g, '&quot;');
}

// ——— Проверка исключений ———

function isExcluded(name) {
    const normalizedName = normalizeComparableName(name);
    return EXCLUDED_PARTNERS.some(ex => normalizeComparableName(ex) === normalizedName);
}

// ——— Построение строк матрицы ———

function buildMatrixRows() {
    matrixRows = [];
    const filteredDeals69 = getFilteredDeals69();
    const filteredDeals79 = getFilteredDeals79();
    const activeIds = new Set();
    for (const d of [...filteredDeals69, ...filteredDeals79]) {
        const id = normalizePartnerId(d);
        if (id && id !== '__no_partner__' && id !== 'undefined') activeIds.add(id);
    }
    if (activeIds.size === 0) {
        for (const id of Object.keys(partnerMap)) activeIds.add(id);
    }

    for (const pid of activeIds) {
        const p = partnersData[pid];
        const name = (p?.name ?? partnerMap[pid] ?? `Партнёр ${pid}`).trim();
        if (isExcluded(name)) continue;

        const data = p || { name, dealsCount: 0, totalScore: 0, totalOpportunity: 0, totalArea: 0, dealIds: [], realizationScores: [], remarkScores: [] };
        const q = {
            calls: getCallsQ(pid),
            remarks: getRemarksQ(pid),
            audit: getAuditQ(pid),
            realization: getRealizationQ(pid),
            upravlenka: getUpravlenkaQ(pid),
            clockster: getClocksterQ(pid),
            training: getTrainingQ(pid),
            discipline: getDisciplineQ(pid),
            umsrm: getUmsrmQ(pid),
        };
        const details = buildMetricDetails(pid);

        const relationsCriteria = MATRIX.relations.filter(criteria => criteria.key !== 'audit');
        const relationsScore = blockScore(relationsCriteria, k => q[k] ?? 1.0);
        const moneyScore = blockScore(MATRIX.money, k => q[k] ?? 1.0);
        const operationsScore = blockScore(MATRIX.operations, k => q[k] ?? 1.0);
        const rawTotal = relationsScore + moneyScore + operationsScore;
        const complexityParts = getComplexityParts(pid);
        const complexityCoeff = complexityParts.total;
        const displayedRawTotal = roundTo(rawTotal, 1);
        const displayedComplexityCoeff = roundTo(complexityCoeff, 2);
        const preAuditTotalScore = displayedRawTotal * displayedComplexityCoeff;
        const auditPenaltyScore = q.audit * AUDIT_NEGATIVE_DEAL_PENALTY;
        const matrixTotalScore = roundTo(preAuditTotalScore - auditPenaltyScore, 2);
        const avgScore = data.dealsCount ? data.totalScore / data.dealsCount : 0;

        matrixRows.push({
            bitrixPartnerId: pid,
            name: data.name,
            q,
            dealsCount: data.dealsCount || 0,
            totalArea: data.totalArea || 0,
            relationsScore, moneyScore, operationsScore,
            rawTotal, complexityCoeff, complexityParts, preAuditTotalScore, auditPenaltyScore, matrixTotalScore,
            partnerLevel: matrixTotalScore >= 80 ? 'A' : matrixTotalScore >= 50 ? 'B' : 'C',
            statusZone: avgScore > 0.8 ? 'green' : avgScore > 0.5 ? 'yellow' : 'red',
            statusLabel: avgScore > 0.8 ? 'Excellent' : avgScore > 0.5 ? 'Good' : 'Needs Review',
            details,
            remarksCount: data.remarksCount || 0,
            remarksLateDaysTotal: data.remarkLateDaysTotal || 0,
            remarkMissingDateCount: data.remarkMissingDateCount || 0,
            remarkMissingFeedbackCount: data.remarkMissingFeedbackCount || 0,
            history: data.history || []
        });
    }
    matrixRows.sort((a, b) => b.matrixTotalScore - a.matrixTotalScore);
}

// ——— Рендер UI ———

function renderUI() {
    const partners = Object.values(partnersData)
        .filter(p => !isExcluded(p.name))
        .sort((a, b) => (b.totalScore / (b.dealsCount || 1)) - (a.totalScore / (a.dealsCount || 1)));

    const tbody = document.getElementById('partnersBody');
    if (tbody) {
        tbody.innerHTML = '';
        for (const p of partners) {
            const avg = p.dealsCount ? (p.totalScore / p.dealsCount).toFixed(2) : '0';
            const badgeClass = avg > 0.8 ? 'score-high' : avg > 0.5 ? 'score-mid' : 'score-low';
            const tr = document.createElement('tr');
            tr.className = 'partner-row';
            tr.innerHTML = `
                <td>${p.name}</td>
                <td>${p.dealsCount}</td>
                <td><span class="score-badge ${badgeClass}">${avg}</span></td>
                <td>${p.remarksCount}</td>
                <td>${avg > 0.8 ? 'Excellent' : avg > 0.5 ? 'Good' : 'Needs Review'}</td>
            `;
            tbody.appendChild(tr);
        }
    }

    renderMatrixGroupControls();
    renderMatrixHeader();

    const matrixBody = document.getElementById('matrixBody');
    matrixBody.innerHTML = '';
    const visibleColumns = getVisibleMatrixColumns();
    for (const [rowIndex, row] of matrixRows.entries()) {
        const tr = document.createElement('tr');
        tr.className = 'partner-row';
        const qk = row.q;
        const dk = row.details || {};
        const tooltip = `Сделок: ${row.dealsCount}\nПлощадь: ${(row.totalArea || 0).toFixed(1)} м²\nЗамечаний: ${row.remarksCount}\nДней просрочки: ${row.remarksLateDaysTotal || 0}\nПослабление по замечаниям: x${formatMetricNumber(getRemarksReliefFactor(row.bitrixPartnerId), 2)}\nБез даты замечания: ${row.remarkMissingDateCount || 0}\nБез обратной связи: ${row.remarkMissingFeedbackCount || 0}\nУровень: ${row.partnerLevel}\nID: ${row.bitrixPartnerId}`;
        const complexityTooltip = buildComplexityTooltip(row);

        const cells = visibleColumns.map((column, index) => {
            const className = getMatrixColumnClasses(visibleColumns, index);
            const classAttr = className ? ` class="${className}${column.type === 'partner' ? ' partner-name-cell' : ''}"` : (column.type === 'partner' ? ' class="partner-name-cell"' : '');
            switch (column.type) {
                case 'partner':
                    return `<td${classAttr} title="${tooltip}"><div class="partner-rank-cell"><span class="partner-rank-index">${rowIndex + 1}</span><span class="partner-rank-name">${escapeHtml(row.name)}</span></div></td>`;
                case 'group-summary':
                    return renderSummaryCell(row[column.scoreField], {
                        sub: column.sub,
                        title: `${column.label}: ${(row[column.scoreField] || 0).toFixed(1)}`
                    }).replace('<td', `<td class="${className}"`);
                case 'metric':
                    return renderMetricCell(qk[column.metricKey], dk[column.metricKey]).replace('<td', `<td class="${className}"`);
                case 'raw-total':
                    return `<td${classAttr}>${(row.rawTotal || 0).toFixed(1)}</td>`;
                case 'coeff':
                    return `<td${classAttr} title="${complexityTooltip}">${(row.complexityCoeff || 1).toFixed(2)}</td>`;
                case 'total':
                    return `<td${classAttr}><strong>${(row.matrixTotalScore || 0).toFixed(1)}</strong></td>`;
                default:
                    return `<td${classAttr}></td>`;
            }
        });

        tr.innerHTML = cells.join('');
        matrixBody.appendChild(tr);
    }

    renderExampleCalculation();

    updateStats(matrixRows, partners);
    updateLastUpdatedLabel();
}

function updateStats(matrixData, partners) {
    const activeMatrixRows = Array.isArray(matrixData) ? matrixData.filter(row => (row.dealsCount || 0) > 0) : [];
    const fallbackPartners = Array.isArray(partners) ? partners.filter(p => (p.dealsCount || 0) > 0) : [];

    if (activeMatrixRows.length > 0) {
        const totalAvg = (activeMatrixRows.reduce((sum, row) => sum + (row.matrixTotalScore || 0), 0) / activeMatrixRows.length).toFixed(1);
        document.getElementById('avgScoreTotal').textContent = totalAvg;
        document.getElementById('activeDealsCount').textContent = activeMatrixRows.length;
        document.getElementById('topPartnerName').textContent = activeMatrixRows[0].name || '—';
        return;
    }

    if (fallbackPartners.length === 0) return;

    const totalAvg = (fallbackPartners.reduce((sum, p) => sum + (p.totalScore / (p.dealsCount || 1)), 0) / fallbackPartners.length).toFixed(2);
    document.getElementById('avgScoreTotal').textContent = totalAvg;
    document.getElementById('activeDealsCount').textContent = fallbackPartners.length;
    document.getElementById('topPartnerName').textContent = fallbackPartners[0]?.name || '—';
}

function updateLastUpdatedLabel() {
    let el = document.getElementById('lastUpdated');
    if (!el) {
        el = document.createElement('span');
        el.id = 'lastUpdated';
        el.style.cssText = 'font-size:0.8rem;color:var(--text-dim);margin-left:1rem;';
        document.getElementById('refreshBtn')?.parentElement?.appendChild(el);
    }
    const d = lastRenderedTimestamp ? new Date(lastRenderedTimestamp) : new Date();
    el.textContent = `Данные от ${d.toLocaleDateString('ru')} ${d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`;
}

// ——— localStorage кэш ———

function saveCache() {
    try {
        const payload = {
            timestamp: lastRenderedTimestamp || Date.now(),
            selectedMonth: getSelectedMonth(),
            selectedExamplePartnerId,
            expandedMatrixGroups,
            clocksterMetricsCache,
            partnerMap, companyMap, accountCoefficientRows, deals69, deals79, remarkDeals, callsItems, disciplineItems, opuItems, managementItems, list115PartnerByElementId, fotDbItems
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (_) {}
}

function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data?.timestamp || Date.now() - data.timestamp > CACHE_TTL) return null;
        return data;
    } catch (_) { return null; }
}

function applyBootstrapSnapshot(snapshot) {
    partnerMap = snapshot.partnerMap || {};
    companyMap = snapshot.companyMap || {};
    accountCoefficientRows = snapshot.accountCoefficientRows || [];
    rebuildAccountCoefficientLookup();
    list115PartnerByElementId = snapshot.list115PartnerByElementId || {};
    lastUserMap = snapshot.lastUserMap || {};
    deals69 = snapshot.deals69 || [];
    deals79 = snapshot.deals79 || [];
    remarkDeals = snapshot.remarkDeals || [];
    callsItems = snapshot.callsItems || [];
    disciplineItems = snapshot.disciplineItems || [];
    opuItems = snapshot.opuItems || [];
    managementItems = snapshot.managementItems || [];
    fotDbItems = snapshot.fotDbItems || [];
    clocksterMetricsCache = snapshot.clocksterMetricsCache || {};
    clocksterMetricsByPartner = clocksterMetricsCache[getClocksterMonthKey()] || {};
}

function renderFromSnapshot(snapshot, { persistCache = false } = {}) {
    if (typeof document !== 'undefined') {
        const select = document.getElementById('monthSelect');
        if (select && snapshot?.selectedMonth) {
            select.value = normalizeSelectedMonth(snapshot.selectedMonth);
        }
    }
    if (snapshot?.selectedExamplePartnerId) {
        selectedExamplePartnerId = String(snapshot.selectedExamplePartnerId);
    }
    if (snapshot?.expandedMatrixGroups) {
        expandedMatrixGroups = {
            ...expandedMatrixGroups,
            ...snapshot.expandedMatrixGroups
        };
    }
    applyBootstrapSnapshot(snapshot);
    buildIndexes();
    processData();
    lastRenderedTimestamp = Number(snapshot?.timestamp) || Date.now();
    if (persistCache) saveCache();
    buildMatrixRows();
    renderUI();
}

// ——— Главная функция загрузки ———

async function loadDashboard(options = {}) {
    const forceRefresh = Boolean(options.forceRefresh);
    const refreshBtn = document.getElementById('refreshBtn');
    const cached = !forceRefresh ? loadCache() : null;
    const hasCachedData = Array.isArray(cached?.deals69) && cached.deals69.length > 0;
    const hasVisibleRows = matrixRows.length > 0;
    if (refreshBtn) refreshBtn.disabled = true;
    const originalRefreshText = refreshBtn?.textContent || 'Обновить данные';

    if (hasCachedData) {
        try {
            renderFromSnapshot(cached);
            showLoader(false);
        } catch (error) {
            console.warn('cached snapshot render failed', error);
        }
    } else {
        if (!hasVisibleRows) {
            showLoader(true, 'Подключение к серверу...', 5);
        }
    }

    if (forceRefresh && refreshBtn) {
        refreshBtn.textContent = 'Обновляем...';
    }

    try {
        if (!forceRefresh && hasCachedData) {
            return;
        }
        if (!hasCachedData && !hasVisibleRows) {
            showLoader(true, 'Загрузка данных с сервера...', 15);
        }
        if (forceRefresh) {
            clocksterMetricsCache = {};
            try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
        }
        const bootstrap = await fetchBootstrapData(forceRefresh);

        const hasNewData = Array.isArray(bootstrap?.deals69) && bootstrap.deals69.length > 0;

        if (hasNewData) {
            if (!hasCachedData && !forceRefresh && !hasVisibleRows) {
                showLoader(true, 'Обработка данных...', 70);
            }
            applyBootstrapSnapshot(bootstrap);
        }

        if (!hasCachedData && !forceRefresh && !hasVisibleRows) {
            showLoader(true, 'Загрузка Clockster...', 85);
        }
        await refreshClocksterMetrics();
        const snapshotToPersist = {
            ...bootstrap,
            timestamp: Date.now(),
            selectedMonth: getSelectedMonth(),
            selectedExamplePartnerId,
            expandedMatrixGroups,
            clocksterMetricsCache
        };
        renderFromSnapshot(snapshotToPersist, { persistCache: true });
        if (!hasCachedData && !forceRefresh && !hasVisibleRows) {
            showLoader(true, 'Готово', 100);
        }
    } catch (err) {
        console.error('Ошибка загрузки:', err);
        if (!hasCachedData) {
            const fallbackCache = loadCache();
            if (fallbackCache) {
                renderFromSnapshot(fallbackCache);
            } else {
                buildMatrixRows();
                renderUI();
            }
        } else {
            buildMatrixRows();
            renderUI();
        }
    } finally {
        showLoader(false);
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = originalRefreshText;
        }
    }
}

function applyTestState(patch = {}) {
    if (Object.hasOwn(patch, 'deals69')) deals69 = patch.deals69;
    if (Object.hasOwn(patch, 'deals79')) deals79 = patch.deals79;
    if (Object.hasOwn(patch, 'remarkDeals')) remarkDeals = patch.remarkDeals;
    if (Object.hasOwn(patch, 'callsItems')) callsItems = patch.callsItems;
    if (Object.hasOwn(patch, 'disciplineItems')) disciplineItems = patch.disciplineItems;
    if (Object.hasOwn(patch, 'opuItems')) opuItems = patch.opuItems;
    if (Object.hasOwn(patch, 'managementItems')) managementItems = patch.managementItems;
    if (Object.hasOwn(patch, 'fotDbItems')) fotDbItems = patch.fotDbItems;
    if (Object.hasOwn(patch, 'partnerMap')) partnerMap = patch.partnerMap;
    if (Object.hasOwn(patch, 'companyMap')) companyMap = patch.companyMap;
    if (Object.hasOwn(patch, 'accountCoefficientRows')) {
        accountCoefficientRows = patch.accountCoefficientRows;
        rebuildAccountCoefficientLookup();
    }
    if (Object.hasOwn(patch, 'list115PartnerByElementId')) list115PartnerByElementId = patch.list115PartnerByElementId;
    if (Object.hasOwn(patch, 'lastUserMap')) lastUserMap = patch.lastUserMap;
    if (Object.hasOwn(patch, 'clocksterMetricsByPartner')) clocksterMetricsByPartner = patch.clocksterMetricsByPartner;
    if (Object.hasOwn(patch, 'clocksterMetricsCache')) clocksterMetricsCache = patch.clocksterMetricsCache;
    if (Object.hasOwn(patch, 'partnersData')) partnersData = patch.partnersData;
    if (Object.hasOwn(patch, 'remarkMetricsByPartner')) remarkMetricsByPartner = patch.remarkMetricsByPartner;
    if (Object.hasOwn(patch, 'auditCountsByPartner')) auditCountsByPartner = patch.auditCountsByPartner;
    if (Object.hasOwn(patch, 'expandedMatrixGroups')) expandedMatrixGroups = patch.expandedMatrixGroups;
}

function resetTestState() {
    applyTestState({
        deals69: [],
        deals79: [],
        remarkDeals: [],
        callsItems: [],
        disciplineItems: [],
        opuItems: [],
        managementItems: [],
        fotDbItems: [],
        partnerMap: {},
        companyMap: {},
        accountCoefficientRows: [],
        lastUserMap: {},
        list115PartnerByElementId: {},
        clocksterMetricsByPartner: {},
        clocksterMetricsCache: {},
        partnersData: {},
        remarkMetricsByPartner: {},
        auditCountsByPartner: {},
        expandedMatrixGroups: {
            relations: false,
            money: false,
            operations: false
        }
    });
    callsByPartner = {};
    opuByPartner = {};
    fotTriggerDealsByPartner = {};
    disciplineStatsByPartner = {};
    managementScoresByPartner = {};
    remarkMetricsByPartner = {};
    auditCountsByPartner = {};
    accountCoeffStatsByPartner = {};
    opuComplexityStatsByPartner = {};
    remarksReliefBenchmark = null;
    complexityBenchmarks = {
        objects: null,
        area: null,
        opu: null
    };
    fotDbStatsByPartnerMonth = {};
    fotDbPartnerLookup = {};
    selectedExamplePartnerId = '';
    lastRenderedTimestamp = 0;
    expandedMatrixGroups = {
        relations: false,
        money: false,
        operations: false
    };
    matrixRows = [];
}

const DASHBOARD_TEST_API = {
    applyTestState,
    resetTestState,
    buildIndexes,
    buildMatrixRows,
    processData,
    getAllowedReportingMonths,
    normalizeSelectedMonth,
    getDefaultMonthSelection,
    getVisibleMatrixColumns,
    calculateRemarkLateDays,
    calculateRemarkPenalty,
    extractDealMonthKey,
    extractTrainingMonthKey,
    getFotDbMonthsForSelection,
    getFilteredDeals69,
    getCallsQ,
    getRemarksQ,
    getAuditQ,
    getRealizationQ,
    getTrainingQ,
    getDisciplineQ,
    getUpravlenkaQ,
    getClocksterQ,
    buildClocksterMetrics,
    applyHiddenComplexityBoost,
    getMatrixRowsSnapshot: () => matrixRows.map(row => ({ ...row }))
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DASHBOARD_TEST_API;
}

// ——— Запуск ———

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    document.getElementById('refreshBtn').addEventListener('click', () => loadDashboard({ forceRefresh: true }));
    document.getElementById('monthSelect')?.addEventListener('change', () => {
        Promise.resolve().then(async () => {
            buildIndexes();
            processData();
            await refreshClocksterMetrics();
            buildMatrixRows();
            renderUI();
            saveCache();
        });
    });

    window.addEventListener('load', () => {
        setupMonthSelect();
        loadDashboard();
    });
}
