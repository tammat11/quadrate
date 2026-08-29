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
    OPU_PASSED_COUNT: 'UF_CRM_127_1756291224885',
    OPU_AVERAGE_SUM: 'UF_CRM_KASJD12',
    MGMT_SCORE: 'UF_CRM_127_MGMT_SCORE',
    // "Адрес объекта инфо" — стабильная ссылка на объект (иблок 115), 100% заполнена в 69,
    // ~88% в 81. Точная привязка замечания к объекту портфеля вместо сравнения по TITLE.
    OBJECT_ADDRESS: 'UF_CRM_1743501476',
    // "Тип отзыва/замечания" (мультиселект) — тяжесть замечания.
    REMARK_TYPE: 'UF_CRM_1716804677915'
};

// Тяжесть по типу замечания (см. UF_CRM_1716804677915 / FIELDS.REMARK_TYPE).
// Разметка подтверждена заказчиком: Критический=4, Высокий=3, Средний=2, Низкий=1, Плановый=0.
// Если у замечания несколько типов сразу — веса суммируются (тоже подтверждено).
const REMARK_TYPE_SEVERITY = {
    '43449': 4, // Отсутствие ОПУ на объекте — Критический
    '43437': 3, // Качество уборки — Высокий
    '43433': 3, // Спец одежда и внешний вид — Высокий
    '43441': 3, // Коммуникация куратор - клиент — Высокий
    '44865': 3, // Коммуникация куратор - ОПУ — Высокий
    '44911': 3, // Коммуникация ОПУ - клиент — Высокий
    '43447': 3, // Несоответствие стандартов качества уборки — Высокий
    '43435': 2, // УМС/РМ (хранение/эксплуатация) — Средний
    '44863': 2, // Прочее — Средний (по умолчанию)
    '43439': 1, // Инвентарь/оборудование (хранение/эксплуатация) — Низкий
    '44867': 0  // Несоответствие плановым работам — Плановый (не штрафует)
};
// Штраф за тяжесть считается в тех же единицах, что штраф за просрочку (0.05/день) —
// см. calculateRemarkPenalty. Один "балл тяжести" = SEVERITY_PENALTY_UNIT.
const SEVERITY_PENALTY_UNIT = 0.05;

const CATEGORY_REALIZATION_COPY = '79';
const FOT_TRIGGER_STAGE_IDS = new Set(['C69:UC_966DTL', 'C79:UC_JK572B']);
const FOT_DB_MONTH_SHIFT = 0;
const FOT_TARGET_CONTRACT_RATIO = 0.6;
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
const CLOCKSTER_PARTNER_TO_USER = {
    '3421309': [566091],
    '2362011': [474121],
    '2362007': [553792],
    '2361995': [558744],
    '3849905': [559053, 562504, 573949], // Жандос Альсейтов + Лейла Басуева + Сембаева Шынар
    '2361999': [558252], // Нургуль Бажкенова в Clockster пока не найдена
    '2362025': [594445],
    '2362021': [559063],
    '2362017': [545732],
    '2361991': [552826],
    '2362005': [553469, 557891], // Жапабаева Б. + Алдыбаева Ажаргуль
    '2362041': [550874],
    '2362015': [550288, 622397], // Кабиева А. + Макканбаева Севара
    '2362019': [549431],
    '2362031': [558295, 638455], // Полоз О. + Амирбекова Гулмира
    '2362003': [565933],
    '2362009': [558807],
    '2362013': [554970, 562762], // Исмагамбетов Марат: брать оба аккаунта
    '2362033': [559610],
    '3144937': [556023],
    '3370865': [578019],
    '2362029': [579840],
    '3960581': [614391],
    '2361989': [558240],
    '2362027': [570178],
    '2361997': [558236]
};
const CLOCKSTER_HOURS_BASED_PARTNERS = new Set(['3370865', '2362023']);
const CLOCKSTER_CHECKS_BASED_PARTNERS = new Set(['2362005']);
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
const CALLS_FIELD_LABELS = {
    UF_CRM_173_1771396927: 'Оцените работу вашего куратора от 1-3',
    UF_CRM_173_1771397355616: 'Все ли вас устраивает в сроках и качестве предостовляемого моющих средств и РМ?',
    UF_CRM_173_1771397383665: 'ОПУ на объекте находятся в форме?',
    UF_CRM_173_1771398284442: 'Соблюдается ли график работы ОПУ?',
    UF_CRM_173_1771398356499: 'Устраивает ли вас качество уборки? оцените от 1-3'
};
const CALLS_DETAIL_FIELD_DEFS = [
    { field: 'ufCrm173_1771396870', label: 'Адрес объекта' },
    { field: 'ufCrm173_1771400136', label: 'Компания', kind: 'company' },
    { field: 'ufCrm173_1771400416684', label: 'Контакт' },
    { field: 'UF_CRM_173_1775114484085', label: 'Дата обзвона', kind: 'date' },
    { field: 'ufCrm173_1771396927', label: CALLS_FIELD_LABELS.UF_CRM_173_1771396927, map: CALLS_SCORE_FIELDS[0].map },
    { field: 'ufCrm173_1771396982', label: 'Комментарий если оценка ниже 3' },
    { field: 'ufCrm173_1771397355616', label: CALLS_FIELD_LABELS.UF_CRM_173_1771397355616, map: CALLS_SCORE_FIELDS[1].map },
    { field: 'ufCrm173_1771397364448', label: 'Комментарий в случае ответа нет' },
    { field: 'ufCrm173_1771397383665', label: CALLS_FIELD_LABELS.UF_CRM_173_1771397383665, map: CALLS_SCORE_FIELDS[2].map },
    { field: 'ufCrm173_1771398284442', label: CALLS_FIELD_LABELS.UF_CRM_173_1771398284442, map: CALLS_SCORE_FIELDS[3].map },
    { field: 'ufCrm173_1771398356499', label: CALLS_FIELD_LABELS.UF_CRM_173_1771398356499, map: CALLS_SCORE_FIELDS[4].map },
    { field: 'ufCrm173_1771398408127', label: 'Комментарий в случае, если оценка ниже 3' },
    { field: 'ufCrm173_1771398445397', label: 'Комментарий по ген.уборкам' },
    { field: 'ufCrm173_1771398469930', label: 'Общий комментарий по объекту' },
    { field: 'ufCrm173_1771398516363', label: 'Обратная связь повторная' }
];

const LIST_PARTNERS_IBLOCK_ID = 117;
const LIST_CALLS_REF_IBLOCK_ID = 115;
const LIST_115_PARTNER_PROP = 'PROPERTY_905';
const ENTITY_CALLS = '1364';
const ENTITY_OPU = '1254';
// SPA "Оценка эффективности объекта" — аудит-чек-лист из 39 критериев (заменяет
// прежнюю заглушку getAuditQ). Единственная категория — 479 "Общая воронка".
const ENTITY_AUDIT_EVAL = '1398';
const CATEGORY_AUDIT_EVAL = 479;
const AUDIT_EVAL_FIELDS = {
    OBJECT: 'ufCrm193Object',
    PARTNER: 'ufCrm193Partner',
    DATE: 'ufCrm193Date'
};
const CATEGORY_CALLS = 431;
const CATEGORY_DISCIPLINE = 439;
const CATEGORY_TRAINING = 311;
const CATEGORY_MANAGEMENT = 441;

// Аудит-чек-лист «Оценка эффективности объекта» — 39 критериев, 12 разделов, 75 баллов
// максимум (см. шаблон «Оценка эффективности 1.xlsx»). В самом шаблоне нет формулы
// перевода текстового ответа в баллы — раскладка ниже подтверждена заказчиком:
//   • kind 'binary'  — да/нет, да = max, нет = 0
//   • kind 'triple'  — 3 уровня, 0 / max/2 / max баллов по direction:
//       'lowGood'  — низкая = max, средняя = max/2, высокая = 0
//       'highGood' — обратный порядок
//       'midGood'  — только для критерия 37: средняя = max, низкая/высокая = 0
//   • kind 'scale5'  — значение шкалы 1..5 совпадает с баллом (макс. 5)
// Значение "н.п." (не применимо) исключается и из числителя, и из знаменателя (заказчик
// подтвердил — уменьшаем базу, а не занижаем оценку).
const AUDIT_CRITERIA = [
    { field: 'ufCrm_193_C01', max: 1, kind: 'binary', answers: { '152975': 1, '152977': 0 } },
    { field: 'ufCrm_193_C02', max: 1, kind: 'binary', answers: { '152979': 1, '152981': 0 } },
    { field: 'ufCrm_193_C03', max: 1, kind: 'binary', answers: { '152983': 1, '152985': 0 } },
    { field: 'ufCrm_193_C04', max: 1, kind: 'binary', answers: { '152987': 1, '152989': 0 } },
    { field: 'ufCrm_193_C05', max: 3, kind: 'triple', direction: 'lowGood', answers: { '152991': 3, '152993': 1.5, '152995': 0 } },
    { field: 'ufCrm_193_C06', max: 1, kind: 'binary', answers: { '152997': 1, '152999': 0 } },
    { field: 'ufCrm_193_C07', max: 3, kind: 'triple', direction: 'lowGood', answers: { '153001': 3, '153003': 1.5, '153005': 0 }, naValues: ['153007'] },
    { field: 'ufCrm_193_C08', max: 3, kind: 'triple', direction: 'lowGood', answers: { '153009': 3, '153011': 1.5, '153013': 0 }, naValues: ['153015'] },
    { field: 'ufCrm_193_C09', max: 1, kind: 'binary', answers: { '153017': 1, '153019': 0 }, naValues: ['153021'] },
    { field: 'ufCrm_193_C10', max: 3, kind: 'triple', direction: 'lowGood', answers: { '153023': 3, '153025': 1.5, '153027': 0 } },
    { field: 'ufCrm_193_C11', max: 1, kind: 'binary', answers: { '153029': 1, '153031': 0 } },
    { field: 'ufCrm_193_C12', max: 1, kind: 'binary', answers: { '153033': 1, '153035': 0 } },
    { field: 'ufCrm_193_C13', max: 1, kind: 'binary', answers: { '153037': 1, '153039': 0 } },
    { field: 'ufCrm_193_C14', max: 1, kind: 'binary', answers: { '153041': 1, '153043': 0 } },
    { field: 'ufCrm_193_C15', max: 3, kind: 'triple', direction: 'highGood', answers: { '153045': 0, '153047': 1.5, '153049': 3 } },
    { field: 'ufCrm_193_C16', max: 1, kind: 'binary', answers: { '153051': 1, '153053': 0 } },
    { field: 'ufCrm_193_C17', max: 1, kind: 'binary', answers: { '153055': 1, '153057': 0 }, naValues: ['153059'] },
    { field: 'ufCrm_193_C18', max: 1, kind: 'binary', answers: { '153061': 1, '153063': 0 }, naValues: ['153065'] },
    { field: 'ufCrm_193_C19', max: 5, kind: 'scale5', answers: { '153067': 1, '153069': 2, '153071': 3, '153073': 4, '153075': 5 } },
    { field: 'ufCrm_193_C20', max: 5, kind: 'scale5', answers: { '153077': 1, '153079': 2, '153081': 3, '153083': 4, '153085': 5 } },
    { field: 'ufCrm_193_C21', max: 5, kind: 'scale5', answers: { '153087': 1, '153089': 2, '153091': 3, '153093': 4, '153095': 5 } },
    { field: 'ufCrm_193_C22', max: 5, kind: 'scale5', answers: { '153097': 1, '153099': 2, '153101': 3, '153103': 4, '153105': 5 } },
    { field: 'ufCrm_193_C23', max: 5, kind: 'scale5', answers: { '153107': 1, '153109': 2, '153111': 3, '153113': 4, '153115': 5 } },
    { field: 'ufCrm_193_C24', max: 3, kind: 'triple', direction: 'highGood', answers: { '153117': 0, '153119': 1.5, '153121': 3 } },
    { field: 'ufCrm_193_C25', max: 1, kind: 'binary', answers: { '153123': 1, '153125': 0 } },
    { field: 'ufCrm_193_C26', max: 1, kind: 'binary', answers: { '153127': 1, '153129': 0 }, naValues: ['153131'] },
    { field: 'ufCrm_193_C27', max: 1, kind: 'binary', answers: { '153133': 1, '153135': 0 }, naValues: ['153137'] },
    { field: 'ufCrm_193_C28', max: 1, kind: 'binary', answers: { '153139': 1, '153141': 0 }, naValues: ['153143'] },
    { field: 'ufCrm_193_C29', max: 1, kind: 'binary', answers: { '153145': 1, '153147': 0 } },
    { field: 'ufCrm_193_C30', max: 1, kind: 'binary', answers: { '153149': 1, '153151': 0 } },
    { field: 'ufCrm_193_C31', max: 1, kind: 'binary', answers: { '153153': 1, '153155': 0 } },
    { field: 'ufCrm_193_C32', max: 1, kind: 'binary', answers: { '153157': 1, '153159': 0 } },
    { field: 'ufCrm_193_C33', max: 1, kind: 'binary', answers: { '153161': 1, '153163': 0 } },
    { field: 'ufCrm_193_C34', max: 1, kind: 'binary', answers: { '153165': 1, '153167': 0 } },
    { field: 'ufCrm_193_C35', max: 1, kind: 'binary', answers: { '153169': 1, '153171': 0 } },
    { field: 'ufCrm_193_C36', max: 1, kind: 'binary', answers: { '153173': 1, '153175': 0 } },
    // №37 «Рабочая нагрузка оператора» — единственный критерий с пиком по центру
    // (подтверждено заказчиком): средняя нагрузка лучше всего, оба края — 0.
    { field: 'ufCrm_193_C37', max: 3, kind: 'triple', direction: 'midGood', answers: { '153177': 0, '153179': 3, '153181': 0 } },
    { field: 'ufCrm_193_C38', max: 1, kind: 'binary', answers: { '153183': 1, '153185': 0 } },
    { field: 'ufCrm_193_C39', max: 3, kind: 'triple', direction: 'highGood', answers: { '153187': 0, '153189': 1.5, '153191': 3 }, naValues: ['153193'] }
];
const AUDIT_CRITERIA_MAX_TOTAL = AUDIT_CRITERIA.reduce((sum, c) => sum + c.max, 0); // 75

// Считает % эффективности одного аудита (SPA 1398) по 39 критериям. Критерии без ответа
// или отмеченные "н.п." исключаются из знаменателя (не искажают итог). Возвращает null,
// если ни один критерий не отвечен (пустой черновик) — такую запись не учитываем вообще.
function computeAuditItemScore(item) {
    let achieved = 0;
    let maxApplicable = 0;
    let answeredCount = 0;

    for (const criterion of AUDIT_CRITERIA) {
        const rawValue = getFieldValue(item, criterion.field);
        if (rawValue == null || rawValue === '') continue;
        const key = String(Array.isArray(rawValue) ? rawValue[0] : rawValue).trim();
        if (criterion.naValues && criterion.naValues.includes(key)) continue; // "н.п." — исключить

        const points = criterion.answers[key];
        if (!Number.isFinite(points)) continue; // неизвестное/нераспознанное значение — пропускаем

        achieved += points;
        maxApplicable += criterion.max;
        answeredCount += 1;
    }

    if (answeredCount === 0) return null;
    return { achieved, maxApplicable, answeredCount, efficiency: maxApplicable > 0 ? achieved / maxApplicable : 0 };
}
const REPORTING_MONTH_START = '2026-03';
const REPORTING_MONTH_END = '2027-03';
const SUMMARY_FILTER_VALUE = 'summary';
const AUDIT_REMARK_SOURCE_IDS = new Set(['43609']);
const AUDIT_REMARK_SOURCE_LABELS = new Set(['от аудитора замечание', 'от аудитора замечания']);
const NEGATIVE_REMARK_SOURCE_IDS = new Set(['43609', '43607', '43735', '43709', '151243']);
const NEGATIVE_REMARK_LABEL_PARTS = ['замечание'];
const POSITIVE_REMARK_SOURCE_IDS = new Set(['43713', '43711', '43715']);
const POSITIVE_REMARK_SOURCE_LABEL_PARTS = ['положительный отзыв'];

// Матрица «Квадрат мечты» (март 2026 — март 2027). Веса/влияние — из
// «Матрица оценки партнера.docx». Показатели без реального источника данных
// (rounds/training/budget) временно считаются через Q=1.0-заглушку — см.
// соответствующие get*Q функции ниже. Аудит (audit) уже реальный — SPA 1398.
const MATRIX = {
    operations: [
        { key: 'clockster', influence: 3, weight: 4 },  // Регистрация/отметка, макс 12
        { key: 'rounds', influence: 3, weight: 2 },      // Объезды партнёров и кураторов, макс 6
        { key: 'training', influence: 2, weight: 6 },    // Обучение операторов, макс 12
    ],
    finance: [
        { key: 'budget', influence: 3, weight: 7 },      // Бюджетная дисциплина, макс 21
        { key: 'ums', influence: 3, weight: 3 },         // % УМС от дохода клиента, макс 9
    ],
    relations: [
        { key: 'calls', influence: 2, weight: 5 },       // Обзвон клиентов (CSAT), макс 10
        { key: 'audit', influence: 2, weight: 5 },       // Аудит качества, макс 10
        { key: 'remarks', influence: 3, weight: 8 },     // Замечания, макс 24
        { key: 'cleanShare', influence: 2, weight: 4 },  // Доля объектов без замечаний, макс 8
    ]
};
const POSITIVE_REVIEW_BONUS_MAX = 5;
const UMS_TARGET_PERCENT = 0.08;
const UMS_TOLERANCE_PERCENT = 0.10;

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

// Основной город партнёра — для правила лиги «город=Алматы → не ниже Изумруда»
// (Вариант 1 из «Классификация партнера.xlsx»). Партнёры вне списка — city=null,
// правило просто не срабатывает, но остальной расчёт лиги не ломается.
const PARTNER_CITY_SOURCE = [
    { city: 'Атырау', aliases: ['Ли А.'] },
    { city: 'Усть-Каменогорск', aliases: ['Айткулова А.', 'Айжан Алматы Айткулова'] },
    { city: 'Алматы', aliases: ['Оспанова Г', 'Гульмира Оспанова'] },
    { city: 'Астана', aliases: ['Бут Р.', 'Римма Бут'] },
    { city: 'Павлодар', aliases: ['Жапабаева Б.'] },
    { city: 'Караганда', aliases: ['Жандос Альсейтов'] },
    { city: 'Шымкент', aliases: ['Токенова С.', 'Сара Токенова', 'Токенова Сара'] },
    { city: 'Алматы', aliases: ['Роза Ерасылова', 'Роза Алматы Ерасылова'] },
    { city: 'Алматы', aliases: ['Болатбек А.', 'Абдуахат Болатбек'] },
    { city: 'Алматы', aliases: ['Калиаскар Б.', 'Бакытгул Калиаскар'] },
    { city: 'Алматы', aliases: ['Илиясов Р.', 'Рашид Илиясов'] },
    { city: 'Алматы', aliases: ['Рузиева Зоя', 'Зоя Рузиева'] },
    { city: 'Алматы', aliases: ['Нысанбеков Е.', 'Ербол Алматы Нысанбеков'] },
    { city: 'Астана', aliases: ['Полоз О.', 'Ольга Астана Полоз'] },
    { city: 'Алматы', aliases: ['Мусаева Р.', 'Рабинур Алматы Мусаева'] },
    { city: 'Алматы', aliases: ['Назарова М.', 'Мукарям Назарова'] },
    { city: 'Алматы', aliases: ['Куатова М.', 'Мухаббат Алматы Куатова'] },
    { city: 'Алматы', aliases: ['Аубакирова А.', 'Ания Аубакирова'] },
    { city: 'Актобе', aliases: ['Айтуганова Ю.', 'Юлия Айтуганова'] },
    { city: 'Тараз', aliases: ['Кан Т.', 'Татьяна Кан'] },
    { city: 'Кокшетау', aliases: ['Исмагамбетов М', 'Марат Исмагамбетов'] },
    { city: 'Кызылорда', aliases: ['Черней Т.', 'Татьяна Черней'] },
    { city: 'Талдыкорган', aliases: ['Омельченко С.'] },
    { city: 'Туркестан', aliases: ['Кабиева А.', 'Айгерим Кабиева'] }
];

const CACHE_KEY = 'dashboardCacheV5';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

// ——— Глобальное состояние ———
let deals69 = [];
let deals79 = [];
let remarkDeals = [];
let callsItems = [];
let disciplineItems = [];
let opuItems = [];
let managementItems = [];
let auditEvalItems = [];
let fotDbItems = [];
let managementRowsByPartner = {};
let managementSummaryByPartner = {};
let managementPartnerLookup = {};
let partnersData = {};
let matrixRows = [];
let partnerMap = {};
let companyMap = {};
let list115PartnerByElementId = {};
let accountCoefficientRows = [];
let accountCoefficientLookup = {};
let callsByPartner = {};   // индекс: partnerId -> [items]
let opuByPartner = {};     // индекс: partnerId -> [items]
let auditEvalByPartner = {}; // индекс: partnerId -> [{achieved, maxApplicable, answeredCount, efficiency}]
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
let bitrixPortalBase = '';
let leagueAggregates = { rows: [], totals: {}, partnerCount: 0 };
let fotDbStatsByPartnerMonth = {};
let fotDbPartnerLookup = {};
let fotContractsByPartnerMonth = {};
let selectedExamplePartnerId = '';
let expandedMatrixGroups = {
    relations: false,
    finance: false,
    operations: false
};
let lastRenderedTimestamp = 0;
let sharedCacheSyncTimer = null;

const MATRIX_GROUP_CONFIG = [
    {
        id: 'operations',
        label: 'Операционка',
        scoreField: 'operationsScore',
        sub: '3 крит. · 30',
        items: [
            { key: 'clockster', label: 'Регистрация/отметка' },
            { key: 'rounds', label: 'Объезды' },
            { key: 'training', label: 'Обучение' }
        ]
    },
    {
        id: 'finance',
        label: 'Финансы',
        scoreField: 'financeScore',
        sub: '2 крит. · 30',
        items: [
            { key: 'budget', label: 'Бюджетная дисциплина' },
            { key: 'ums', label: '% УМС' }
        ]
    },
    {
        id: 'relations',
        label: 'Отношения',
        scoreField: 'relationsScore',
        sub: '4 крит. · 52',
        items: [
            { key: 'calls', label: 'Обзвон (CSAT)' },
            { key: 'audit', label: 'Аудит' },
            { key: 'remarks', label: 'Замечания' },
            { key: 'cleanShare', label: 'Без замечаний' }
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

function getReportingMonthLimit(referenceDate = new Date()) {
    const baseDate = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
        ? referenceDate
        : new Date();
    const currentMonthKey = formatMonthKey(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    if (compareMonthKeys(currentMonthKey, REPORTING_MONTH_START) < 0) return REPORTING_MONTH_START;
    if (compareMonthKeys(currentMonthKey, REPORTING_MONTH_END) > 0) return REPORTING_MONTH_END;
    return currentMonthKey;
}

function getAllowedReportingMonths(referenceDate = new Date()) {
    const months = [];
    const [startYear, startMonth] = REPORTING_MONTH_START.split('-').map(Number);
    const reportingLimit = getReportingMonthLimit(referenceDate);
    const [endYear, endMonth] = reportingLimit.split('-').map(Number);
    const cursor = new Date(startYear, startMonth - 1, 1);
    const limit = new Date(endYear, endMonth - 1, 1);

    while (cursor <= limit) {
        months.push(formatMonthKey(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
}

function normalizeSelectedMonth(monthKey, referenceDate = new Date()) {
    if (monthKey === 'all' || monthKey === SUMMARY_FILTER_VALUE) return SUMMARY_FILTER_VALUE;
    if (isMonthInReportingRange(monthKey) && getAllowedReportingMonths(referenceDate).includes(monthKey)) return monthKey;
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

const RU_MONTH_INDEX = {
    январь: 1,
    января: 1,
    февраль: 2,
    февраля: 2,
    март: 3,
    марта: 3,
    апрель: 4,
    апреля: 4,
    май: 5,
    мая: 5,
    июнь: 6,
    июня: 6,
    июль: 7,
    июля: 7,
    август: 8,
    августа: 8,
    сентябрь: 9,
    сентября: 9,
    октябрь: 10,
    октября: 10,
    ноябрь: 11,
    ноября: 11,
    декабрь: 12,
    декабря: 12
};

function normalizeMonthKeyValue(value) {
    const raw = normalizeScalar(value);
    if (raw == null || raw === '') return '';
    const text = String(raw).trim();

    const directMonth = text.match(/^(\d{4})-(\d{2})/);
    if (directMonth) return `${directMonth[1]}-${directMonth[2]}`;

    const ruMatch = text.toLowerCase().match(/([а-яё]+)\s+(\d{4})/u);
    if (ruMatch) {
        const monthNumber = RU_MONTH_INDEX[ruMatch[1].replace(/ё/g, 'е')];
        if (monthNumber) return `${ruMatch[2]}-${String(monthNumber).padStart(2, '0')}`;
    }

    const date = new Date(text);
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
    const monthKeyFromAccrual = normalizeMonthKeyValue(getFieldValue(deal, FIELDS.MONTH_ACCRUAL));
    if (monthKeyFromAccrual) return monthKeyFromAccrual;

    for (const fieldName of fallbackFields) {
        const monthKey = normalizeMonthKeyValue(getFieldValue(deal, fieldName));
        if (monthKey) return monthKey;
    }

    return '';
}

function extractCallsMonthKey(item) {
    const raw = normalizeScalar(getFieldValue(item, FIELDS.CALLS_DATE));
    if (!raw) return '';
    const monthKey = formatMonthKey(new Date(raw));
    if (monthKey) return monthKey;
    const text = String(raw).trim();
    const directMonth = text.match(/^(\d{4})-(\d{2})/);
    return directMonth ? `${directMonth[1]}-${directMonth[2]}` : '';
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
const SELECT_DEALS = ['ID', 'CATEGORY_ID', 'STAGE_ID', 'COMPANY_ID', 'CONTACT_ID', 'UF_CRM_ACTIVE_ADDRESS', FIELDS.PARTNER, 'ASSIGNED_BY_ID', 'MOVED_TIME', 'CLOSEDATE', 'DATE_CREATE', 'OPPORTUNITY', FIELDS.AREA, FIELDS.MONTH_ACCRUAL, FIELDS.OBJECT_ADDRESS];
const SELECT_REMARKS = ['ID', 'TITLE', FIELDS.PARTNER, 'ASSIGNED_BY_ID', 'DATE_CREATE', FIELDS.REMARK_DATE, FIELDS.FEEDBACK_DATE, FIELDS.REMARK_SOURCE, FIELDS.OBJECT_ADDRESS, FIELDS.REMARK_TYPE];

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

// Тяжесть замечания по полю "Тип отзыва/замечания" (мультиселект) — сумма весов всех
// отмеченных типов (подтверждено заказчиком). Если поле совсем пустое — 0 (штрафуем только
// за просрочку, как раньше, не выдумываем тяжесть там, где её не проставили).
function getRemarkSeverityWeight(typeValue) {
    const rawList = Array.isArray(typeValue) ? typeValue : (typeValue == null || typeValue === '' ? [] : [typeValue]);
    if (rawList.length === 0) return 0;
    return rawList.reduce((sum, id) => {
        const key = String(id).trim();
        const weight = REMARK_TYPE_SEVERITY[key];
        return sum + (Number.isFinite(weight) ? weight : REMARK_TYPE_SEVERITY['44863']); // неизвестный тип → как "Прочее"
    }, 0);
}

function buildRemarkMetrics(selectedMonth) {
    const metrics = {};

    function ensurePartner(pid) {
        if (!metrics[pid]) {
            metrics[pid] = {
                rowCount: 0,
                scoredCount: 0,
                skippedMissingRemarkDate: 0,
                skippedMissingFeedbackDate: 0,
                auditDealsCount: 0,
                totalLateDays: 0,
                totalPenalty: 0,
                positiveCount: 0,
                negativeCount: 0,
                objectsWithNegativeRemark: new Set(),
                items: []
            };
        }
        return metrics[pid];
    }

    for (const deal of remarkDeals) {
        const reportMonth = getRemarkReportMonth(deal);
        if (!doesMonthMatchSelection(reportMonth, selectedMonth)) continue;

        const pid = normalizePartnerId(deal);
        if (pid === '__no_partner__') continue;

        const sourceValue = getFieldValue(deal, FIELDS.REMARK_SOURCE);

        // Положительные отзывы не штрафуют, но нужны для бонуса «Голос клиента».
        if (isPositiveRemarkSource(sourceValue)) {
            ensurePartner(pid).positiveCount += 1;
            continue;
        }
        if (!isNegativeRemarkSource(sourceValue)) continue;

        const m = ensurePartner(pid);
        const remarkDate = normalizeScalar(getFieldValue(deal, FIELDS.REMARK_DATE));
        const feedbackDate = normalizeScalar(getFieldValue(deal, FIELDS.FEEDBACK_DATE));
        const lateDays = calculateRemarkLateDays(remarkDate, feedbackDate);
        const latePenalty = lateDays == null ? 0 : lateDays * 0.05;
        const severityWeight = getRemarkSeverityWeight(getFieldValue(deal, FIELDS.REMARK_TYPE));
        const penalty = latePenalty + severityWeight * SEVERITY_PENALTY_UNIT;
        // Ключ объекта — "Адрес объекта инфо" (UF_CRM_1743501476), а не TITLE: та же ссылка,
        // что и на объекте в воронке 69, только так cleanShare сможет сверить "грязные"
        // объекты с реальным активным портфелем партнёра (см. processData).
        const objectAddressKey = normalizeScalar(getFieldValue(deal, FIELDS.OBJECT_ADDRESS));

        m.rowCount += 1;
        m.negativeCount += 1;
        if (objectAddressKey) m.objectsWithNegativeRemark.add(objectAddressKey);
        if (isAuditRemarkSource(sourceValue)) {
            m.auditDealsCount += 1;
        }
        if (!remarkDate) {
            m.skippedMissingRemarkDate += 1;
        } else if (!feedbackDate) {
            m.skippedMissingFeedbackDate += 1;
        } else if (lateDays == null) {
            m.skippedMissingRemarkDate += 1;
        } else {
            m.scoredCount += 1;
            m.totalLateDays += lateDays;
            m.totalPenalty += penalty;
        }

        m.items.push({
            id: getFieldValue(deal, 'ID') ?? deal?.id,
            title: normalizeScalar(getFieldValue(deal, 'TITLE')) || '',
            objectAddressKey,
            remarkDate,
            feedbackDate,
            lateDays,
            severityWeight,
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

function buildAuditItems(pid, selectedMonth) {
    const items = [];

    for (const deal of remarkDeals) {
        if (!isAuditRemarkSource(getFieldValue(deal, FIELDS.REMARK_SOURCE))) continue;

        const reportMonth = getAuditReportMonth(deal);
        if (!doesMonthMatchSelection(reportMonth, selectedMonth)) continue;
        if (normalizePartnerId(deal) !== pid) continue;

        const id = String(getFieldValue(deal, 'ID') ?? deal?.ID ?? '').trim();
        items.push({
            id,
            label: normalizeScalar(getFieldValue(deal, 'TITLE')) || 'Аудит',
            url: buildBitrixDealUrl(id),
            remarkDate: normalizeScalar(getFieldValue(deal, FIELDS.REMARK_DATE)) || normalizeScalar(getFieldValue(deal, 'DATE_CREATE')) || '',
            feedbackDate: normalizeScalar(getFieldValue(deal, FIELDS.FEEDBACK_DATE)) || '',
            lateDays: null,
            penalty: 0,
            status: 'Аудит'
        });
    }

    return items;
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

async function fetchManagementReport(monthKey = getSelectedMonth()) {
    const params = new URLSearchParams();
    if (monthKey) params.set('month', monthKey);
    const response = await fetch(`/api/management-report?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Management report HTTP ${response.status}`);
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

function usesChecksBasedClockster(pid) {
    return CLOCKSTER_CHECKS_BASED_PARTNERS.has(String(pid));
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
    const labelMonthKey = normalizeMonthKeyValue(item?.period_label);
    if (labelMonthKey) return labelMonthKey;

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

function getManagementMonthForSelection(selectedMonth = getSelectedMonth()) {
    if (selectedMonth === 'all') return 'all';
    if (isSummaryFilter(selectedMonth)) return selectedMonth;
    return shiftMonthKey(selectedMonth, -1) || selectedMonth;
}

function buildFotDbIndexes() {
    fotDbStatsByPartnerMonth = {};

    for (const item of fotDbItems) {
        const dbPartnerId = String(item?.partner_id ?? '').trim();
        const partnerName = String(item?.partner_name ?? '').trim();
        const monthKey = getFotDbMonthKeyFromRow(item);
        if (!dbPartnerId || !monthKey) continue;

        if (!fotDbStatsByPartnerMonth[dbPartnerId]) fotDbStatsByPartnerMonth[dbPartnerId] = {};
        if (!fotDbStatsByPartnerMonth[dbPartnerId][monthKey]) {
            fotDbStatsByPartnerMonth[dbPartnerId][monthKey] = {
                partnerName,
                paymentsCount: 0,
                totalAmount: 0
            };
        }

        const stats = fotDbStatsByPartnerMonth[dbPartnerId][monthKey];
        stats.paymentsCount += Number(item?.payments_count) || 0;
        stats.totalAmount += parseFloat(item?.total_amount) || 0;
        if (!stats.partnerName && partnerName) stats.partnerName = partnerName;
    }
}

function buildFotContractIndexes() {
    fotContractsByPartnerMonth = {};

    for (const deal of deals69) {
        const pid = normalizePartnerId(deal);
        if (!pid || pid === '__no_partner__' || pid === 'undefined') continue;

        const monthKey = normalizeMonthKeyValue(getFieldValue(deal, FIELDS.MONTH_ACCRUAL));
        if (!isMonthInReportingRange(monthKey)) continue;

        const amount = Number(getFieldValue(deal, 'OPPORTUNITY')) || 0;
        if (amount <= 0) continue;

        if (!fotContractsByPartnerMonth[pid]) fotContractsByPartnerMonth[pid] = {};
        if (!fotContractsByPartnerMonth[pid][monthKey]) {
            fotContractsByPartnerMonth[pid][monthKey] = {
                contractAmount: 0,
                dealsCount: 0
            };
        }

        const stats = fotContractsByPartnerMonth[pid][monthKey];
        stats.contractAmount += amount;
        stats.dealsCount += 1;
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
    const mapping = fotDbPartnerLookup[String(pid)];
    const monthKeys = getFotDbMonthsForSelection();
    const contractsByMonth = fotContractsByPartnerMonth[String(pid)] || {};
    let contractAmount = 0;
    let contractDealsCount = 0;
    for (const monthKey of monthKeys) {
        const stats = contractsByMonth[monthKey];
        if (!stats) continue;
        contractAmount += Number(stats.contractAmount) || 0;
        contractDealsCount += Number(stats.dealsCount) || 0;
    }

    if (!mapping) {
        return {
            contractAmount,
            contractDealsCount,
            targetAmount: contractAmount * FOT_TARGET_CONTRACT_RATIO,
            paymentsCount: 0,
            totalAmount: 0,
            monthKeys,
            hasMapping: false
        };
    }

    const byMonth = fotDbStatsByPartnerMonth[String(mapping.dbPartnerId)] || {};
    let paymentsCount = 0;
    let totalAmount = 0;

    for (const monthKey of monthKeys) {
        const stats = byMonth[monthKey];
        if (!stats) continue;
        paymentsCount += Number(stats.paymentsCount) || 0;
        totalAmount += Number(stats.totalAmount) || 0;
    }

    return {
        contractAmount,
        contractDealsCount,
        targetAmount: contractAmount * FOT_TARGET_CONTRACT_RATIO,
        paymentsCount,
        totalAmount,
        monthKeys,
        hasMapping: true,
        dbPartnerId: String(mapping.dbPartnerId),
        dbPartnerName: mapping.dbPartnerName || ''
    };
}

async function fetchClocksterAttendanceReport(monthKey) {
    const userIds = [...new Set(
        Object.values(CLOCKSTER_PARTNER_TO_USER)
            .flatMap(value => Array.isArray(value) ? value : [value])
            .map(value => String(value).trim())
            .filter(Boolean)
    )];
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
                    uniqueObjectsSet: new Set(),
                    locationKeysSet: new Set()
                };
            }

            merged[partnerId].visits += Number(metric.visits) || 0;
            merged[partnerId].hours += Number(metric.hours) || 0;

            const objectIds = Array.isArray(metric.objectIds) ? metric.objectIds : [];
            for (const objectId of objectIds) {
                merged[partnerId].uniqueObjectsSet.add(String(objectId));
            }

            const locationKeys = Array.isArray(metric.locationKeys) ? metric.locationKeys : [];
            for (const locationKey of locationKeys) {
                merged[partnerId].locationKeysSet.add(String(locationKey));
            }
        }
    }

    const normalized = {};
    for (const [partnerId, metric] of Object.entries(merged)) {
        normalized[partnerId] = {
            visits: metric.visits,
            hours: metric.hours,
            uniqueObjects: metric.uniqueObjectsSet.size,
            objectIds: [...metric.uniqueObjectsSet],
            locationKeys: [...metric.locationKeysSet]
        };
    }

    return normalized;
}

function normalizeClocksterLocationKey(value) {
    return String(normalizeScalar(value) ?? '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^a-z0-9а-я]+/gi, '');
}

function buildClocksterMetrics(reportRows) {
    const userIdToPartnerIds = {};
    for (const [partnerId, rawUserIds] of Object.entries(CLOCKSTER_PARTNER_TO_USER)) {
        const userIds = Array.isArray(rawUserIds) ? rawUserIds : [rawUserIds];
        for (const userId of userIds) {
            const key = String(userId).trim();
            if (!key) continue;
            if (!userIdToPartnerIds[key]) userIdToPartnerIds[key] = [];
            userIdToPartnerIds[key].push(String(partnerId));
        }
    }
    const metrics = {};

    for (const row of reportRows) {
        const clocksterUserId = String(row?.user?.id ?? '');
        const partnerIds = userIdToPartnerIds[clocksterUserId];
        if (!partnerIds?.length) continue;

        let uniqueObjectVisits = 0;
        let totalChecks = 0;
        let spentHours = 0;
        const uniqueCoveredObjects = new Set();
        const visitedLocationKeys = new Set();
        const dates = row?.dates || {};

        for (const [dateKey, dateData] of Object.entries(dates)) {
            const attendance = Array.isArray(dateData?.attendance) ? dateData.attendance.slice() : [];
            if (attendance.length === 0) continue;
            totalChecks += attendance.length;

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
                const firstEvent = events.find(Boolean) || null;
                const locationId = firstEvent?.location?.id ?? '';
                const locationTitle = firstEvent?.location?.title ?? '';
                if (locationId) visitedLocationKeys.add(normalizeClocksterLocationKey(locationId));
                if (locationTitle) visitedLocationKeys.add(normalizeClocksterLocationKey(locationTitle));

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

        for (const partnerId of partnerIds) {
            if (!metrics[partnerId]) {
                metrics[partnerId] = {
                    visits: 0,
                    checks: 0,
                    hours: 0,
                    uniqueObjectsSet: new Set(),
                    locationKeysSet: new Set()
                };
            }
            metrics[partnerId].visits += uniqueObjectVisits;
            metrics[partnerId].checks += totalChecks;
            metrics[partnerId].hours += spentHours;
            for (const objectId of uniqueCoveredObjects) metrics[partnerId].uniqueObjectsSet.add(objectId);
            for (const locationKey of visitedLocationKeys) metrics[partnerId].locationKeysSet.add(locationKey);
        }
    }

    for (const [partnerId, metric] of Object.entries(metrics)) {
        metrics[partnerId] = {
            visits: metric.visits,
            checks: metric.checks,
            hours: metric.hours,
            uniqueObjects: metric.uniqueObjectsSet.size,
            objectIds: [...metric.uniqueObjectsSet],
            locationKeys: [...metric.locationKeysSet]
        };
    }

    return metrics;
}

function getDealClocksterObjectLabels(deal) {
    const display = getClocksterObjectDisplay(deal);
    const labels = [display.label];
    if (display.sublabel) labels.push(display.sublabel);
    return labels;
}

function getDealClocksterMatchKeys(deal) {
    const title = normalizeScalar(getFieldValue(deal, 'TITLE'));
    const address = normalizeScalar(getFieldValue(deal, 'UF_CRM_ACTIVE_ADDRESS'));
    const companyId = normalizeScalar(getFieldValue(deal, 'COMPANY_ID'));
    const companyTitle = companyId ? String(companyMap[String(companyId)] || '').trim() : '';
    const id = String(getFieldValue(deal, 'ID') ?? deal?.ID ?? '').trim();

    return [
        address,
        title && !isGenericClocksterTitle(title) ? title : '',
        companyTitle && !isGenericClocksterTitle(companyTitle) ? companyTitle : '',
        id
    ].filter(Boolean);
}

function isGenericClocksterTitle(value) {
    const text = String(normalizeScalar(value) ?? '').trim();
    if (!text) return true;
    if (/^bitrix\s*#?\s*\d+$/i.test(text)) return true;
    if (/^объект\s*\d+$/i.test(text)) return true;
    if (/^\d+$/.test(text)) return true;
    return false;
}

function getCallsItemTitle(item) {
    const title = normalizeScalar(getFieldValue(item, 'TITLE'));
    const subject = normalizeScalar(getFieldValue(item, 'SUBJECT'));
    const name = normalizeScalar(getFieldValue(item, 'NAME'));
    const id = String(getFieldValue(item, 'ID') ?? item?.ID ?? '').trim();
    return String(title || subject || name || (id ? `Обзвон ${id}` : 'Обзвон')).trim();
}

function getCallsAnswerDisplayValue(rawValue, scoreMap = null) {
    const value = normalizeScalar(rawValue);
    if (value == null || value === '') return 'не заполнено';
    if (Array.isArray(value)) {
        return value
            .map(entry => getCallsAnswerDisplayValue(entry, scoreMap))
            .filter(Boolean)
            .join(', ') || 'не заполнено';
    }
    const text = String(value).trim();
    if (text === '0') return 'нет ответа';
    if (scoreMap && Object.hasOwn(scoreMap, text)) {
        const mapped = scoreMap[text];
        return Number(mapped) === 0 ? 'нет ответа' : String(mapped);
    }
    return text;
}

function formatDashboardDate(value) {
    if (!value) return 'не заполнено';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function getCallsDetailDisplayValue(item, def) {
    const rawValue = getFieldValue(item, def.field);
    const value = normalizeScalar(rawValue);
    if (def.kind === 'date') return formatDashboardDate(value);
    if (def.kind === 'company') {
        const valueText = value == null ? '' : String(value).trim();
        const fallbackCompanyId = String(item?.companyId ?? item?.companyID ?? '').trim();
        const companyId = valueText && valueText !== 'undefined' ? valueText : fallbackCompanyId;
        return companyMap[companyId] || companyMap[fallbackCompanyId] || 'не заполнено';
    }
    if (def.kind === 'enum') {
        const values = Array.isArray(value) ? value : [value];
        const mapped = values
            .map(entry => def.enumMap?.[String(entry).trim()] || String(entry).trim())
            .filter(Boolean);
        return mapped.length ? mapped.join(', ') : 'не заполнено';
    }
    if (def.kind === 'url') return String(value).trim();
    if (value == null || value === '') return 'не заполнено';
    if (def.map) return getCallsAnswerDisplayValue(value, def.map);
    if (Array.isArray(value)) return value.map(entry => String(entry).trim()).filter(Boolean).join(', ') || 'не заполнено';
    return String(value).trim() || 'не заполнено';
}

function getClocksterObjectDisplay(deal) {
    const title = normalizeScalar(getFieldValue(deal, 'TITLE'));
    const address = normalizeScalar(getFieldValue(deal, 'UF_CRM_ACTIVE_ADDRESS'));
    const companyId = normalizeScalar(getFieldValue(deal, 'COMPANY_ID'));
    const companyTitle = companyId ? String(companyMap[String(companyId)] || '').trim() : '';
    const fallbackId = String(getFieldValue(deal, 'ID') ?? deal?.ID ?? '').trim();

    if (title && !isGenericClocksterTitle(title)) {
        return {
            label: String(title),
            sublabel: [address, companyTitle].find(value => value && value !== title) || ''
        };
    }

    if (address) {
        return {
            label: String(address),
            sublabel: [title, companyTitle].find(value => value && value !== address) || ''
        };
    }

    if (companyTitle) {
        return {
            label: companyTitle,
            sublabel: title && title !== companyTitle ? String(title) : ''
        };
    }

    if (title) {
        return { label: String(title), sublabel: '' };
    }

    return { label: fallbackId ? `Объект ${fallbackId}` : 'Объект', sublabel: '' };
}

function getCallsItemDate(item) {
    return normalizeScalar(getFieldValue(item, FIELDS.CALLS_DATE))
        || normalizeScalar(getFieldValue(item, 'DATE_CREATE'))
        || normalizeScalar(getFieldValue(item, 'CREATED_TIME'))
        || '';
}

function describeCallsItem(item) {
    const fields = CALLS_DETAIL_FIELD_DEFS.map(def => {
        const displayValue = getCallsDetailDisplayValue(item, def);
        return {
            field: def.field,
            label: def.label,
            displayValue,
            kind: def.kind || '',
            url: def.kind === 'url' ? displayValue : ''
        };
    }).filter(field => field.displayValue && field.displayValue !== 'не заполнено');

    const answers = CALLS_SCORE_FIELDS.map(config => {
        const rawValue = getFieldValue(item, config.field);
        const score = scoreCallsFieldValue(rawValue, config.map);
        return {
            label: CALLS_FIELD_LABELS[config.field] || config.field,
            value: normalizeScalar(rawValue),
            score,
            displayValue: getCallsAnswerDisplayValue(rawValue, config.map)
        };
    }).filter(answer => answer.value != null && answer.value !== '');
    const scoredAnswers = answers.filter(answer => Number.isFinite(answer.score));
    const totalScore = scoredAnswers.reduce((sum, answer) => sum + (Number(answer.score) || 0), 0);
    const maxScore = scoredAnswers.length * 3;
    const answerCount = scoredAnswers.length;
    const id = String(getFieldValue(item, 'ID') ?? item?.ID ?? '').trim();
    return {
        id,
        label: getCallsItemTitle(item),
        date: getCallsItemDate(item),
        url: buildBitrixItemUrl(ENTITY_CALLS, id),
        answerCount,
        totalScore,
        maxScore,
        q: maxScore > 0 ? totalScore / maxScore : null,
        answers,
        fields
    };
}

function buildClocksterMissedObjects(pid, rowData = null) {
    const selectedMonth = getSelectedMonth();
    const metric = clocksterMetricsByPartner[String(pid)] || null;
    const visitedKeys = new Set(
        (metric?.locationKeys || metric?.objectIds || [])
            .map(value => normalizeClocksterLocationKey(value))
            .filter(Boolean)
    );
    const missed = [];

    for (const deal of deals69) {
        if (normalizePartnerId(deal) !== pid) continue;
        const dealMonth = extractDealMonthKey(deal, [FIELDS.MONTH_ACCRUAL, 'DATE_CREATE', 'CLOSEDATE', 'MOVED_TIME']);
        if (!doesMonthMatchSelection(dealMonth, selectedMonth)) continue;

        const display = getClocksterObjectDisplay(deal);
        const normalizedLabels = getDealClocksterMatchKeys(deal).map(normalizeClocksterLocationKey).filter(Boolean);
        const matched = normalizedLabels.some(label => visitedKeys.has(label));
        if (matched) continue;
        missed.push({
            id: String(getFieldValue(deal, 'ID') ?? deal?.ID ?? ''),
            label: display.label,
            sublabel: display.sublabel,
            url: buildBitrixDealUrl(getFieldValue(deal, 'ID') ?? deal?.ID ?? ''),
            status: 'Не был посещён'
        });
    }

    missed.sort((a, b) => String(a.label).localeCompare(String(b.label), 'ru'));
    return missed;
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

function getManagementMonthKey(item) {
    // __month_key is generated by the API from Marja_full.`Месяц_начисления`.
    const raw = getFieldValue(item, '__month_key')
        || getFieldValue(item, 'Месяц_начисления');
    if (raw instanceof Date) return formatMonthKey(raw);
    return normalizeMonthKeyValue(raw);
}

function buildManagementPartnerLookup() {
    managementPartnerLookup = {};
    for (const [pid, name] of Object.entries(partnerMap || {})) {
        const normalized = normalizeComparableName(name);
        if (!normalized) continue;
        if (!managementPartnerLookup[normalized]) {
            managementPartnerLookup[normalized] = String(pid);
        }
    }
}

function getManagementPartnerId(item) {
    const pgDirect = normalizePartnerRef(getFieldValue(item, '_partner_bitrix_id'));
    if (pgDirect) return pgDirect;
    const direct = normalizePartnerRef(getFieldValue(item, FIELDS.OPU_PARTNER));
    if (direct) return direct;

    const candidateNames = [
        getFieldValue(item, 'Ответственное_лицо_ИП_инфо'),
        getFieldValue(item, 'Наименовение_компании_1'),
        getFieldValue(item, 'Название'),
        getFieldValue(item, 'Наименование_ИП_инфо'),
        getFieldValue(item, 'ФИО_1')
    ];
    for (const candidate of candidateNames) {
        const pid = managementPartnerLookup[normalizeComparableName(candidate)];
        if (pid) return pid;
    }
    return '';
}

function getManagementMarginPoints(marginRate) {
    const value = Number(marginRate);
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 8;
    if (value <= 0.04) return 9;
    if (value < 0.12) return 10;
    if (value < 0.20) return 7;
    if (value < 0.30) return 5;
    if (value < 0.40) return 3;
    if (value < 0.50) return 1;
    return 0;
}

function getManagementMarginQ(marginRate) {
    return getManagementMarginPoints(marginRate) / 10;
}

// ——— Построение индексов для Q-функций ———

function buildIndexes() {
    const selectedMonth = getSelectedMonth();
    const managementMonth = getManagementMonthForSelection(selectedMonth);
    const callsMonths = getCallsReportMonths(selectedMonth);
    remarkMetricsByPartner = buildRemarkMetrics(selectedMonth);
    auditCountsByPartner = buildAuditCounts(selectedMonth);
    buildOpuComplexityStats();
    buildAccountCoeffStats();
    buildFotContractIndexes();
    buildFotDbIndexes();
    buildFotDbPartnerLookup();

    callsByPartner = {};
    for (const item of callsItems) {
        const itemMonth = extractCallsMonthKey(item);
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

    auditEvalByPartner = {};
    for (const item of auditEvalItems) {
        const itemMonth = normalizeMonthKeyValue(getFieldValue(item, AUDIT_EVAL_FIELDS.DATE));
        if (!doesMonthMatchSelection(itemMonth, selectedMonth)) continue;
        const pid = normalizePartnerRef(getFieldValue(item, AUDIT_EVAL_FIELDS.PARTNER));
        if (!pid) continue;
        const score = computeAuditItemScore(item);
        if (!score) continue; // пустой черновик — не учитываем
        if (!auditEvalByPartner[pid]) auditEvalByPartner[pid] = [];
        auditEvalByPartner[pid].push(score);
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

    buildManagementPartnerLookup();
    managementScoresByPartner = {};
    managementRowsByPartner = {};
    managementSummaryByPartner = {};
    for (const item of managementItems) {
        const hasLegacyFields = Boolean(getFieldValue(item, FIELDS.OPU_PARTNER) || getFieldValue(item, FIELDS.MGMT_SCORE));
        const pid = hasLegacyFields
            ? normalizePartnerRef(getFieldValue(item, FIELDS.OPU_PARTNER))
            : getManagementPartnerId(item);
        if (!pid) continue;

        const itemMonth = hasLegacyFields
            ? extractDealMonthKey(item, [FIELDS.OPU_MONTH, 'CREATED_TIME', 'UPDATED_TIME'])
            : getManagementMonthKey(item);
        if (!doesMonthMatchSelection(itemMonth, managementMonth)) continue;

        const legacyScore = parseFloat(getFieldValue(item, FIELDS.MGMT_SCORE));
        const rawScore = hasLegacyFields ? legacyScore : parseFloat(getFieldValue(item, 'Маржа'));
        if (Number.isNaN(rawScore)) continue;
        const marginScore = Math.max(0, Math.min(1, Number(rawScore) || 0));
        const revenueNetValue = getFieldValue(item, 'Реализация без НДС');
        const partnerMarginValue = getFieldValue(item, 'Маржа Партнера');
        const hasWeightedMarginFields = !hasLegacyFields
            && revenueNetValue !== null
            && revenueNetValue !== undefined
            && revenueNetValue !== ''
            && partnerMarginValue !== null
            && partnerMarginValue !== undefined
            && partnerMarginValue !== '';

        const normalizedRow = {
            id: String(getFieldValue(item, 'external_id') ?? getFieldValue(item, 'EXTERNAL_ID') ?? `${pid}-${managementRowsByPartner[pid]?.length || 0}`),
            partnerId: pid,
            partnerName: partnerMap[pid] || '',
            monthKey: itemMonth || '',
            monthLabel: itemMonth ? formatMonthLabel(itemMonth) : '',
            title: normalizeScalar(getFieldValue(item, 'Название')) || '',
            funnelNumber: normalizeScalar(getFieldValue(item, 'Номер_воронки')) || '',
            funnelName: normalizeScalar(getFieldValue(item, 'Наименовение_воронки')) || '',
            stageName: normalizeScalar(getFieldValue(item, 'Наименование_стадии')) || '',
            ipName: normalizeScalar(getFieldValue(item, 'Наименование_ИП_инфо')) || '',
            responsibleName: normalizeScalar(getFieldValue(item, 'Ответственное_лицо_ИП_инфо')) || '',
            address: normalizeScalar(getFieldValue(item, 'Адрес_объекта_инфо')) || '',
            addressId: normalizeScalar(getFieldValue(item, 'Адрес_объекта_инфо_ID')) || '',
            bin: normalizeScalar(getFieldValue(item, 'BIN_партнера')) || '',
            companyName: normalizeScalar(getFieldValue(item, 'Наименовение_компании_1')) || '',
            fio: normalizeScalar(getFieldValue(item, 'ФИО_1')) || '',
            revenueGross: Number(getFieldValue(item, 'Реализация с НДС')) || 0,
            vat: Number(getFieldValue(item, 'НДС')) || 0,
            revenueNet: Number(revenueNetValue) || 0,
            fotTotal: Number(getFieldValue(item, 'ИТОГО ФОТ')) || 0,
            umsTotal: Number(getFieldValue(item, 'ИТОГО УМС')) || 0,
            partnerMargin: Number(partnerMarginValue) || 0,
            margin: marginScore,
            rawMargin: Number(rawScore) || 0,
            hasWeightedMarginFields,
            expenseIp: Number(getFieldValue(item, 'Расходы ИП')) || 0,
            raw: item
        };

        if (!managementRowsByPartner[pid]) managementRowsByPartner[pid] = [];
        managementRowsByPartner[pid].push(normalizedRow);

        if (!managementSummaryByPartner[pid]) {
            managementSummaryByPartner[pid] = {
                rowCount: 0,
                marginSum: 0,
                rawMarginSum: 0,
                revenueGrossSum: 0,
                revenueNetSum: 0,
                partnerMarginSum: 0,
                expenseIpSum: 0,
                umsTotalSum: 0,
                weightedMarginRows: 0,
                latestMonthKey: itemMonth || ''
            };
        }
        const summary = managementSummaryByPartner[pid];
        summary.rowCount += 1;
        summary.marginSum += normalizedRow.margin;
        summary.rawMarginSum += normalizedRow.rawMargin;
        summary.revenueGrossSum += normalizedRow.revenueGross;
        summary.revenueNetSum += normalizedRow.revenueNet;
        summary.partnerMarginSum += normalizedRow.partnerMargin;
        summary.expenseIpSum += normalizedRow.expenseIp;
        summary.umsTotalSum += normalizedRow.umsTotal;
        if (normalizedRow.hasWeightedMarginFields) summary.weightedMarginRows += 1;
        if (itemMonth && String(itemMonth) > String(summary.latestMonthKey || '')) {
            summary.latestMonthKey = itemMonth;
        }

        if (hasLegacyFields) {
            const updatedAt = normalizeScalar(getFieldValue(item, 'UPDATED_TIME')) || normalizeScalar(getFieldValue(item, 'CREATED_TIME')) || '';
            const current = managementScoresByPartner[pid];
            if (!current || String(updatedAt) > String(current.updatedAt || '')) {
                managementScoresByPartner[pid] = { score: marginScore, updatedAt };
            }
        }
    }

    for (const [pid, summary] of Object.entries(managementSummaryByPartner)) {
        const canUsePowerBiFormula = summary.weightedMarginRows > 0 && summary.revenueNetSum !== 0;
        const marginShare = canUsePowerBiFormula
            ? summary.partnerMarginSum / summary.revenueNetSum
            : (summary.rowCount > 0 ? summary.rawMarginSum / summary.rowCount : 0);
        summary.marginShare = marginShare;
        summary.managementPoints = getManagementMarginPoints(marginShare);
        summary.avgMargin = getManagementMarginQ(marginShare);
        if (!managementScoresByPartner[pid]) {
            managementScoresByPartner[pid] = {
                score: summary.avgMargin,
                updatedAt: summary.latestMonthKey || ''
            };
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
                dealIds: [], realizationScores: [], remarkScores: [], remarkLateDaysTotal: 0, remarkMissingDateCount: 0, remarkMissingFeedbackCount: 0, history: [],
                objectAddressKeys: new Set()
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
        // "Действующие" объекты — это всё, что сейчас в 69 (см. FIELDS.OBJECT_ADDRESS).
        const addressKey = normalizeScalar(getFieldValue(deal, FIELDS.OBJECT_ADDRESS));
        if (addressKey) p.objectAddressKeys.add(addressKey);
    }

    for (const [pid, metric] of Object.entries(remarkMetricsByPartner)) {
        if (!partnersData[pid]) continue;
        const p = partnersData[pid];
        p.remarksCount = metric.rowCount;
        p.remarkScores = metric.items
            .map(item => item.penalty)
            .filter(penalty => Number.isFinite(penalty) && penalty > 0);
        p.remarkLateDaysTotal = metric.totalLateDays;
        p.remarkMissingDateCount = metric.skippedMissingRemarkDate;
        p.remarkMissingFeedbackCount = metric.skippedMissingFeedbackDate;
        p.positiveReviewCount = metric.positiveCount || 0;
        p.negativeReviewCount = metric.negativeCount || 0;
        // "Грязный" объект засчитываем, только если он реально есть в активном портфеле
        // партнёра (воронка 69) — замечания на объектах, которые уже выбыли из портфеля,
        // на долю "без замечаний" не влияют.
        const dirtyInPortfolio = metric.objectsWithNegativeRemark
            ? [...metric.objectsWithNegativeRemark].filter(key => p.objectAddressKeys.has(key))
            : [];
        p.objectsWithNegativeRemarkCount = dirtyInPortfolio.length;
    }

    if (partnerMap) {
        for (const id of Object.keys(partnerMap)) {
            if (!partnersData[id]) {
                partnersData[id] = {
                    name: partnerMap[id],
                    dealsCount: 0, totalScore: 0, remarksCount: 0,
                    totalOpportunity: 0, totalArea: 0,
                    dealIds: [], realizationScores: [], remarkScores: [], remarkLateDaysTotal: 0, remarkMissingDateCount: 0, remarkMissingFeedbackCount: 0, history: [],
                    objectAddressKeys: new Set()
                };
            }
        }
    }

    buildLeagueAggregates();
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
    const penaltyPerObject = getRemarksPenaltyPerObject(pid);
    void totalPenalty; // штраф уже учтён внутри penaltyPerObject, оставлено для читаемости
    return Math.max(0, Math.min(1, 1 - penaltyPerObject));
}

// Штраф за замечания, нормированный на реальный портфель партнёра
// (замена «фактора снисхождения» по объёму — см. план перехода на матрицу
// «Квадрат мечты»). Как только появится поле тяжести замечания, сюда же
// добавится взвешивание крит./средн./незнач.
function getRemarksPenaltyPerObject(pid) {
    const p = partnersData[pid];
    if (!p || !p.remarkScores || p.remarkScores.length === 0) return 0;
    const totalPenalty = p.remarkScores.reduce((sum, penalty) => sum + penalty, 0);
    const portfolio = Math.max(1, Number(p.dealsCount) || 0);
    return totalPenalty / portfolio;
}

function getRealizationQ(pid) {
    const stats = getFotDbStats(pid);
    if (!stats.contractAmount || stats.contractAmount <= 0) return 1.0;

    const targetAmount = stats.targetAmount || (stats.contractAmount * FOT_TARGET_CONTRACT_RATIO);
    if (targetAmount <= 0) return 1.0;

    return Math.min(1, Math.max(0, stats.totalAmount / targetAmount));
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

// Новая методика считает «Обучение операторов» как % обученных от общего
// штата партнёра — этого знаменателя в коде пока нет (источник подключим
// отдельно). До тех пор — нейтральная заглушка Q=1.0. Старая формула
// (средний балл SPA-элемента / 10) была под прежнюю методику и здесь больше
// не используется.
function getTrainingQ(_pid) {
    return 1.0;
}

function getTrainingPassedCount(item) {
    const rawPassedCount = parseFloat(getFieldValue(item, FIELDS.OPU_PASSED_COUNT));
    if (Number.isFinite(rawPassedCount)) return rawPassedCount;

    const legacyCount = parseFloat(getFieldValue(item, 'UF_CRM_ASDLKJ3'));
    if (Number.isFinite(legacyCount)) return legacyCount;

    const legacyParticipantList = getFieldValue(item, 'UF_CRM_127_1756291232');
    if (Array.isArray(legacyParticipantList) && legacyParticipantList.length > 0) {
        return legacyParticipantList.length;
    }

    return 1;
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

// Аудит качества — SPA 1398 "Оценка эффективности объекта" (39 критериев, см.
// AUDIT_CRITERIA/computeAuditItemScore). Q = средний % эффективности по всем аудитам
// партнёра за период. Пока партнёра ни разу не аудировали — нейтрально (не штрафует).
function getAuditQ(pid) {
    const items = auditEvalByPartner[String(pid)];
    if (!items || items.length === 0) return 1.0;
    const avg = items.reduce((sum, s) => sum + s.efficiency, 0) / items.length;
    return Math.max(0, Math.min(1, avg));
}

// Объезды партнёров и кураторов — источник появится с отдельным приложением.
function getRoundsQ(pid) {
    void pid;
    return 1.0;
}

// Бюджетная дисциплина (план/факт, допуск ≤10%) — плановых цифр в управленке
// (кат. 441) сейчас нет вообще, только факт. Нейтральная заглушка до появления
// источника плана.
function getBudgetQ(pid) {
    void pid;
    return 1.0;
}

// % УМС от дохода клиента: норматив 8%, допуск ±10% симметрично.
function getUmsPercentQ(pid) {
    const summary = managementSummaryByPartner[String(pid)];
    if (!summary || !summary.revenueNetSum) return 1.0;
    const factPct = summary.umsTotalSum / summary.revenueNetSum;
    if (!Number.isFinite(factPct)) return 1.0;
    const deviation = Math.abs(factPct - UMS_TARGET_PERCENT) / UMS_TOLERANCE_PERCENT;
    return Math.max(0, Math.min(1, 1 - deviation));
}

// Доля объектов портфеля без единого негативного замечания за период.
function getCleanShareQ(pid) {
    const p = partnersData[pid];
    if (!p || !p.dealsCount) return 1.0;
    const withRemarks = Number(p.objectsWithNegativeRemarkCount) || 0;
    return Math.max(0, Math.min(1, 1 - (withRemarks / p.dealsCount)));
}

// Бонус «Голос клиента»: до +5 баллов сверх итога, пропорционально доле
// положительных отзывов среди всех отзывов партнёра за период.
function getPositiveReviewBonus(pid) {
    const p = partnersData[pid];
    const positive = Number(p?.positiveReviewCount) || 0;
    const negative = Number(p?.negativeReviewCount) || 0;
    const total = positive + negative;
    if (total <= 0) return 0;
    return POSITIVE_REVIEW_BONUS_MAX * (positive / total);
}

function getUpravlenkaQ(pid) {
    const record = managementScoresByPartner[String(pid)];
    return record ? record.score : 0;
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

    if (usesChecksBasedClockster(pid)) {
        return Math.min(1, (metric.checks ?? 0) / totalObjects);
    }

    return Math.min(1, (metric.visits ?? 0) / totalObjects);
}
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

function formatMoneyShort(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return '0';
    const abs = Math.abs(numeric);
    if (abs >= 1_000_000) return `${formatMetricNumber(numeric / 1_000_000, 1)}м`;
    if (abs >= 1_000) return `${formatMetricNumber(numeric / 1_000, 1)}к`;
    return formatMetricNumber(numeric, 0);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildBitrixDealUrl(dealId) {
    const id = String(dealId || '').trim();
    if (!id || !bitrixPortalBase) return '';
    return `${bitrixPortalBase}/crm/deal/details/${id}/`;
}

function buildBitrixItemUrl(entityTypeId, itemId) {
    const entityId = String(entityTypeId || '').trim();
    const id = String(itemId || '').trim();
    if (!entityId || !id || !bitrixPortalBase) return '';
    return `${bitrixPortalBase}/crm/type/${entityId}/details/${id}/`;
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
        return {
            format: 'percent',
            digits: 0,
            sub: 'нет данных',
            title: 'Нет заполненных ответов по обзвону',
            calcText: 'Формула: нет заполненных ответов, балл не считается.',
            calcLines: ['Формула: нет заполненных ответов', 'Балл не считается.']
        };
    }

    const maxScore = totalAnswers * 3;
    const q = Math.min(1, (totalScore / totalAnswers) / 3);
    const avgScore = totalScore / totalAnswers;
    return {
        format: 'percent',
        digits: 0,
        sub: `${formatMetricNumber(totalScore, 0)}/${formatMetricNumber(maxScore, 0)}`,
        title: `Сумма баллов: ${formatMetricNumber(totalScore, 0)} из ${formatMetricNumber(maxScore, 0)}`,
        calcText: `Формула: ${formatMetricNumber(totalScore, 0)} баллов / ${formatMetricNumber(totalAnswers, 0)} ответов = ${formatMetricNumber(avgScore, 1)}; ${formatMetricNumber(avgScore, 1)} / 3 = ${formatPercent(q, 0)}.`,
        calcLines: [
            `Формула: ${formatMetricNumber(totalScore, 0)} баллов / ${formatMetricNumber(totalAnswers, 0)} ответов = ${formatMetricNumber(avgScore, 1)}`,
            `${formatMetricNumber(avgScore, 1)} / 3 = ${formatPercent(q, 0)}`
        ]
    };
}

function getRemarksMetricDetail(pid) {
    const metric = remarkMetricsByPartner[String(pid)];
    if (!metric || metric.rowCount === 0) {
        return {
            format: 'percent',
            digits: 0,
            sub: 'нет данных',
            title: 'Нет замечаний в выбранном срезе',
            calcLines: ['Нет замечаний в выбранном срезе']
        };
    }

    const penaltyPerObject = getRemarksPenaltyPerObject(pid);

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
        title: `Дней просрочки: ${metric.totalLateDays}, замечаний: ${metric.rowCount}, штраф: ${formatMetricNumber(metric.totalPenalty, 2)}, штраф на объект: ${formatMetricNumber(penaltyPerObject, 3)}${missingNote}`,
        calcLines: [
            `Дней просрочки: ${metric.totalLateDays}`,
            `Замечаний: ${metric.rowCount}`,
            `Штраф: ${formatMetricNumber(metric.totalPenalty, 2)}`,
            `Штраф на объект (÷ портфель): ${formatMetricNumber(penaltyPerObject, 3)}`
        ]
    };
}

function getCleanShareMetricDetail(pid) {
    const p = partnersData[pid];
    const dealsCount = Number(p?.dealsCount) || 0;
    const withRemarks = Number(p?.objectsWithNegativeRemarkCount) || 0;
    if (dealsCount === 0) {
        return { format: 'percent', digits: 0, sub: 'нет данных', title: 'Нет объектов в портфеле', calcLines: ['Нет объектов в портфеле'] };
    }
    const clean = Math.max(0, dealsCount - withRemarks);
    return {
        format: 'percent',
        digits: 0,
        sub: `${clean}/${dealsCount}`,
        title: `Объектов без замечаний: ${clean} из ${dealsCount}`,
        calcLines: [`Без замечаний: ${clean}`, `Портфель: ${dealsCount}`]
    };
}

function getRoundsMetricDetail() {
    return { format: 'percent', digits: 0, sub: 'заглушка', title: 'Объезды — источник данных подключим позже (пока Q=1.0)' };
}

function getBudgetMetricDetail() {
    return { format: 'percent', digits: 0, sub: 'заглушка', title: 'Бюджетная дисциплина — плановых цифр пока нет (Q=1.0)' };
}

function getAuditMetricDetail(pid) {
    const items = auditEvalByPartner[String(pid)];
    const legacyAuditRemarksCount = auditCountsByPartner[String(pid)] || 0; // старое: замечания с источником "от аудитора"
    if (!items || items.length === 0) {
        return {
            format: 'percent',
            digits: 0,
            sub: 'нет аудитов',
            title: 'Аудитов объекта (SPA 1398) за период нет — Q нейтрален',
            calcLines: [
                'Аудитов за период нет',
                `Замечаний с пометкой "от аудитора" (справочно): ${formatMetricNumber(legacyAuditRemarksCount, 0)}`
            ]
        };
    }
    const avg = items.reduce((sum, s) => sum + s.efficiency, 0) / items.length;
    return {
        format: 'percent',
        digits: 0,
        sub: `${items.length} аудит(ов)`,
        title: `Средняя эффективность по ${items.length} аудит(ам): ${formatMetricNumber(avg * 100, 0)}%`,
        calcLines: [
            `Аудитов за период: ${items.length}`,
            `Средняя эффективность: ${formatMetricNumber(avg * 100, 0)}%`,
            `Замечаний с пометкой "от аудитора" (справочно): ${formatMetricNumber(legacyAuditRemarksCount, 0)}`
        ]
    };
}

function getRealizationMetricDetail(pid) {
    const stats = getFotDbStats(pid);
    const contractAmount = Number(stats.contractAmount) || 0;
    if (contractAmount <= 0) {
        return {
            format: 'percent',
            digits: 0,
            displayText: '-',
            sub: 'нет данных',
            title: 'Нет договоров с месяцем начисления за выбранный период; ФОТ не влияет на расчёт',
            calcLines: ['Нет договоров с месяцем начисления', 'ФОТ не влияет на расчёт']
        };
    }

    const targetAmount = Number(stats.targetAmount) || (contractAmount * FOT_TARGET_CONTRACT_RATIO);
    const paidAmount = Number(stats.totalAmount) || 0;
    const rawRatio = targetAmount > 0 ? paidAmount / targetAmount : 0;
    const displayRatio = Math.min(1, Math.max(0, rawRatio));
    const mappingText = stats.hasMapping
        ? `партнер в базе оплат: ${stats.dbPartnerName || stats.dbPartnerId}`
        : 'партнер не сопоставлен с базой оплат';

    return {
        format: 'percent',
        digits: 0,
        displayValue: displayRatio,
        sub: `${formatMoneyShort(paidAmount)} / ${formatMoneyShort(targetAmount)}`,
        title: `Договоры: ${formatMoneyShort(contractAmount)}; цель 60%: ${formatMoneyShort(targetAmount)}; выплаты людям: ${formatMoneyShort(paidAmount)}; выполнение: ${formatPercent(rawRatio)}; сделок: ${formatMetricNumber(stats.contractDealsCount || 0, 0)}; платежей: ${formatMetricNumber(stats.paymentsCount || 0, 0)}; ${mappingText}`,
        calcLines: [
            `Договоры: ${formatMoneyShort(contractAmount)}`,
            `Цель 60%: ${formatMoneyShort(targetAmount)}`,
            `Выплаты людям: ${formatMoneyShort(paidAmount)}`,
            `Выполнение: ${formatPercent(rawRatio)}`,
            `Сделок: ${formatMetricNumber(stats.contractDealsCount || 0, 0)}, платежей: ${formatMetricNumber(stats.paymentsCount || 0, 0)}`
        ]
    };
}

function getUpravlenkaMetricDetail(pid) {
    const record = managementScoresByPartner[String(pid)];
    if (!record) {
        return {
            format: 'percent',
            digits: 0,
            sub: 'нет оценки',
            title: 'Нет данных управленки за выбранный период',
            calcLines: ['Нет данных управленки']
        };
    }
    const summary = managementSummaryByPartner[String(pid)] || {};
    const rowCount = Number(summary.rowCount) || 0;
    const marginShare = Number.isFinite(Number(summary.marginShare))
        ? Number(summary.marginShare)
        : (Number(summary.avgMargin) || Number(record.score) || 0);
    const points = Number.isFinite(Number(summary.managementPoints))
        ? Number(summary.managementPoints)
        : getManagementMarginPoints(marginShare);
    const qValue = Number.isFinite(Number(record.score)) ? Number(record.score) : points / 10;
    return {
        format: 'percent',
        digits: 0,
        displayValue: qValue,
        sub: `${formatMetricNumber(points, 0)} из 10`,
        title: `Маржа %: ${formatPercent(marginShare, 2)}; Q управленки: ${formatPercent(qValue, 0)}; балл: ${formatMetricNumber(points, 0)} из 10; строк: ${formatMetricNumber(rowCount, 0)}`,
        calcLines: [
            `Строк в отчёте: ${formatMetricNumber(rowCount, 0)}`,
            `Формула Power BI: Маржа партнёра / Реализация без НДС`,
            `Реализация без НДС: ${formatMoneyShort(summary.revenueNetSum || 0)}`,
            `Маржа партнёра: ${formatMoneyShort(summary.partnerMarginSum || 0)}`,
            `Маржа %: ${formatPercent(marginShare, 2)}`,
            `Балл по шкале: ${formatMetricNumber(points, 0)} из 10`,
            `Q управленки: ${formatPercent(qValue, 0)}`
        ]
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
            title: `Часы на объектах: ${formatMetricNumber(hours, 1)}, объектов в 69: ${formatMetricNumber(totalObjects, 0)}`,
            calcLines: [
                `Часы на объектах: ${formatMetricNumber(hours, 1)}`,
                `Объектов в 69: ${formatMetricNumber(totalObjects, 0)}`
            ]
        };
    }

    if (usesChecksBasedClockster(pid)) {
        const checks = metric?.checks ?? 0;
        const uniqueObjects = metric?.uniqueObjects ?? 0;
        return {
            format: 'percent',
            digits: 0,
            sub: `${formatMetricNumber(checks, 0)}/${formatMetricNumber(totalObjects, 0)}`,
            title: `Всего чеков: ${formatMetricNumber(checks, 0)}, уникальных объектов: ${formatMetricNumber(uniqueObjects, 0)}, объектов в 69: ${formatMetricNumber(totalObjects, 0)}`,
            calcLines: [
                `Чеков всего: ${formatMetricNumber(checks, 0)}`,
                `Уникальных объектов: ${formatMetricNumber(uniqueObjects, 0)}`,
                `Объектов в 69: ${formatMetricNumber(totalObjects, 0)}`
            ]
        };
    }

    const visits = metric?.visits ?? 0;
    const uniqueObjects = metric?.uniqueObjects ?? 0;
    return {
        format: 'percent',
        digits: 0,
        sub: `${formatMetricNumber(visits, 0)}/${formatMetricNumber(totalObjects, 0)}`,
        title: `Дедуп приходов Адрес+Дата: ${formatMetricNumber(visits, 0)}, уникальных объектов: ${formatMetricNumber(uniqueObjects, 0)}, объектов в 69: ${formatMetricNumber(totalObjects, 0)}`,
        calcLines: [
            `Приходов: ${formatMetricNumber(visits, 0)}`,
            `Уникальных объектов: ${formatMetricNumber(uniqueObjects, 0)}`,
            `Объектов в 69: ${formatMetricNumber(totalObjects, 0)}`
        ]
    };
}

function getTrainingMetricDetail(pid) {
    const items = opuByPartner[pid] || [];
    let total = 0;
    let count = 0;
    let passedCount = 0;

    for (const item of items) {
        const avgSum = parseFloat(getFieldValue(item, FIELDS.OPU_AVERAGE_SUM));
        if (Number.isFinite(avgSum)) {
            total += avgSum;
            count += 1;
        }
        passedCount += getTrainingPassedCount(item);
    }

    if (items.length === 0) {
        return {
            format: 'percent',
            digits: 0,
            sub: '0 прошли',
            title: 'Нет пройденного обучения за выбранный период; применяется дефолт 40%',
            calcLines: ['Нет пройденного обучения', 'Применяется дефолт 40%']
        };
    }

    const avg = count > 0 ? total / count : null;
    const passedLabel = formatMetricNumber(passedCount, 0);
    return {
        format: 'percent',
        digits: 0,
        sub: `${passedLabel} прошли`,
        title: avg == null
            ? `Прошли обучение: ${passedLabel}; средний балл/сумма: нет данных`
            : `Прошли обучение: ${passedLabel}; средний балл/сумма: ${formatMetricNumber(avg, 2)} из 10`,
        calcLines: avg == null
            ? [`Прошли обучение: ${passedLabel}`, 'Средний балл/сумма: нет данных']
            : [`Прошли обучение: ${passedLabel}`, `Средний балл/сумма: ${formatMetricNumber(avg, 2)} из 10`]
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

function getUmsMetricDetail(pid) {
    const summary = managementSummaryByPartner[String(pid)];
    if (!summary || !summary.revenueNetSum) {
        return { format: 'percent', digits: 0, sub: 'нет данных', title: 'Нет данных по управленке за период' };
    }
    const factPct = summary.umsTotalSum / summary.revenueNetSum;
    return {
        format: 'percent',
        digits: 1,
        displayValue: factPct,
        sub: formatPercent(factPct, 1),
        title: `УМС факт: ${formatPercent(factPct, 1)}, норматив: ${formatPercent(UMS_TARGET_PERCENT, 0)} ±${formatPercent(UMS_TOLERANCE_PERCENT, 0)}`,
        calcLines: [
            `УМС факт: ${formatPercent(factPct, 1)}`,
            `Норматив: ${formatPercent(UMS_TARGET_PERCENT, 0)} ±${formatPercent(UMS_TOLERANCE_PERCENT, 0)}`
        ]
    };
}

function buildPartnerBreakdown(pid, rowData = null) {
    const remarkMetric = remarkMetricsByPartner[String(pid)] || null;
    const callsItemsForPartner = callsByPartner[String(pid)] || [];
    const trainingItemsForPartner = opuByPartner[String(pid)] || [];
    const trainingMetric = getTrainingMetricDetail(pid);
    const disciplineStats = disciplineStatsByPartner[String(pid)] || null;
    const managementRecord = managementScoresByPartner[String(pid)] || null;
    const fotStats = getFotDbStats(pid);
    const clocksterMetric = clocksterMetricsByPartner[String(pid)] || null;
    const remarksPenaltyPerObject = getRemarksPenaltyPerObject(pid);
    const row = rowData || null;
    const overdueRemarkItems = (remarkMetric?.items || []).filter(item => Number(item?.lateDays) > 0);
    const selectedMonth = getSelectedMonth();
    const auditItems = buildAuditItems(pid, selectedMonth);
    const auditCount = auditCountsByPartner[String(pid)] || 0;

    return {
        summary: {
            finalScore: row?.matrixTotalScore || 0,
            rawTotal: row?.rawTotal || 0,
            positiveReviewBonus: row?.positiveReviewBonus || 0,
            leagueCoeff: row?.leagueCoeff || 1,
            league: row?.league || 'Золото'
        },
        calls: {
            score: getCallsQ(pid),
            title: 'Обзвон',
            items: callsItemsForPartner.map(describeCallsItem),
            lines: [
                `Записей в расчёте: ${callsItemsForPartner.length}`,
                `Ответов, вошедших в расчёт: ${callsItemsForPartner.length ? getCallsMetricDetail(pid).sub || 'есть данные' : 'нет данных'}`,
                `Q обзвона: ${formatPercent(getCallsQ(pid), 0)}`
            ]
        },
        remarks: {
            score: getRemarksQ(pid),
            title: 'Замечания',
            penaltyPerObject: remarksPenaltyPerObject,
            totalLateDays: Number(remarkMetric?.totalLateDays) || 0,
            totalPenalty: Number(remarkMetric?.totalPenalty) || 0,
            overdueCount: overdueRemarkItems.length,
            lines: [
                `Замечаний в расчёте: ${remarkMetric?.rowCount || 0}`,
                `Просроченных замечаний: ${overdueRemarkItems.length}`,
                `Суммарная просрочка: ${remarkMetric?.totalLateDays || 0} дн.`,
                `Итоговый Q замечаний: ${formatPercent(getRemarksQ(pid), 0)}`
            ],
            items: overdueRemarkItems.map(item => ({
                id: String(item.id || ''),
                label: item.title || 'Замечание без названия',
                url: buildBitrixDealUrl(item.id),
                remarkDate: item.remarkDate || '',
                feedbackDate: item.feedbackDate || '',
                lateDays: item.lateDays == null ? null : Number(item.lateDays),
                penalty: Number(item.penalty) || 0,
                status: `Просрочка ${item.lateDays} дн., штраф ${formatMetricNumber(item.penalty, 2)}`
            }))
        },
        audit: {
            score: getAuditQ(pid),
            title: 'Аудит',
            totalCount: auditCount,
            auditEvalCount: (auditEvalByPartner[String(pid)] || []).length,
            lines: [
                `Аудитов объекта (SPA 1398) за период: ${(auditEvalByPartner[String(pid)] || []).length}`,
                `Замечаний "от аудитора" в 81 (справочно): ${formatMetricNumber(auditCount, 0)}`,
                `Итоговый Q аудита: ${formatPercent(getAuditQ(pid), 0)}`
            ],
            items: auditItems
        },
        rounds: {
            score: getRoundsQ(pid),
            title: 'Объезды',
            lines: ['Источник данных подключим отдельным приложением — пока Q=1.0']
        },
        budget: {
            score: getBudgetQ(pid),
            title: 'Бюджетная дисциплина',
            lines: ['Плановых цифр в управленке пока нет — пока Q=1.0']
        },
        ums: {
            score: getUmsPercentQ(pid),
            title: '% УМС от дохода',
            lines: [
                `Норматив: ${formatPercent(UMS_TARGET_PERCENT, 0)} ±${formatPercent(UMS_TOLERANCE_PERCENT, 0)}`,
                `Q УМС: ${formatPercent(getUmsPercentQ(pid), 0)}`
            ]
        },
        cleanShare: {
            score: getCleanShareQ(pid),
            title: 'Доля объектов без замечаний',
            lines: [
                `Объектов с замечаниями: ${Number(partnersData[pid]?.objectsWithNegativeRemarkCount) || 0}`,
                `Портфель: ${Number(partnersData[pid]?.dealsCount) || 0}`,
                `Q: ${formatPercent(getCleanShareQ(pid), 0)}`
            ]
        },
        realization: {
            score: getRealizationQ(pid),
            title: 'ФОТ',
            lines: [
                `Сумма договоров за период: ${formatMoneyShort(fotStats.contractAmount || 0)}`,
                `Цель по выплатам людям (60%): ${formatMoneyShort(fotStats.targetAmount || 0)}`,
                `Фактические выплаты: ${formatMoneyShort(fotStats.totalAmount || 0)}`,
                `Сделок в расчёте: ${formatMetricNumber(fotStats.contractDealsCount || 0, 0)}`,
                `Платежей в базе: ${formatMetricNumber(fotStats.paymentsCount || 0, 0)}`
            ]
        },
        upravlenka: {
            score: getUpravlenkaQ(pid),
            title: 'Управленка',
            summary: managementSummaryByPartner[String(pid)] || null,
            rows: managementRowsByPartner[String(pid)] || [],
            lines: managementRecord
                ? [
                    `Строк в отчёте: ${(managementSummaryByPartner[String(pid)]?.rowCount) || 0}`,
                    `Маржа %: ${formatPercent(managementSummaryByPartner[String(pid)]?.marginShare || 0, 2)}`,
                    `Q управленки: ${formatPercent(managementRecord.score, 0)}`,
                    `Последнее обновление: ${managementRecord.updatedAt || 'без даты'}`
                ]
                : ['Оценка за выбранный месяц пока не заполнена.']
        },
        clockster: {
            score: getClocksterQ(pid),
            title: 'Клостер',
            missedObjects: buildClocksterMissedObjects(pid, row),
            lines: usesHoursBasedClockster(pid)
                ? [
                    `Часы на объектах: ${formatMetricNumber(clocksterMetric?.hours || 0, 1)}`,
                    `Реализация: ${formatMetricNumber(row?.dealsCount || 0, 0)}`
                ]
                : usesChecksBasedClockster(pid)
                ? [
                    `Чеков всего: ${formatMetricNumber(clocksterMetric?.checks || 0, 0)}`,
                    `Уникальных объектов: ${formatMetricNumber(clocksterMetric?.uniqueObjects || 0, 0)}`,
                    `Реализация: ${formatMetricNumber(row?.dealsCount || 0, 0)}`
                ]
                : [
                    `Уникальных приходов: ${formatMetricNumber(clocksterMetric?.visits || 0, 0)}`,
                    `Уникальных объектов: ${formatMetricNumber(clocksterMetric?.uniqueObjects || 0, 0)}`,
                    `Реализация: ${formatMetricNumber(row?.dealsCount || 0, 0)}`
                ]
        },
        training: {
            score: getTrainingQ(pid),
            title: 'Обучение',
            lines: trainingItemsForPartner.length
                ? [
                    `Прошли обучение: ${trainingMetric.sub || '0 прошли'}`,
                    `Средний балл/сумма: ${trainingMetric.title || ''}`
                ]
                : ['За выбранный период никто не прошел обучение.']
        },
        discipline: {
            score: getDisciplineQ(pid),
            title: 'Дисциплины',
            lines: disciplineStats
                ? [
                    `Всего планёрок: ${formatMetricNumber(disciplineStats.totalMeetings || 0, 0)}`,
                    `Пропусков: ${formatMetricNumber(disciplineStats.absences || 0, 0)}`,
                    `Итоговый Q дисциплины: ${formatPercent(getDisciplineQ(pid), 0)}`
                ]
                : ['За выбранный период нарушений не зафиксировано.']
        },
    };
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
        rounds: getRoundsMetricDetail(pid),
        budget: getBudgetMetricDetail(pid),
        ums: getUmsMetricDetail(pid),
        cleanShare: getCleanShareMetricDetail(pid)
    };
}

const MATRIX_CRITERIA_BY_KEY = Object.fromEntries(
    Object.values(MATRIX)
        .flat()
        .map(criteria => [criteria.key, criteria])
);

function renderMetricCell(value, detail) {
    const sub = detail?.sub || '';
    const displayValue = Number(detail?.displayValue ?? value ?? 0);
    const digits = Number.isFinite(detail?.digits) ? detail.digits : 2;
    const mainValue = typeof detail?.displayText === 'string'
        ? detail.displayText
        : detail?.format === 'percent'
        ? formatPercent(displayValue, digits)
        : (Number.isFinite(displayValue) ? displayValue.toFixed(digits) : '0');
    return `<td><div class="metric-main">${mainValue}</div><div class="metric-sub">${sub}</div></td>`;
}

function renderSummaryCell(value, detail) {
    const sub = detail?.sub || '';
    return `<td><div class="metric-main">${(value ?? 0).toFixed(1)}</div><div class="metric-sub">${sub}</div></td>`;
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
    columns.push({ type: 'bonus', label: 'Бонус' });
    columns.push({ type: 'league', label: 'Лига' });
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
    const clocksterCriteria = MATRIX_CRITERIA_BY_KEY.clockster;
    const roundsCriteria = MATRIX_CRITERIA_BY_KEY.rounds;
    const trainingCriteria = MATRIX_CRITERIA_BY_KEY.training;
    const budgetCriteria = MATRIX_CRITERIA_BY_KEY.budget;
    const umsCriteria = MATRIX_CRITERIA_BY_KEY.ums;
    const callsCriteria = MATRIX_CRITERIA_BY_KEY.calls;
    const auditCriteria = MATRIX_CRITERIA_BY_KEY.audit;
    const remarksCriteria = MATRIX_CRITERIA_BY_KEY.remarks;
    const cleanShareCriteria = MATRIX_CRITERIA_BY_KEY.cleanShare;

    const columns = [
        {
            title: 'Операционка',
            items: [
                buildExampleMetricMarkup('Регистрация/отметка', getExampleMetricValue(details.clockster, q.clockster), [
                    `База: ${details.clockster?.sub || 'нет данных'}`,
                    `Вклад: ${(clocksterCriteria.weight * q.clockster * clocksterCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Объезды', getExampleMetricValue(details.rounds, q.rounds), [
                    'Заглушка — источник ещё не подключён',
                    `Вклад: ${(roundsCriteria.weight * q.rounds * roundsCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Обучение', getExampleMetricValue(details.training, q.training), [
                    'Заглушка — знаменатель (штат) ещё не подключён',
                    `Вклад: ${(trainingCriteria.weight * q.training * trainingCriteria.influence).toFixed(1)} бал.`
                ])
            ]
        },
        {
            title: 'Финансы',
            items: [
                buildExampleMetricMarkup('Бюджетная дисциплина', getExampleMetricValue(details.budget, q.budget), [
                    'Заглушка — плановых цифр пока нет',
                    `Вклад: ${(budgetCriteria.weight * q.budget * budgetCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('% УМС', getExampleMetricValue(details.ums, q.ums), [
                    `Факт: ${details.ums?.sub || 'нет данных'}`,
                    `Вклад: ${(umsCriteria.weight * q.ums * umsCriteria.influence).toFixed(1)} бал.`
                ])
            ]
        },
        {
            title: 'Отношения',
            items: [
                buildExampleMetricMarkup('Обзвон (CSAT)', getExampleMetricValue(details.calls, q.calls), [
                    `Ответы: ${details.calls?.sub || 'нет данных'}`,
                    `Вклад: ${(callsCriteria.weight * q.calls * callsCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Аудит качества', getExampleMetricValue(details.audit, q.audit), [
                    `Аудитов за период: ${details.audit?.sub || 'нет данных'}`,
                    `Вклад: ${(auditCriteria.weight * q.audit * auditCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Замечания', getExampleMetricValue(details.remarks, q.remarks), [
                    `Дни просрочки / замечания: ${details.remarks?.sub || 'нет данных'}`,
                    `Вклад: ${(remarksCriteria.weight * q.remarks * remarksCriteria.influence).toFixed(1)} бал.`
                ]),
                buildExampleMetricMarkup('Без замечаний', getExampleMetricValue(details.cleanShare, q.cleanShare), [
                    `Объекты: ${details.cleanShare?.sub || 'нет данных'}`,
                    `Вклад: ${(cleanShareCriteria.weight * q.cleanShare * cleanShareCriteria.influence).toFixed(1)} бал.`
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
                <div class="example-calc-total-label">Операционка</div>
                <div class="example-calc-total-value">${escapeHtml((row.operationsScore || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Финансы</div>
                <div class="example-calc-total-value">${escapeHtml((row.financeScore || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Отношения</div>
                <div class="example-calc-total-value">${escapeHtml((row.relationsScore || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Сумма</div>
                <div class="example-calc-total-value">${escapeHtml((row.rawTotal || 0).toFixed(1))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Бонус за отзывы</div>
                <div class="example-calc-total-value">+${escapeHtml((row.positiveReviewBonus || 0).toFixed(2))} бал.</div>
            </div>
            <div class="example-calc-total-item">
                <div class="example-calc-total-label">Лига</div>
                <div class="example-calc-total-value">${escapeHtml(row.league || '-')} (${escapeHtml((row.leagueCoeff || 1).toFixed(3))})</div>
            </div>
        </div>
        <div class="example-calc-total-meta">
            Объекты: ${escapeHtml(formatMetricNumber(row.dealsCount || 0, 0))} · площадь: ${escapeHtml((row.totalArea || 0).toFixed(1))} м²<br>
            Реализация (справочно, не входит в итог): ${escapeHtml(formatPercent(row.realizationQ || 0, 0))}
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

    const label = document.createElement('span');
    label.className = 'matrix-controls-label';
    label.textContent = 'Показать колонки:';
    container.appendChild(label);

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = `matrix-toggle matrix-toggle-all${allExpanded ? ' is-active' : ''}`;
    allButton.textContent = 'Все колонки';
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

// Город партнёра — для правила лиги «город=Алматы → не ниже Изумруда».
function getPartnerCity(name) {
    const normalized = (name || '').trim().toLowerCase();
    if (!normalized) return null;
    for (const entry of PARTNER_CITY_SOURCE) {
        if (entry.aliases.some(alias => alias.trim().toLowerCase() === normalized)) {
            return entry.city;
        }
    }
    return null;
}

// Коэффициент/лига «Квадрат мечты» (см. «Классификация партнера.xlsx», лист
// «Вар.1 Порог самопересчёт»): доли объектов/ОПУ/выручки/трудоёмкости,
// нормированные так, что среднее по сети = 1. В отличие от старого
// perc-based коэффициента, это значение НЕ умножает итоговый балл — только
// определяет лигу.
function buildLeagueAggregates() {
    const rows = Object.entries(partnersData)
        .map(([pid, partner]) => {
            const dealsCount = Number(partner?.dealsCount) || 0;
            const revenue = Number(partner?.totalOpportunity) || 0;
            const opuValue = opuComplexityStatsByPartner[String(pid)]?.value ?? 0;
            const avgCheck = dealsCount > 0 ? revenue / dealsCount : 0;
            return {
                pid,
                name: (partner?.name ?? partnerMap[pid] ?? '').trim(),
                dealsCount,
                revenue,
                opuValue,
                inverseAvgCheck: avgCheck > 0 ? 1 / avgCheck : 0
            };
        })
        .filter(item => item.name && !isExcluded(item.name) && item.dealsCount > 0);

    const totals = rows.reduce((acc, row) => {
        acc.dealsCount += row.dealsCount;
        acc.revenue += row.revenue;
        acc.opuValue += row.opuValue;
        acc.inverseAvgCheck += row.inverseAvgCheck;
        return acc;
    }, { dealsCount: 0, revenue: 0, opuValue: 0, inverseAvgCheck: 0 });

    leagueAggregates = { rows, totals, partnerCount: rows.length };
}

function getPartnerLeagueCoeff(pid) {
    const row = (leagueAggregates.rows || []).find(item => item.pid === String(pid));
    if (!row) return 1.0;
    const totals = leagueAggregates.totals || {};
    const n = leagueAggregates.partnerCount || 1;

    const doleObjects = totals.dealsCount > 0 ? row.dealsCount / totals.dealsCount : 0;
    const doleOpu = totals.opuValue > 0 ? row.opuValue / totals.opuValue : 0;
    const doleRevenue = totals.revenue > 0 ? row.revenue / totals.revenue : 0;
    const doleTrudo = totals.inverseAvgCheck > 0 ? row.inverseAvgCheck / totals.inverseAvgCheck : 0;

    return ((doleObjects + doleOpu + doleRevenue + doleTrudo) / 4) * n;
}

// Лиги — Вариант 1 (пороговый + привилегия для Алматы), подтверждено с заказчиком.
function getPartnerLeague(pid) {
    const coeff = getPartnerLeagueCoeff(pid);
    const p = partnersData[pid];
    const city = getPartnerCity(p?.name);
    if (coeff >= 1.2) return 'Бриллиант';
    if (coeff >= 0.85 || city === 'Алматы') return 'Изумруд';
    return 'Золото';
}

function buildComplexityTooltip(row) {
    const pid = String(row?.bitrixPartnerId);
    const totals = leagueAggregates.totals || {};
    const rowStats = (leagueAggregates.rows || []).find(item => item.pid === pid) || {};
    const opuStats = opuComplexityStatsByPartner[pid] || null;

    const doleObjects = totals.dealsCount > 0 ? rowStats.dealsCount / totals.dealsCount : 0;
    const doleOpu = totals.opuValue > 0 ? rowStats.opuValue / totals.opuValue : 0;
    const doleRevenue = totals.revenue > 0 ? rowStats.revenue / totals.revenue : 0;
    const doleTrudo = totals.inverseAvgCheck > 0 ? rowStats.inverseAvgCheck / totals.inverseAvgCheck : 0;

    const lines = [
        `Лига: ${row?.league || '-'} (коэф. ${(row?.leagueCoeff || 1).toFixed(3)})`,
        '',
        `Доля объектов: ${(doleObjects * 100).toFixed(1)}% (${row?.dealsCount || 0}/${totals.dealsCount || 0})`,
        `Доля ОПУ: ${(doleOpu * 100).toFixed(1)}% (значение ${opuStats ? opuStats.value : '-'}, источник: ${opuStats?.sourceName || 'нет ручного значения'})`,
        `Доля выручки: ${(doleRevenue * 100).toFixed(1)}%`,
        `Доля трудоёмкости: ${(doleTrudo * 100).toFixed(1)}%`,
        '',
        `Город: ${getPartnerCity(row?.name) || 'не определён'}`
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
            clockster: getClocksterQ(pid),
            rounds: getRoundsQ(pid),
            training: getTrainingQ(pid),
            budget: getBudgetQ(pid),
            ums: getUmsPercentQ(pid),
            calls: getCallsQ(pid),
            audit: getAuditQ(pid),
            remarks: getRemarksQ(pid),
            cleanShare: getCleanShareQ(pid),
        };
        // Реализация (FOT DB) — оставлена справочно, вне 100-балльной шкалы (по решению заказчика).
        const realizationQ = getRealizationQ(pid);
        const details = buildMetricDetails(pid);

        const operationsScore = blockScore(MATRIX.operations, k => q[k] ?? 1.0);
        const financeScore = blockScore(MATRIX.finance, k => q[k] ?? 1.0);
        const relationsScore = blockScore(MATRIX.relations, k => q[k] ?? 1.0);
        const rawTotal = operationsScore + financeScore + relationsScore;
        const positiveReviewBonus = getPositiveReviewBonus(pid);
        const matrixTotalScore = roundTo(rawTotal + positiveReviewBonus, 2);
        const leagueCoeff = getPartnerLeagueCoeff(pid);
        const league = getPartnerLeague(pid);
        const avgScore = data.dealsCount ? data.totalScore / data.dealsCount : 0;
        const rowDraft = {
            bitrixPartnerId: pid,
            name: data.name,
            q,
            dealsCount: data.dealsCount || 0,
            totalArea: data.totalArea || 0,
            operationsScore,
            financeScore,
            relationsScore,
            rawTotal,
            realizationQ,
            positiveReviewBonus,
            leagueCoeff,
            league,
            matrixTotalScore
        };

        matrixRows.push({
            ...rowDraft,
            statusZone: avgScore > 0.8 ? 'green' : avgScore > 0.5 ? 'yellow' : 'red',
            statusLabel: avgScore > 0.8 ? 'Excellent' : avgScore > 0.5 ? 'Good' : 'Needs Review',
            details,
            breakdown: buildPartnerBreakdown(pid, rowDraft),
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
    if (matrixBody) {
        matrixBody.innerHTML = '';
        const visibleColumns = getVisibleMatrixColumns();
        for (const [rowIndex, row] of matrixRows.entries()) {
            const tr = document.createElement('tr');
            tr.className = 'partner-row';
            const qk = row.q;
            const dk = row.details || {};
            const tooltip = `Сделок: ${row.dealsCount}\nПлощадь: ${(row.totalArea || 0).toFixed(1)} м²\nЗамечаний: ${row.remarksCount}\nДней просрочки: ${row.remarksLateDaysTotal || 0}\nШтраф на объект: ${formatMetricNumber(getRemarksPenaltyPerObject(row.bitrixPartnerId), 3)}\nБез даты замечания: ${row.remarkMissingDateCount || 0}\nБез обратной связи: ${row.remarkMissingFeedbackCount || 0}\nЛига: ${row.league}\nБонус за отзывы: +${formatMetricNumber(row.positiveReviewBonus || 0, 2)}\nID: ${row.bitrixPartnerId}`;
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
                    case 'league':
                        return `<td${classAttr} title="${complexityTooltip}">${escapeHtml(row.league || '-')}</td>`;
                    case 'bonus':
                        return `<td${classAttr}>+${(row.positiveReviewBonus || 0).toFixed(1)}</td>`;
                    case 'total':
                        return `<td${classAttr}><strong>${(row.matrixTotalScore || 0).toFixed(1)}</strong></td>`;
                    default:
                        return `<td${classAttr}></td>`;
                }
            });

            tr.innerHTML = cells.join('');
            matrixBody.appendChild(tr);
        }
    }

    renderExampleCalculation();

    updateStats(matrixRows, partners);
    updateLastUpdatedLabel();
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function updateStats(matrixData, partners) {
    const activeMatrixRows = Array.isArray(matrixData) ? matrixData.filter(row => (row.dealsCount || 0) > 0) : [];
    const fallbackPartners = Array.isArray(partners) ? partners.filter(p => (p.dealsCount || 0) > 0) : [];

    if (activeMatrixRows.length > 0) {
        const topRow = activeMatrixRows[0];
        const riskRow = activeMatrixRows[activeMatrixRows.length - 1];
        const totalAvg = (activeMatrixRows.reduce((sum, row) => sum + (row.matrixTotalScore || 0), 0) / activeMatrixRows.length).toFixed(1);
        const relationsAvg = (activeMatrixRows.reduce((sum, row) => sum + (row.relationsScore || 0), 0) / activeMatrixRows.length).toFixed(1);
        const moneyAvg = (activeMatrixRows.reduce((sum, row) => sum + (row.financeScore || 0), 0) / activeMatrixRows.length).toFixed(1);
        const operationsAvg = (activeMatrixRows.reduce((sum, row) => sum + (row.operationsScore || 0), 0) / activeMatrixRows.length).toFixed(1);
        const managementAvg = activeMatrixRows.reduce((sum, row) => sum + ((Number(row.q?.budget) || 0) * 100), 0) / activeMatrixRows.length;
        const complexityAvg = (activeMatrixRows.reduce((sum, row) => sum + (row.leagueCoeff || 1), 0) / activeMatrixRows.length).toFixed(2);
        const totalObjects = activeMatrixRows.reduce((sum, row) => sum + (row.dealsCount || 0), 0);
        const totalArea = activeMatrixRows.reduce((sum, row) => sum + (row.totalArea || 0), 0);
        const overdueRemarks = activeMatrixRows.reduce((sum, row) => {
            const breakdownCount = Number(row.breakdown?.remarks?.overdueCount);
            if (Number.isFinite(breakdownCount)) return sum + breakdownCount;
            return sum + ((row.breakdown?.remarks?.items || []).length || 0);
        }, 0);
        const overdueDays = activeMatrixRows.reduce((sum, row) => sum + (row.remarksLateDaysTotal || 0), 0);
        const totalAudits = activeMatrixRows.reduce((sum, row) => sum + (auditCountsByPartner[row.bitrixPartnerId] || 0), 0);

        setText('avgScoreTotal', totalAvg);
        setText('activeDealsCount', String(activeMatrixRows.length));
        setText('heroObjectsCount', formatMetricNumber(totalObjects, 0));
        setText('heroAreaTotal', `${formatMetricNumber(totalArea, 1)} м²`);
        setText('heroManagementAvg', formatPercent((managementAvg || 0) / 100, 0));
        setText('remarkDebtValue', `${formatMetricNumber(overdueDays, 0)} дн.`);
        setText('remarkDebtSub', `${formatMetricNumber(overdueRemarks, 0)} просроченных замечаний`);
        setText('auditDealsValue', String(totalAudits));
        setText('relationsAvg', relationsAvg);
        setText('moneyAvg', moneyAvg);
        setText('operationsAvg', operationsAvg);
        setText('complexityAvg', complexityAvg);
        return;
    }

    if (fallbackPartners.length === 0) return;

    const totalAvg = (fallbackPartners.reduce((sum, p) => sum + (p.totalScore / (p.dealsCount || 1)), 0) / fallbackPartners.length).toFixed(2);
    setText('avgScoreTotal', totalAvg);
    setText('activeDealsCount', String(fallbackPartners.length));
    setText('topPartnerName', fallbackPartners[0]?.name || '—');
}

function updateLastUpdatedLabel() {
    const el = document.getElementById('lastUpdated');
    if (!el) return;
    const d = lastRenderedTimestamp ? new Date(lastRenderedTimestamp) : new Date();
    el.textContent = `Данные от ${d.toLocaleDateString('ru')} ${d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`;
}

// ——— localStorage кэш ———

function buildSharedCachePayload(localPayload) {
    return {
        timestamp: localPayload.timestamp,
        partnerMap: localPayload.partnerMap,
        companyMap: localPayload.companyMap,
        accountCoefficientRows: localPayload.accountCoefficientRows,
        list115PartnerByElementId: localPayload.list115PartnerByElementId,
        lastUserMap,
        deals69: localPayload.deals69,
        deals79: localPayload.deals79,
        remarkDeals: localPayload.remarkDeals,
        callsItems: localPayload.callsItems,
        disciplineItems: localPayload.disciplineItems,
        opuItems: localPayload.opuItems,
        managementItems: localPayload.managementItems,
        auditEvalItems: localPayload.auditEvalItems,
        fotDbItems: localPayload.fotDbItems,
        clocksterMetricsCache: localPayload.clocksterMetricsCache
    };
}

function queueSharedCacheSync(payload) {
    if (typeof fetch === 'undefined') return;
    if (sharedCacheSyncTimer) clearTimeout(sharedCacheSyncTimer);
    sharedCacheSyncTimer = setTimeout(() => {
        fetch('/api/shared-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildSharedCachePayload(payload))
        }).catch(() => {});
    }, 250);
}

function saveCache() {
    try {
        const payload = {
            timestamp: lastRenderedTimestamp || Date.now(),
            selectedMonth: getSelectedMonth(),
            selectedExamplePartnerId,
            expandedMatrixGroups,
            clocksterMetricsCache,
            partnerMap, companyMap, accountCoefficientRows, deals69, deals79, remarkDeals, callsItems, disciplineItems, opuItems, managementItems, auditEvalItems, list115PartnerByElementId, lastUserMap, fotDbItems
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        queueSharedCacheSync(payload);
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
    bitrixPortalBase = snapshot.bitrixPortalBase || '';
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
    auditEvalItems = snapshot.auditEvalItems || [];
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
    const requestedMonth = getSelectedMonth();
    const refreshBtn = document.getElementById('refreshBtn');
    const cached = !forceRefresh ? loadCache() : null;
    const hasCachedData = Array.isArray(cached?.deals69) && cached.deals69.length > 0;
    const hasVisibleRows = matrixRows.length > 0;
    const cachedHasPortalBase = Boolean(cached?.bitrixPortalBase);
    const cachedMonth = normalizeSelectedMonth(cached?.selectedMonth || '');
    const cachedMatchesMonth = cachedMonth === requestedMonth;
    if (refreshBtn) refreshBtn.disabled = true;
    const originalRefreshText = refreshBtn?.textContent || 'Обновить данные';

    if (hasCachedData && cachedMatchesMonth) {
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
        if (!hasCachedData && !hasVisibleRows) {
            showLoader(true, 'Загрузка данных с сервера...', 15);
        }
        if (forceRefresh) {
            clocksterMetricsCache = {};
            try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
        }
        const managementReportPromise = fetchManagementReport(getManagementMonthForSelection(requestedMonth))
            .catch(error => {
                console.warn('fetchManagementReport failed:', error?.message || error);
                return { rows: [] };
            });
        const bootstrap = await fetchBootstrapData(forceRefresh);
        const managementReport = await managementReportPromise;

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
            managementItems: Array.isArray(managementReport?.rows) ? managementReport.rows : (bootstrap.managementItems || []),
            timestamp: Date.now(),
            selectedMonth: requestedMonth,
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
    if (Object.hasOwn(patch, 'auditEvalItems')) auditEvalItems = patch.auditEvalItems;
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
    if (Object.hasOwn(patch, 'bitrixPortalBase')) bitrixPortalBase = patch.bitrixPortalBase;
    if (Object.hasOwn(patch, 'expandedMatrixGroups')) expandedMatrixGroups = patch.expandedMatrixGroups;
    if (Object.hasOwn(patch, 'managementRowsByPartner')) managementRowsByPartner = patch.managementRowsByPartner;
    if (Object.hasOwn(patch, 'managementSummaryByPartner')) managementSummaryByPartner = patch.managementSummaryByPartner;
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
        auditEvalItems: [],
        fotDbItems: [],
        partnerMap: {},
        companyMap: {},
        accountCoefficientRows: [],
        lastUserMap: {},
        list115PartnerByElementId: {},
        clocksterMetricsByPartner: {},
        clocksterMetricsCache: {},
        managementRowsByPartner: {},
        managementSummaryByPartner: {},
        bitrixPortalBase: '',
        partnersData: {},
        remarkMetricsByPartner: {},
        auditCountsByPartner: {},
        expandedMatrixGroups: {
            relations: false,
            finance: false,
            operations: false
        }
    });
    callsByPartner = {};
    opuByPartner = {};
    auditEvalByPartner = {};
    fotTriggerDealsByPartner = {};
    disciplineStatsByPartner = {};
    managementScoresByPartner = {};
    managementRowsByPartner = {};
    managementSummaryByPartner = {};
    remarkMetricsByPartner = {};
    auditCountsByPartner = {};
    accountCoeffStatsByPartner = {};
    opuComplexityStatsByPartner = {};
    leagueAggregates = { rows: [], totals: {}, partnerCount: 0 };
    fotDbStatsByPartnerMonth = {};
    fotDbPartnerLookup = {};
    selectedExamplePartnerId = '';
    lastRenderedTimestamp = 0;
    expandedMatrixGroups = {
        relations: false,
        finance: false,
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
    getRemarksPenaltyPerObject,
    getRemarkSeverityWeight,
    getAuditQ,
    getRealizationQ,
    getTrainingQ,
    getDisciplineQ,
    getUpravlenkaQ,
    getManagementMarginQ,
    getManagementRowsForPartner: pid => (managementRowsByPartner[String(pid)] || []).map(row => ({ ...row })),
    getManagementSummaryForPartner: pid => ({ ...(managementSummaryByPartner[String(pid)] || {}) }),
    getClocksterQ,
    buildClocksterMetrics,
    getRoundsQ,
    getBudgetQ,
    computeAuditItemScore,
    getUmsPercentQ,
    getCleanShareQ,
    getPositiveReviewBonus,
    buildLeagueAggregates,
    getPartnerLeagueCoeff,
    getPartnerLeague,
    getPartnerCity,
    normalizeMonthKeyValue,
    getMatrixRowsSnapshot: () => matrixRows.map(row => ({ ...row }))
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DASHBOARD_TEST_API;
}

if (typeof window !== 'undefined') {
    window.DashboardApp = {
        loadDashboard,
        renderFromSnapshot,
        setupMonthSelect,
        getMatrixRowsSnapshot: () => matrixRows.map(row => ({ ...row })),
        formatPercent,
        formatMetricNumber,
        formatMoneyShort,
        formatMonthLabel,
        escapeHtml
    };
}

// ——— Запуск ———

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    document.getElementById('refreshBtn')?.addEventListener('click', () => loadDashboard({ forceRefresh: true }));
    document.getElementById('monthSelect')?.addEventListener('change', () => {
        loadDashboard();
    });

    window.addEventListener('load', () => {
        if (!document.getElementById('matrixBody') && !document.body?.dataset?.dashboardAutoload) return;
        setupMonthSelect();
        loadDashboard();
    });
}
