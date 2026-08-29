const test = require('node:test');
const assert = require('node:assert/strict');

const dashboard = require('../dashboard.js');
const originalDocument = global.document;

function daysAgo(days) {
    const value = new Date();
    value.setDate(value.getDate() - days);
    return value.toISOString();
}

test.beforeEach(() => {
    dashboard.resetTestState();
    global.document = originalDocument;
});

test.after(() => {
    global.document = originalDocument;
});

test('calculateRemarkPenalty считает штраф по замечаниям без искусственного капа', () => {
    assert.equal(dashboard.calculateRemarkPenalty(daysAgo(1), null), 0);
    assert.equal(dashboard.calculateRemarkPenalty(daysAgo(4), null), 0);
    assert.equal(dashboard.calculateRemarkPenalty('2026-03-01', '2026-03-05'), 0.1);
    assert.equal(dashboard.calculateRemarkPenalty('2026-03-01', '2026-03-25'), 1.1);
});

test('calculateRemarkPenalty считает по excel-логике Q - (P + 2) и игнорирует время внутри суток', () => {
    assert.equal(
        dashboard.calculateRemarkLateDays('2026-03-01T23:59:59+05:00', '2026-03-04T00:01:00+05:00'),
        1
    );
    assert.equal(
        dashboard.calculateRemarkPenalty('2026-03-01T23:59:59+05:00', '2026-03-04T00:01:00+05:00'),
        0.05
    );
    assert.equal(
        dashboard.calculateRemarkLateDays('2026-03-01T10:00:00+05:00', '2026-03-03T09:00:00+05:00'),
        0
    );
});

test('месячный фильтр показывает только наступившие месяцы в диапазоне март 2026 — март 2027', () => {
    const months = dashboard.getAllowedReportingMonths(new Date('2026-04-30T12:00:00+05:00'));
    assert.equal(months[0], '2026-03');
    assert.equal(months.at(-1), '2026-04');
    assert.deepEqual(months, ['2026-03', '2026-04']);
    assert.deepEqual(
        dashboard.getAllowedReportingMonths(new Date('2026-05-01T00:00:00+05:00')),
        ['2026-03', '2026-04', '2026-05']
    );
    assert.equal(dashboard.getAllowedReportingMonths(new Date('2027-04-01T12:00:00+05:00')).at(-1), '2027-03');
    assert.equal(dashboard.normalizeSelectedMonth('all'), 'summary');
    assert.equal(dashboard.normalizeSelectedMonth('2024-03', new Date('2026-04-30T12:00:00+05:00')), '2026-03');
    assert.equal(dashboard.normalizeSelectedMonth('2027-04', new Date('2026-04-30T12:00:00+05:00')), '2026-03');
    assert.equal(dashboard.normalizeSelectedMonth('2026-11', new Date('2026-04-30T12:00:00+05:00')), '2026-03');
    assert.equal(dashboard.normalizeSelectedMonth('2026-04', new Date('2026-04-30T12:00:00+05:00')), '2026-04');
});

test('дефолтный месяц — предыдущий, но в пределах отчетного диапазона', () => {
    assert.equal(dashboard.getDefaultMonthSelection(new Date('2026-04-01T12:00:00+05:00')), '2026-03');
    assert.equal(dashboard.getDefaultMonthSelection(new Date('2026-03-20T12:00:00+05:00')), '2026-03');
});

test('extractDealMonthKey для 69/79 приоритетно берет Месяц начисления', () => {
    const monthKey = dashboard.extractDealMonthKey({
        UF_CRM_1707145268405: '2026-03-01T00:00:00+03:00',
        DATE_CREATE: '2026-04-15T10:00:00+03:00',
        CLOSEDATE: '2026-04-20T03:00:00+03:00'
    }, ['CLOSEDATE', 'DATE_CREATE']);

    assert.equal(monthKey, '2026-03');
});

test('ФОТ для выбранного марта берет март в БД напрямую', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    assert.deepEqual(dashboard.getFotDbMonthsForSelection(), ['2026-03']);
});

test('getCallsQ считает среднее по числам и Да/Нет', () => {
    dashboard.applyTestState({
        callsItems: [
            {
                UF_CRM_173_PARTNER: 'partner-1',
                UF_CRM_173_1771396927: '3',
                UF_CRM_173_1771397355616: 'Да',
                UF_CRM_173_1771397383665: 'Нет',
                UF_CRM_173_1771398356499: '2'
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('partner-1'), 2 / 3);
});

test('getCallsQ считает enum ID Bitrix, а не только текстовые значения', () => {
    dashboard.applyTestState({
        callsItems: [
            {
                ufCrm173Partner: '2362033',
                ufCrm173_1771396927: 141219,
                ufCrm173_1771397355616: 141221,
                ufCrm173_1771397383665: 141225,
                ufCrm173_1771398284442: 141229,
                ufCrm173_1771398356499: 141237
            },
            {
                ufCrm173Partner: '2362033',
                ufCrm173_1771396927: 141219,
                ufCrm173_1771397355616: 141221,
                ufCrm173_1771397383665: 141225,
                ufCrm173_1771398284442: 141229,
                ufCrm173_1771398356499: 141235
            },
            {
                ufCrm173Partner: '2362033',
                ufCrm173_1771396927: 141217,
                ufCrm173_1771397383665: 141225,
                ufCrm173_1771398284442: 141229,
                ufCrm173_1771398356499: 141237
            }
        ]
    });

    dashboard.buildIndexes();

    assert.ok(Math.abs(dashboard.getCallsQ('2362033') - (20 / 21)) < 1e-12);
});

test('getCallsMetricDetail поясняет формулу расчета обзвона', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ],
        callsItems: [
            {
                UF_CRM_173_PARTNER: 'p1',
                UF_CRM_173_1771396927: '3',
                UF_CRM_173_1771397355616: 'Да',
                UF_CRM_173_1771397383665: 'Нет',
                UF_CRM_173_1771398284442: 'Да',
                UF_CRM_173_1771398356499: '2'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.equal(row.details.calls.sub, '11/15');
    assert.deepEqual(row.details.calls.calcLines, [
        'Формула: 11 баллов / 5 ответов = 2.2',
        '2.2 / 3 = 73%'
    ]);
});

test('buildIndexes считает дисциплины и берет последний балл управленки за партнера', () => {
    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Партнер 1',
            'p2': 'Партнер 2'
        },
        disciplineItems: [
            { UF_CRM_173_NOPARTNER: ['p1'] },
            { UF_CRM_173_NOPARTNER: [] }
        ],
        managementItems: [
            {
                UF_CRM_127_1756273714: 'p1',
                UF_CRM_127_MGMT_SCORE: '0.35',
                UPDATED_TIME: '2026-03-01T10:00:00+03:00'
            },
            {
                UF_CRM_127_1756273714: 'p1',
                UF_CRM_127_MGMT_SCORE: '0.8',
                UPDATED_TIME: '2026-03-03T10:00:00+03:00'
            },
            {
                UF_CRM_127_1756273714: 'p2',
                UF_CRM_127_MGMT_SCORE: '0.5',
                UPDATED_TIME: '2026-03-02T10:00:00+03:00'
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getDisciplineQ('p1'), 0.5);
    assert.equal(dashboard.getDisciplineQ('p2'), 1.0);
    assert.equal(dashboard.getUpravlenkaQ('p1'), 0.8);
    assert.equal(dashboard.getUpravlenkaQ('p2'), 0.5);
});

test('buildIndexes читает управленку из Marja_full по названию компании', () => {
    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Defacto Retail Store Kz TOO',
            'p2': 'Евразийский Банк АО'
        },
        managementItems: [
            {
                external_id: 115589,
                'Название': 'Defacto Retail Store Kz TOO',
                'Наименовение_компании_1': 'Defacto Retail Store Kz TOO',
                'Месяц_начисления': '2026-03-31T19:00:00.000Z',
                'Реализация без НДС': 147442,
                'Маржа Партнера': 117298,
                'Расходы ИП': '30144.14',
                'Маржа': 0.7955525819854821
            },
            {
                external_id: 115590,
                'Название': 'Defacto Retail Store Kz TOO',
                'Наименовение_компании_1': 'Defacto Retail Store Kz TOO',
                'Месяц_начисления': '2026-03-31T19:00:00.000Z',
                'Реализация без НДС': 100000,
                'Маржа Партнера': 70000,
                'Расходы ИП': '30000',
                'Маржа': 0.7
            },
            {
                external_id: 115591,
                'Название': 'Евразийский Банк АО',
                'Наименовение_компании_1': 'Евразийский Банк АО',
                'Месяц_начисления': '2026-03-31T19:00:00.000Z',
                'Реализация без НДС': 200000,
                'Маржа Партнера': 120000,
                'Расходы ИП': '80000',
                'Маржа': 0.6
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getUpravlenkaQ('p1'), 0);
    assert.equal(dashboard.getUpravlenkaQ('p2'), 0);
    assert.equal(dashboard.getManagementRowsForPartner('p1').length, 2);
    assert.equal(dashboard.getManagementSummaryForPartner('p1').rowCount, 2);
    assert.ok(dashboard.getManagementSummaryForPartner('p1').revenueNetSum > 0);
    assert.ok(Math.abs(dashboard.getManagementSummaryForPartner('p1').marginShare - ((117298 + 70000) / (147442 + 100000))) < 1e-12);
});

test('buildIndexes считает Marja_full как Power BI: сумма маржи партнера / сумма реализации без НДС', () => {
    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Партнер'
        },
        managementItems: [
            {
                'Ответственное_лицо_ИП_инфо': 'Партнер',
                'Месяц_начисления': '2026-03-31T19:00:00.000Z',
                'Реализация без НДС': 1000,
                'Маржа Партнера': 900,
                'Маржа': 0.9
            },
            {
                'Ответственное_лицо_ИП_инфо': 'Партнер',
                'Месяц_начисления': '2026-03-31T19:00:00.000Z',
                'Реализация без НДС': 9000,
                'Маржа Партнера': -4500,
                'Маржа': -0.5
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getManagementSummaryForPartner('p1').rowCount, 2);
    assert.equal(dashboard.getManagementSummaryForPartner('p1').marginShare, -0.36);
    assert.equal(dashboard.getManagementSummaryForPartner('p1').managementPoints, 8);
    assert.equal(dashboard.getUpravlenkaQ('p1'), 0.8);
});

test('управленка переводит Маржа % в Q по шкале CurrentRate', () => {
    assert.equal(dashboard.getManagementMarginQ(-0.01), 0.8);
    assert.equal(dashboard.getManagementMarginQ(0), 0.9);
    assert.equal(dashboard.getManagementMarginQ(0.04), 0.9);
    assert.equal(dashboard.getManagementMarginQ(0.0401), 1);
    assert.equal(dashboard.getManagementMarginQ(0.1199), 1);
    assert.equal(dashboard.getManagementMarginQ(0.12), 0.7);
    assert.equal(dashboard.getManagementMarginQ(0.2), 0.5);
    assert.equal(dashboard.getManagementMarginQ(0.3), 0.3);
    assert.equal(dashboard.getManagementMarginQ(0.4), 0.1);
    assert.equal(dashboard.getManagementMarginQ(0.5), 0);
});

test('buildIndexes связывает Marja_full по ответственному лицу ИП', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-04' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Айткулова А.'
        },
        managementItems: [
            {
                external_id: 705699,
                'Название': 'Школа Нового Поколения NGS',
                'Наименовение_компании_1': 'Школа Нового Поколения NGS',
                'Ответственное_лицо_ИП_инфо': 'Айткулова А.',
                '__month_key': '2026-03',
                'Месяц_начисления': '2026-02-28T19:00:00.000Z',
                'Реализация без НДС': 100000,
                'Маржа Партнера': 85000,
                'Расходы ИП': 15000,
                'Маржа': 0.85
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getManagementRowsForPartner('p1').length, 1);
    assert.equal(dashboard.getManagementSummaryForPartner('p1').rowCount, 1);
    assert.equal(dashboard.getManagementSummaryForPartner('p1').managementPoints, 0);
    assert.equal(dashboard.getUpravlenkaQ('p1'), 0);
});

test('buildIndexes для управленки берет предыдущий месяц начисления', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-05' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Айткулова А.'
        },
        managementItems: [
            {
                external_id: 1,
                'Ответственное_лицо_ИП_инфо': 'Айткулова А.',
                'Месяц_начисления': '2026-04-15T00:00:00.000Z',
                'Реализация без НДС': 100000,
                'Маржа': 0.7
            },
            {
                external_id: 2,
                'Ответственное_лицо_ИП_инфо': 'Айткулова А.',
                'Месяц_начисления': '2026-05-01T00:00:00.000Z',
                period: '2026-05',
                'Реализация без НДС': 100000,
                'Маржа': 0.2
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getManagementRowsForPartner('p1').length, 1);
    assert.equal(dashboard.getManagementSummaryForPartner('p1').managementPoints, 0);
    assert.equal(dashboard.getManagementRowsForPartner('p1')[0].monthKey, '2026-04');
    assert.equal(dashboard.getUpravlenkaQ('p1'), 0);
});

test('discipline ручные ограничения режут итоговый Q для конкретных партнеров', () => {
    dashboard.applyTestState({
        partnerMap: {
            '2362011': 'Ильиных Татьяна',
            '2362009': 'Илиясов Р.',
            '3370865': 'Туймебеков Б.'
        },
        disciplineItems: [
            { UF_CRM_173_NOPARTNER: ['3370865'] }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getDisciplineQ('2362011'), 0.2);
    assert.equal(dashboard.getDisciplineQ('2362009'), 0.8);
    assert.equal(dashboard.getDisciplineQ('3370865'), 0);
});

test('getRemarksQ считает накопительный штраф как 1 минус сумма просрочек', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            {
                UF_CRM_1743669674: 'p1'
            }
        ],
        remarkDeals: [
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-05',
                UF_CRM_1719824872888: '43607'
            },
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-20',
                UF_CRM_1719824872888: '43607'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.ok(Math.abs(dashboard.getRemarksQ('p1') - 0.05) < 1e-12);
});

test('getRemarksQ нормирует штраф на реальный портфель партнера (замена смягчения по объему)', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1',
            p2: 'Партнер 2'
        },
        // У p1 портфель 10 объектов, у p2 — 1 объект. Абсолютный штраф одинаковый (10 замечаний
        // × 0.05 = 0.5), но на объект он делится по-разному — большой портфель прощает больше.
        deals69: [
            ...Array.from({ length: 10 }, () => ({ UF_CRM_1743669674: 'p1' })),
            { UF_CRM_1743669674: 'p2' }
        ],
        remarkDeals: [
            ...Array.from({ length: 10 }, () => ({
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-04',
                UF_CRM_1719824872888: '43607'
            })),
            ...Array.from({ length: 10 }, () => ({
                UF_CRM_1743669674: 'p2',
                DATE_CREATE: '2026-03-10',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-04',
                UF_CRM_1719824872888: '43607'
            }))
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    // p1: штраф 0.5 / портфель 10 = 0.05 на объект → Q = 0.95
    assert.equal(dashboard.getRemarksQ('p1'), 0.95);
    // p2: тот же абсолютный штраф 0.5 / портфель 1 = 0.5 на объект → Q = 0.5
    assert.equal(dashboard.getRemarksQ('p2'), 0.5);
    assert.ok(dashboard.getRemarksQ('p1') > dashboard.getRemarksQ('p2'));
});

test('getRemarkSeverityWeight суммирует веса по разметке заказчика (крит=4/выс=3/средн=2/низк=1/план=0)', () => {
    assert.equal(dashboard.getRemarkSeverityWeight('43449'), 4); // Отсутствие ОПУ на объекте — Критический
    assert.equal(dashboard.getRemarkSeverityWeight('43437'), 3); // Качество уборки — Высокий
    assert.equal(dashboard.getRemarkSeverityWeight('43435'), 2); // УМС/РМ — Средний
    assert.equal(dashboard.getRemarkSeverityWeight('43439'), 1); // Инвентарь/оборудование — Низкий
    assert.equal(dashboard.getRemarkSeverityWeight('44867'), 0); // Несоответствие плановым работам — Плановый
    // Несколько типов сразу — сумма весов (подтверждено заказчиком).
    assert.equal(dashboard.getRemarkSeverityWeight(['43449', '43437']), 7); // 4 + 3
    // Пустое поле — 0 (штрафуем только за просрочку, не выдумываем тяжесть).
    assert.equal(dashboard.getRemarkSeverityWeight(null), 0);
    assert.equal(dashboard.getRemarkSeverityWeight([]), 0);
    // Неизвестный ID типа — считаем как "Прочее" (Средний, вес 2).
    assert.equal(dashboard.getRemarkSeverityWeight('99999999'), 2);
});

test('getRemarksQ учитывает тяжесть замечания (Тип отзыва/замечания), а не только просрочку', () => {
    dashboard.applyTestState({
        partnerMap: { p1: 'Партнер 1', p2: 'Партнер 2' },
        deals69: [
            { UF_CRM_1743669674: 'p1' },
            { UF_CRM_1743669674: 'p2' }
        ],
        remarkDeals: [
            // p1: критическое замечание (вес 4), устранено день в день (0 просрочки).
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-01',
                UF_CRM_1719824872888: '43607',
                UF_CRM_1716804677915: '43449'
            },
            // p2: плановое замечание (вес 0), тоже без просрочки — штрафа быть не должно.
            {
                UF_CRM_1743669674: 'p2',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-01',
                UF_CRM_1719824872888: '43607',
                UF_CRM_1716804677915: '44867'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    // p1: штраф = 0 (просрочка) + 4 × 0.05 = 0.2, портфель 1 → Q = 0.8
    assert.equal(dashboard.getRemarksQ('p1'), 0.8);
    // p2: штраф = 0 + 0 × 0.05 = 0, портфель 1 → Q = 1
    assert.equal(dashboard.getRemarksQ('p2'), 1);
});

test('getRemarksQ не уходит в минус и зажимается в диапазон 0..1', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            {
                UF_CRM_1743669674: 'p1'
            }
        ],
        remarkDeals: [
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-04-20',
                UF_CRM_1719824872888: '43607'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.equal(dashboard.getRemarksQ('p1'), 0);
});

test('замечания попадают в месяц по DATE_CREATE, даже если обратная связь позже', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ],
        remarkDeals: [
            {
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-01T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-02-17',
                UF_CRM_FITBACK: '2026-03-04',
                UF_CRM_1719824872888: '43607'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.equal(dashboard.getRemarksQ('p1'), 0.35);
});

test('замечание без FITBACK не штрафуется', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ],
        remarkDeals: [
            {
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-16T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-16'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.equal(dashboard.getRemarksQ('p1'), 1);
});

test('getTrainingQ — заглушка Q=1.0 (новая методика считает % от общего штата, которого пока нет в данных)', () => {
    dashboard.applyTestState({
        opuItems: [
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-31T10:00:00+03:00', UF_CRM_KASJD12: '4' },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-31T10:00:00+03:00', UF_CRM_KASJD12: '5' }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getTrainingQ('p1'), 1.0);
    assert.equal(dashboard.getTrainingQ('p-без-данных'), 1.0);
});

test('getTrainingMetricDetail считает прошедших по количеству людей, а не по числу записей', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Калиаскар Б.'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ],
        opuItems: [
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-05T10:00:00+03:00', UF_CRM_KASJD12: '7.73', UF_CRM_127_1756291224885: 6 },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-10T10:00:00+03:00', UF_CRM_KASJD12: '8.21', UF_CRM_127_1756291224885: 4 },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-15T10:00:00+03:00', UF_CRM_KASJD12: '9.67', UF_CRM_127_1756291224885: 10 },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-20T10:00:00+03:00', UF_CRM_KASJD12: '4.63', UF_CRM_127_1756291224885: 4 }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.details.training.sub, '24 прошли');
    assert.equal(row.details.training.title.includes('Прошли обучение: 24'), true);
});

test('getTrainingQ без данных всё равно ставит заглушку 1.0', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ],
        opuItems: []
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.applyTestState({
        bitrixPortalBase: 'https://portal.example.bitrix24.kz'
    });
    dashboard.buildMatrixRows();

    assert.equal(dashboard.getTrainingQ('p1'), 1.0);
    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.equal(row.details.training.sub, '0 прошли');
});

test('getRealizationQ считает ФОТ как выплаты людям к 60% суммы договоров', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            '3421309': 'Токенова Сара'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: '3421309', UF_CRM_1707145268405: '2026-03-01T00:00:00+03:00', OPPORTUNITY: '4000000' },
            { ID: 'd2', UF_CRM_1743669674: '3421309', UF_CRM_1707145268405: '2026-03-10T00:00:00+03:00', OPPORTUNITY: '6000000' },
            { ID: 'd3', UF_CRM_1743669674: '3421309', UF_CRM_1707145268405: '2026-02-10T00:00:00+03:00', OPPORTUNITY: '6000000' }
        ],
        fotDbItems: [
            { partner_id: 1794, partner_name: 'Токенова Сара', period_label: 'Март 2026', payments_count: 2, total_amount: '3000000' },
            { partner_id: 1794, partner_name: 'Токенова Сара', period_label: 'Февраль 2026', payments_count: 1, total_amount: '6000000' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.equal(dashboard.getRealizationQ('3421309'), 0.5);
});

test('getRealizationQ дает 100%, когда выплаты достигли 60% суммы договоров', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1', UF_CRM_1707145268405: '2026-03-01', OPPORTUNITY: '10000000' }
        ],
        fotDbItems: [
            { partner_id: 1, partner_name: 'Партнер 1', period_label: 'Март 2026', payments_count: 1, total_amount: '6000000' }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getRealizationQ('p1'), 1);
});

test('getRealizationQ зажимает ФОТ на 100%, а в деталях показывает превышение', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-04' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            '3421309': 'Токенова Сара'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: '3421309', UF_CRM_1707145268405: 'Апрель 2026', OPPORTUNITY: '10000000' }
        ],
        fotDbItems: [
            { partner_id: 1794, partner_name: 'Токенова Сара', period_label: 'Апрель 2026', payments_count: 3, total_amount: '9000000' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.applyTestState({
        bitrixPortalBase: 'https://portal.example.bitrix24.kz'
    });
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === '3421309');
    assert.ok(row);
    // «Реализация» больше не входит в q/итог — справочный показатель realizationQ.
    assert.equal(row.realizationQ, 1);
    assert.equal(row.details.realization.displayValue, 1);
    assert.equal(row.details.realization.sub, '9.0м / 6.0м');
    assert.match(row.details.realization.title, /выполнение: 150%/);
});

test('69 не режется фильтром месяца и остается базой объектов', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        deals69: [
            { UF_CRM_1707145268405: '2026-03-10' },
            { UF_CRM_1707145268405: '2026-03-25' },
            { UF_CRM_1707145268405: '2026-02-11' }
        ]
    });

    assert.equal(dashboard.getFilteredDeals69().length, 3);
});

test('фильтр месяца режет обзвон и обучение по выбранному месяцу', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        callsItems: [
            {
                ufCrm173Partner: 'p1',
                createdTime: '2026-03-05T10:00:00+03:00',
                ufCrm1731775114484085: '2026-03-04T10:00:00+03:00',
                ufCrm173_1771396927: 141219
            },
            {
                ufCrm173Partner: 'p1',
                createdTime: '2026-02-05T10:00:00+03:00',
                ufCrm1731775114484085: '2026-02-04T10:00:00+03:00',
                ufCrm173_1771396927: 141215
            }
        ],
        opuItems: [
            {
                UF_CRM_127_1756273714: 'p1',
                UF_CRM_127_1756290422310: '03',
                CREATED_TIME: '2026-03-31T11:18:34+03:00',
                UF_CRM_KASJD12: '5'
            },
            {
                UF_CRM_127_1756273714: 'p1',
                UF_CRM_127_1756290422310: '02',
                CREATED_TIME: '2026-02-01T11:18:34+03:00',
                UF_CRM_KASJD12: '1'
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 2 / 3);
    // getTrainingQ — заглушка Q=1.0 (см. план перехода на новую матрицу), сама фильтрация
    // по месяцу для opuByPartner проверяется через getTrainingMetricDetail в других тестах.
    assert.equal(dashboard.getTrainingQ('p1'), 1.0);
});

test('обзвон фильтруется только по полю даты обзвона', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        callsItems: [
            {
                ufCrm173Partner: 'p1',
                UF_CRM_1707145268405: '2026-04-01T00:00:00+03:00',
                createdTime: '2026-04-05T10:00:00+03:00',
                ufCrm1731775114484085: '2026-03-20T12:00:00+03:00',
                ufCrm173_1771396927: 141219
            },
            {
                ufCrm173Partner: 'p1',
                UF_CRM_1707145268405: '2026-03-01T00:00:00+03:00',
                createdTime: '2026-03-05T10:00:00+03:00',
                ufCrm1731775114484085: '2026-01-20T12:00:00+03:00',
                ufCrm173_1771396927: 141215
            },
            {
                ufCrm173Partner: 'p1',
                UF_CRM_1707145268405: '2026-03-01T00:00:00+03:00',
                createdTime: '2026-03-05T10:00:00+03:00',
                ufCrm173_1771396927: 141215
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 1);
});

test('Общий свод берет только наступившие месяцы в диапазоне отчета', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: 'summary' };
            return null;
        }
    };

    dashboard.applyTestState({
        callsItems: [
            { ufCrm173Partner: 'p1', ufCrm1731775114484085: '2026-03-05T10:00:00+03:00', ufCrm173_1771396927: 141219 },
            { ufCrm173Partner: 'p1', ufCrm1731775114484085: '2027-02-05T10:00:00+03:00', ufCrm173_1771396927: 141217 },
            { ufCrm173Partner: 'p1', ufCrm1731775114484085: '2025-12-05T10:00:00+03:00', ufCrm173_1771396927: 141215 }
        ],
        opuItems: [
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-31T11:18:34+03:00', UF_CRM_KASJD12: '5' },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2027-03-31T11:18:34+03:00', UF_CRM_KASJD12: '3' },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '11', CREATED_TIME: '2025-11-01T00:00:00+03:00', UF_CRM_KASJD12: '1' }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 1);
    assert.equal(dashboard.getTrainingQ('p1'), 1.0); // заглушка новой методики
});

test('в марте обзвон захватывает еще и февраль', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        callsItems: [
            { ufCrm173Partner: 'p1', ufCrm1731775114484085: '2026-02-15T10:00:00+03:00', ufCrm173_1771396927: 141215 },
            { ufCrm173Partner: 'p1', ufCrm1731775114484085: '2026-03-15T10:00:00+03:00', ufCrm173_1771396927: 141219 },
            { ufCrm173Partner: 'p1', ufCrm1731775114484085: '2026-04-15T10:00:00+03:00', ufCrm173_1771396927: 141217 }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 2 / 3);
});

test('audit временно обнулен для всех', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ],
        remarkDeals: [
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_1719824872888: '43609',
                UF_CRM_1732104149680: '2026-03-05'
            },
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_1719824872888: 'От аудитора замечание',
                UF_CRM_1732104149680: '2026-03-07',
                UF_CRM_FITBACK: '2026-04-01'
            },
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_1719824872888: '43713',
                UF_CRM_1732104149680: '2026-03-09'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    // Чек-лист аудита (45 критериев) будет отдельным приложением — пока источника нет,
    // getAuditQ нейтрален (Q=1.0), а не штрафует (было 0 в старой методике).
    assert.equal(dashboard.getAuditQ('p1'), 1.0);
});

test('audit — нейтральная заглушка, не штрафует и не premium-ит итог', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1' }
        ],
        callsItems: [
            { ufCrm173Partner: 'p1', createdTime: '2026-03-05T10:00:00+03:00', ufCrm173_1771396927: 141219 }
        ],
        remarkDeals: [
            { UF_CRM_1743669674: 'p1', UF_CRM_1719824872888: '43609', UF_CRM_1732104149680: '2026-03-05' },
            { UF_CRM_1743669674: 'p1', UF_CRM_1719824872888: '43609', UF_CRM_1732104149680: '2026-03-07' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.applyTestState({
        bitrixPortalBase: 'https://portal.example.bitrix24.kz'
    });
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.q.audit, 1.0);
    // Итог = сумма блоков + бонус за отзывы, без отдельного штрафа по аудиту.
    assert.equal(row.matrixTotalScore, Math.round((row.rawTotal + row.positiveReviewBonus) * 100) / 100);
});

test('итог считается от отображаемых суммы и коэффициента, а не от скрытых дробей', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        companyMap: {
            c1: 'Kaspi bank AO'
        },
        lastUserMap: {
            u1: 'Арайлым Ташенова'
        },
        accountCoefficientRows: [
            { responsible: 'Арайлым Ташенова', company: 'Kaspi bank AO', coeff: 0.9876509, status: null }
        ],
        deals69: [
            { ID: 'd1', COMPANY_ID: 'c1', ASSIGNED_BY_ID: 'u1', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '100' }
        ],
        callsItems: [
            {
                UF_CRM_173_PARTNER: 'p1',
                UF_CRM_173_1771396927: '3',
                UF_CRM_173_1771397355616: 'Да',
                UF_CRM_173_1771397383665: 'Да',
                UF_CRM_173_1771398284442: 'Да',
                UF_CRM_173_1771398356499: '3'
            }
        ],
        clocksterMetricsByPartner: {
            p1: { visits: 1, hours: 1, uniqueObjects: 1 }
        }
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);

    // Новая методика: лига/коэффициент больше НЕ умножает итог — только сумма блоков + бонус.
    const expectedTotal = Math.round((row.rawTotal + row.positiveReviewBonus) * 100) / 100;
    assert.equal(row.matrixTotalScore, expectedTotal);
    assert.ok(['Бриллиант', 'Изумруд', 'Золото'].includes(row.league));
});

test('extractTrainingMonthKey уважает номер месяца и корректно переживает переход года', () => {
    assert.equal(dashboard.extractTrainingMonthKey({
        UF_CRM_127_1756290422310: '03',
        CREATED_TIME: '2026-03-31T11:18:34+03:00',
        UPDATED_TIME: '2026-04-01T13:22:29+03:00'
    }), '2026-03');

    assert.equal(dashboard.extractTrainingMonthKey({
        UF_CRM_127_1756290422310: '01',
        CREATED_TIME: '2025-12-31T22:00:01+03:00',
        UPDATED_TIME: '2026-01-19T12:08:52+03:00'
    }), '2026-01');
});

test('матрица по умолчанию показывает только группы и раскрывает детали по кнопке', () => {
    let columns = dashboard.getVisibleMatrixColumns();
    assert.deepEqual(columns.map(column => column.label), ['Партнер', 'Операционка', 'Финансы', 'Отношения', 'Сумма', 'Бонус', 'Лига', 'Итог']);

    dashboard.applyTestState({
        expandedMatrixGroups: {
            relations: true,
            finance: false,
            operations: true
        }
    });

    columns = dashboard.getVisibleMatrixColumns();
    assert.deepEqual(columns.map(column => column.label), [
        'Партнер',
        'Операционка',
        'Регистрация/отметка',
        'Объезды',
        'Обучение',
        'Финансы',
        'Отношения',
        'Обзвон (CSAT)',
        'Аудит',
        'Замечания',
        'Без замечаний',
        'Сумма',
        'Бонус',
        'Лига',
        'Итог'
    ]);
});

test('buildClocksterMetrics не удваивает визит на одном объекте в один день, считает часы и уникальные объекты', () => {
    const metrics = dashboard.buildClocksterMetrics([
        {
            user: { id: 578019 },
            dates: {
                '2026-03-10': {
                    attendance: [
                        { status: 1, datetime: '2026-03-10T09:00:00+05:00', location: { id: 'obj-1', title: 'Obj 1' } },
                        { status: 0, datetime: '2026-03-10T18:00:00+05:00', location: { id: 'obj-1', title: 'Obj 1' } }
                    ]
                }
            }
        },
        {
            user: { id: 558252 },
            dates: {
                '2026-03-10': {
                    attendance: [
                        { status: 1, datetime: '2026-03-10T09:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } },
                        { status: 0, datetime: '2026-03-10T12:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } },
                        { status: 1, datetime: '2026-03-10T13:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } },
                        { status: 0, datetime: '2026-03-10T15:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } }
                    ]
                },
                '2026-03-11': {
                    attendance: [
                        { status: 1, datetime: '2026-03-11T09:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } },
                        { status: 0, datetime: '2026-03-11T11:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } },
                        { status: 1, datetime: '2026-03-11T12:00:00+05:00', location: { id: 'obj-3', title: 'Obj 3' } },
                        { status: 0, datetime: '2026-03-11T14:00:00+05:00', location: { id: 'obj-3', title: 'Obj 3' } },
                        { status: 0, datetime: '2026-03-11T18:00:00+05:00', location: { id: 'obj-4', title: 'Obj 4' } }
                    ]
                }
            }
        }
    ]);

    assert.deepEqual(metrics['3370865'], { visits: 1, checks: 2, hours: 9, uniqueObjects: 1, objectIds: ['obj-1'], locationKeys: ['obj1'] });
    assert.deepEqual(metrics['2361999'], { visits: 3, checks: 9, hours: 10, uniqueObjects: 2, objectIds: ['obj-2', 'obj-3'], locationKeys: ['obj2', 'obj3'] });
});

test('buildClocksterMetrics суммирует чеки партнера и куратора для одного партнера', () => {
    const metrics = dashboard.buildClocksterMetrics([
        {
            user: { id: 559053 },
            dates: {
                '2026-03-10': {
                    attendance: [
                        { status: 1, datetime: '2026-03-10T09:00:00+05:00', location: { id: 'obj-1', title: 'Obj 1' } },
                        { status: 0, datetime: '2026-03-10T18:00:00+05:00', location: { id: 'obj-1', title: 'Obj 1' } }
                    ]
                }
            }
        },
        {
            user: { id: 562504 },
            dates: {
                '2026-03-11': {
                    attendance: [
                        { status: 1, datetime: '2026-03-11T10:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } },
                        { status: 0, datetime: '2026-03-11T12:00:00+05:00', location: { id: 'obj-2', title: 'Obj 2' } }
                    ]
                }
            }
        },
        {
            user: { id: 573949 },
            dates: {
                '2026-03-11': {
                    attendance: [
                        { status: 1, datetime: '2026-03-11T13:00:00+05:00', location: { id: 'obj-3', title: 'Obj 3' } },
                        { status: 0, datetime: '2026-03-11T16:00:00+05:00', location: { id: 'obj-3', title: 'Obj 3' } }
                    ]
                }
            }
        }
    ]);

    assert.deepEqual(metrics['3849905'], {
        visits: 3,
        checks: 6,
        hours: 14,
        uniqueObjects: 3,
        objectIds: ['obj-1', 'obj-2', 'obj-3'],
        locationKeys: ['obj1', 'obj2', 'obj3']
    });
});

test('getClocksterQ для обычных партнеров считает дедуп по Адрес+Дата, а для особых часы', () => {
    dashboard.applyTestState({
        partnerMap: {
            '2361999': 'Бут Р.',
            '3370865': 'Туймебеков Б.'
        },
        deals69: [
            { UF_CRM_1743669674: '2361999' },
            { UF_CRM_1743669674: '2361999' },
            { UF_CRM_1743669674: '3370865' },
            { UF_CRM_1743669674: '3370865' },
            { UF_CRM_1743669674: '3370865' },
            { UF_CRM_1743669674: '3370865' }
        ],
        clocksterMetricsByPartner: {
            '2361999': { visits: 4, hours: 6, uniqueObjects: 1 },
            '3370865': { visits: 1, hours: 2, uniqueObjects: 1 }
        }
    });

    assert.equal(dashboard.getClocksterQ('2361999'), 1);
    assert.equal(dashboard.getClocksterQ('3370865'), 0.5);
});

test('getClocksterQ для Жапабаевой берет все чеки partner + curator', () => {
    dashboard.applyTestState({
        partnerMap: {
            '2362005': 'Жапабаева Б.'
        },
        deals69: Array.from({ length: 50 }, () => ({ UF_CRM_1743669674: '2362005' })),
        clocksterMetricsByPartner: {
            '2362005': { visits: 2, checks: 256, hours: 0, uniqueObjects: 1 }
        }
    });

    assert.equal(dashboard.getClocksterQ('2362005'), 1);
});

test('getClocksterQ возвращает 0, если объекты есть, а метрик Clockster нет', () => {
    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Омельченко С.'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' },
            { UF_CRM_1743669674: 'p1' },
            { UF_CRM_1743669674: 'p1' }
        ],
        clocksterMetricsByPartner: {}
    });

    assert.equal(dashboard.getClocksterQ('p1'), 0);
});

test('в Clockster кабинета выводится список не посещённых объектов за месяц', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        bitrixPortalBase: 'https://portal.example.bitrix24.kz',
        deals69: [
            {
                ID: 'd1',
                UF_CRM_1743669674: 'p1',
                TITLE: 'Alpha Market',
                UF_CRM_ACTIVE_ADDRESS: 'Кунаева 1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00'
            },
            {
                ID: 'd2',
                UF_CRM_1743669674: 'p1',
                TITLE: 'Bravo Store',
                UF_CRM_ACTIVE_ADDRESS: 'Толе би 2',
                DATE_CREATE: '2026-03-10T10:00:00+03:00'
            }
        ],
        clocksterMetricsByPartner: {
            p1: {
                visits: 1,
                hours: 1,
                uniqueObjects: 1,
                objectIds: ['alpha market'],
                locationKeys: ['alpha market']
            }
        }
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.breakdown.clockster.missedObjects.length, 1);
    assert.equal(row.breakdown.clockster.missedObjects[0].label, 'Bravo Store');
    assert.equal(row.breakdown.clockster.missedObjects[0].url, 'https://portal.example.bitrix24.kz/crm/deal/details/d2/');
});

test('Clockster подхватывает название компании, если заголовок объекта пустой или служебный', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        bitrixPortalBase: 'https://portal.example.bitrix24.kz',
        companyMap: {
            c1: 'ТОО "Гидробаланс"'
        },
        deals69: [
            {
                ID: 'd1',
                UF_CRM_1743669674: 'p1',
                COMPANY_ID: 'c1',
                TITLE: 'Объект 702655',
                DATE_CREATE: '2026-03-10T10:00:00+03:00'
            }
        ],
        clocksterMetricsByPartner: {
            p1: {
                visits: 0,
                hours: 0,
                uniqueObjects: 0,
                objectIds: [],
                locationKeys: []
            }
        }
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.breakdown.clockster.missedObjects[0].label, 'ТОО "Гидробаланс"');
});

test('Clockster различает адреса, даже если у объектов одна компания', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        bitrixPortalBase: 'https://portal.example.bitrix24.kz',
        companyMap: {
            c1: 'ТОО "Гидробаланс"'
        },
        deals69: [
            {
                ID: 'd1',
                UF_CRM_1743669674: 'p1',
                COMPANY_ID: 'c1',
                TITLE: 'Объект 702655',
                UF_CRM_ACTIVE_ADDRESS: 'Кунаева 1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00'
            },
            {
                ID: 'd2',
                UF_CRM_1743669674: 'p1',
                COMPANY_ID: 'c1',
                TITLE: 'Объект 302655',
                UF_CRM_ACTIVE_ADDRESS: 'Толе би 2',
                DATE_CREATE: '2026-03-10T10:00:00+03:00'
            }
        ],
        clocksterMetricsByPartner: {
            p1: {
                visits: 1,
                hours: 1,
                uniqueObjects: 1,
                objectIds: ['кунаева1'],
                locationKeys: ['кунаева1']
            }
        }
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.breakdown.clockster.missedObjects.length, 1);
    assert.equal(row.breakdown.clockster.missedObjects[0].label, 'Толе би 2');
    assert.equal(row.breakdown.clockster.missedObjects[0].url, 'https://portal.example.bitrix24.kz/crm/deal/details/d2/');
});

test('ФОТ без договоров отображается как тире, а УМС/РМ считается как 100%', () => {
    dashboard.applyTestState({
        partnerMap: {
            'p1': 'Партнер 1'
        },
        deals69: [
            { UF_CRM_1743669674: 'p1' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.details.realization.displayText, '-');
    assert.equal(row.details.realization.sub, 'нет данных');
    assert.equal(row.realizationQ, 1);
    // Без данных по управленке % УМС нейтрален (Q=1.0), а деталь честно говорит «нет данных».
    assert.equal(row.q.ums, 1);
    assert.equal(row.details.ums.sub, 'нет данных');
});

test('коэффициент лиги считается как среднее долей объектов/ОПУ/выручки/трудоёмкости (Классификация партнера.xlsx)', () => {
    dashboard.applyTestState({
        partnerMap: {
            big: 'Бут Р.',       // ОПУ=138 в OPU_COMPLEXITY_SOURCE
            small: 'Жандос Альсейтов' // ОПУ=12
        },
        deals69: [
            ...Array.from({ length: 9 }, (_, i) => ({ ID: `b${i}`, UF_CRM_1743669674: 'big', OPPORTUNITY: '100000' })),
            { ID: 's1', UF_CRM_1743669674: 'small', OPPORTUNITY: '100000' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const rows = dashboard.getMatrixRowsSnapshot();
    const big = rows.find(item => item.bitrixPartnerId === 'big');
    const small = rows.find(item => item.bitrixPartnerId === 'small');
    assert.ok(big && small);

    // doleObjects=0.9/0.1, doleRevenue=0.9/0.1, doleOpu=138/150=0.92 / 12/150=0.08,
    // средний чек одинаковый у обоих → doleTrudo=0.5/0.5.
    // coeff = (доли/4) × N(=2).
    assert.equal(Number(big.leagueCoeff.toFixed(2)), 1.61);
    assert.equal(Number(small.leagueCoeff.toFixed(2)), 0.39);
    assert.equal(big.league, 'Бриллиант');
    assert.equal(small.league, 'Золото');
});

test('лига Изумруд присваивается по правилу города Алматы даже при коэффициенте ниже 0.85 (Вариант 1)', () => {
    dashboard.applyTestState({
        partnerMap: {
            almaty: 'Оспанова Г', // город Алматы в PARTNER_CITY_SOURCE (и ОПУ=182 в OPU_COMPLEXITY_SOURCE)
            other: 'Партнер вне списка городов'
        },
        // У almaty портфель крошечный (1 объект) — её доля объектов/выручки почти нулевая,
        // весь её коэффициент держится на доле ОПУ (182/182=1), но этого одного компонента
        // не хватает, чтобы дотянуть до порога 0.85 без привилегии города.
        deals69: [
            { ID: 'a1', UF_CRM_1743669674: 'almaty', OPPORTUNITY: '1000' },
            ...Array.from({ length: 99 }, (_, i) => ({ ID: `o${i}`, UF_CRM_1743669674: 'other', OPPORTUNITY: '1000' }))
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const rows = dashboard.getMatrixRowsSnapshot();
    const almaty = rows.find(item => item.bitrixPartnerId === 'almaty');
    const other = rows.find(item => item.bitrixPartnerId === 'other');
    assert.ok(almaty && other);

    assert.equal(Number(almaty.leagueCoeff.toFixed(2)), 0.76);
    assert.ok(almaty.leagueCoeff < 0.85);
    // Без привилегии города это была бы «Золото» — но город=Алматы поднимает минимум до «Изумруд».
    assert.equal(almaty.league, 'Изумруд');
    assert.equal(other.league, 'Бриллиант');
});

test('в подписи замечаний показываются дни просрочки и количество замечаний, а не штраф', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        partnersData: {
            p1: {
                name: 'Партнер 1',
                dealsCount: 1,
                totalScore: 1,
                totalOpportunity: 0,
                totalArea: 0,
                dealIds: ['d1'],
                realizationScores: [],
                remarkScores: [0.2],
                remarkLateDaysTotal: 4,
                remarkMissingDateCount: 0,
                remarkMissingFeedbackCount: 0,
                history: []
            }
        },
        remarkMetricsByPartner: {
            p1: {
                rowCount: 3,
                totalLateDays: 4,
                totalPenalty: 0.2,
                skippedMissingRemarkDate: 0,
                skippedMissingFeedbackDate: 0,
                items: [{ penalty: 0.2 }]
            }
        }
    });

    dashboard.buildMatrixRows();
    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.details.remarks.sub, '4/3');
    assert.match(row.details.remarks.title, /замечаний: 3/i);
});

test('положительные отзывы не учитываются в замечаниях вообще', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        bitrixPortalBase: 'https://portal.example.bitrix24.kz',
        companyMap: {
            c1: 'ТОО "Гидробаланс"'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '100' }
        ],
        remarkDeals: [
            {
                ID: 'r1',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-15',
                UF_CRM_1719824872888: '43607'
            },
            {
                ID: 'r2',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-30',
                UF_CRM_1719824872888: '43713'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.remarksCount, 1);
    assert.equal(row.remarksLateDaysTotal, 3);
    assert.equal(row.details.remarks.sub, '3/1');
    assert.equal(Number(row.q.remarks.toFixed(2)), 0.85);
});

test('просроченные замечания в кабинете показывают TITLE сделки', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        bitrixPortalBase: 'https://portal.example.bitrix24.kz',
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '100' }
        ],
        remarkDeals: [
            {
                ID: '109999',
                TITLE: '«Magnum Cash&Carry» ТООАстана',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-15',
                UF_CRM_1719824872888: '43607'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.breakdown.remarks.items[0].label, '«Magnum Cash&Carry» ТООАстана');
    assert.equal(row.breakdown.remarks.items[0].url, 'https://portal.example.bitrix24.kz/crm/deal/details/109999/');
});

test('кабинетные замечания не показывают технические поля, а обзвон ведет на crm.item', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        bitrixPortalBase: 'https://portal.example.bitrix24.kz',
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '100' }
        ],
        remarkDeals: [
            {
                ID: '109999',
                TITLE: '«Magnum Cash&Carry» ТООАстана',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-15',
                UF_CRM_1719824872888: '43607'
            }
        ],
        callsItems: [
            {
                ID: '777',
                ufCrm173Partner: 'p1',
                companyId: 'c1',
                ufCrm173_1771396870: 'ул. Бегалина 68',
                ufCrm1731775114484085: '2026-03-05T10:00:00+03:00',
                ufCrm173_1771396927: 141219,
                ufCrm173_1771397355616: 141221,
                ufCrm173_1771398284442: 0,
                ufCrm173_1771400416684: 'Айдана, 8747 822 26 01'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.breakdown.remarks.lines.some(line => line.includes('Штраф до послабления')), false);
    assert.equal(row.breakdown.remarks.lines.some(line => line.includes('Послабление за объём замечаний')), false);
    assert.equal(row.breakdown.calls.items[0].url, 'https://portal.example.bitrix24.kz/crm/type/1364/details/777/');
    assert.equal(row.breakdown.calls.items[0].answers[0].label, 'Оцените работу вашего куратора от 1-3');
    assert.equal(row.breakdown.calls.items[0].answers[0].displayValue, '3');
    assert.equal(row.breakdown.calls.items[0].fields.find(field => field.field === 'ufCrm173_1771398284442')?.displayValue, 'нет ответа');
    assert.equal(row.breakdown.calls.items[0].fields.find(field => field.field === 'ufCrm173_1771396870')?.displayValue, 'ул. Бегалина 68');
    assert.equal(row.breakdown.calls.items[0].fields.some(field => field.label === 'Должность'), false);
    assert.equal(row.breakdown.calls.items[0].fields.some(field => field.label === 'Вид уборки'), false);
    assert.equal(row.breakdown.calls.items[0].fields.some(field => field.label === 'Дата планерки'), false);
    assert.equal(row.breakdown.calls.items[0].fields.some(field => field.label === 'Ссылка на отработку замечаний'), false);
});

test('в количество замечаний попадают только отрицательные источники, без CSI и пустых', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: '2026-03' };
            return null;
        }
    };

    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '100' }
        ],
        remarkDeals: [
            {
                ID: 'n1',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-15',
                UF_CRM_1719824872888: '43607'
            },
            {
                ID: 'csi1',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-20',
                UF_CRM_1719824872888: '140165'
            },
            {
                ID: 'empty1',
                UF_CRM_1743669674: 'p1',
                DATE_CREATE: '2026-03-10T10:00:00+03:00',
                UF_CRM_REVIEWDATE: '2026-03-10',
                UF_CRM_FITBACK: '2026-03-20'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.remarksCount, 1);
    assert.equal(row.details.remarks.sub, '3/1');
});

test('доля ОПУ (из OPU_COMPLEXITY_SOURCE) растягивает коэффициент лиги пропорционально значению', () => {
    dashboard.applyTestState({
        partnerMap: {
            low: 'Жандос Альсейтов',  // ОПУ=12
            mid: 'Айткулова А.',      // ОПУ=88
            high: 'Зобова Е.'         // ОПУ=208
        },
        // Объекты/выручка равные у всех троих — единственная переменная здесь доля ОПУ.
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'low', OPPORTUNITY: '100000' },
            { ID: 'd2', UF_CRM_1743669674: 'mid', OPPORTUNITY: '100000' },
            { ID: 'd3', UF_CRM_1743669674: 'high', OPPORTUNITY: '100000' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const rows = dashboard.getMatrixRowsSnapshot();
    const low = rows.find(item => item.bitrixPartnerId === 'low');
    const mid = rows.find(item => item.bitrixPartnerId === 'mid');
    const high = rows.find(item => item.bitrixPartnerId === 'high');

    assert.ok(low && mid && high);
    assert.equal(Number(low.leagueCoeff.toFixed(2)), 0.78);
    assert.equal(Number(mid.leagueCoeff.toFixed(2)), 0.96);
    assert.equal(Number(high.leagueCoeff.toFixed(2)), 1.26);
    assert.ok(low.leagueCoeff < mid.leagueCoeff && mid.leagueCoeff < high.leagueCoeff);
});

test('getUmsPercentQ считает Q по нормативу 8% с допуском ±10% (симметрично)', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер Один',
            p2: 'Партнер Два',
            p3: 'Партнер Три'
        },
        managementItems: [
            // Точно на нормативе: УМС=80 000 из выручки без НДС 1 000 000 → 8% → Q=1
            { 'Ответственное_лицо_ИП_инфо': 'Партнер Один', 'Месяц_начисления': '2026-03-31T19:00:00.000Z', 'Реализация без НДС': 1000000, 'Маржа Партнера': 100000, 'Маржа': 0.1, 'ИТОГО УМС': 80000 },
            // Внутри допуска (факт 12%, отклонение 4% из 10% допуска) → Q=0.6
            { 'Ответственное_лицо_ИП_инфо': 'Партнер Два', 'Месяц_начисления': '2026-03-31T19:00:00.000Z', 'Реализация без НДС': 1000000, 'Маржа Партнера': 100000, 'Маржа': 0.1, 'ИТОГО УМС': 120000 },
            // Далеко за допуском (факт 30%, отклонение 22% > 10%) → Q=0
            { 'Ответственное_лицо_ИП_инфо': 'Партнер Три', 'Месяц_начисления': '2026-03-31T19:00:00.000Z', 'Реализация без НДС': 1000000, 'Маржа Партнера': 100000, 'Маржа': 0.1, 'ИТОГО УМС': 300000 }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getUmsPercentQ('p1'), 1);
    assert.equal(Number(dashboard.getUmsPercentQ('p2').toFixed(2)), 0.6);
    assert.equal(dashboard.getUmsPercentQ('p3'), 0);
    // Без данных по управленке — нейтральная заглушка.
    assert.equal(dashboard.getUmsPercentQ('нет-такого-партнера'), 1.0);
});

test('getCleanShareQ считает долю объектов без единого негативного замечания (привязка по UF_CRM_1743501476)', () => {
    dashboard.applyTestState({
        partnerMap: { p1: 'Партнер 1' },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1', TITLE: 'Объект 1', UF_CRM_1743501476: 'addr-1' },
            { ID: 'd2', UF_CRM_1743669674: 'p1', TITLE: 'Объект 2', UF_CRM_1743501476: 'addr-2' },
            { ID: 'd3', UF_CRM_1743669674: 'p1', TITLE: 'Объект 3', UF_CRM_1743501476: 'addr-3' },
            { ID: 'd4', UF_CRM_1743669674: 'p1', TITLE: 'Объект 4', UF_CRM_1743501476: 'addr-4' }
        ],
        remarkDeals: [
            // Два замечания на один и тот же объект (по адресу) — считается как один "грязный".
            { UF_CRM_1743669674: 'p1', UF_CRM_1743501476: 'addr-1', UF_CRM_1719824872888: '43607', UF_CRM_REVIEWDATE: '2026-03-01', UF_CRM_FITBACK: '2026-03-02' },
            { UF_CRM_1743669674: 'p1', UF_CRM_1743501476: 'addr-1', UF_CRM_1719824872888: '43607', UF_CRM_REVIEWDATE: '2026-03-05', UF_CRM_FITBACK: '2026-03-06' },
            { UF_CRM_1743669674: 'p1', UF_CRM_1743501476: 'addr-2', UF_CRM_1719824872888: '43607', UF_CRM_REVIEWDATE: '2026-03-01', UF_CRM_FITBACK: '2026-03-02' },
            // Замечание на объект, которого уже нет в активном портфеле (не в 69) — не считается.
            { UF_CRM_1743669674: 'p1', UF_CRM_1743501476: 'addr-выбывший', UF_CRM_1719824872888: '43607', UF_CRM_REVIEWDATE: '2026-03-01', UF_CRM_FITBACK: '2026-03-02' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    // 2 объекта из 4 «грязные» (addr-1 и addr-2) → 2 чистых из 4 → Q=0.5.
    // Замечание на "addr-выбывший" не в портфеле — не учитывается.
    assert.equal(dashboard.getCleanShareQ('p1'), 0.5);
});

test('getPositiveReviewBonus дает до +5 баллов пропорционально доле положительных отзывов', () => {
    dashboard.applyTestState({
        partnerMap: { p1: 'Партнер 1', p2: 'Партнер 2' },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'p1' },
            { ID: 'd2', UF_CRM_1743669674: 'p2' }
        ],
        remarkDeals: [
            // p1: 3 положительных, 1 негативное → 75% положительных → бонус 3.75
            { UF_CRM_1743669674: 'p1', UF_CRM_1719824872888: '43713' },
            { UF_CRM_1743669674: 'p1', UF_CRM_1719824872888: '43713' },
            { UF_CRM_1743669674: 'p1', UF_CRM_1719824872888: '43713' },
            { UF_CRM_1743669674: 'p1', UF_CRM_1719824872888: '43607', UF_CRM_REVIEWDATE: '2026-03-01', UF_CRM_FITBACK: '2026-03-02' }
            // p2: отзывов вообще нет → бонус 0
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.equal(dashboard.getPositiveReviewBonus('p1'), 3.75);
    assert.equal(dashboard.getPositiveReviewBonus('p2'), 0);
});

test('rounds/budget — нейтральные заглушки Q=1.0 до подключения источников данных', () => {
    assert.equal(dashboard.getRoundsQ('любой-id'), 1.0);
    assert.equal(dashboard.getBudgetQ('любой-id'), 1.0);
});

test('getAuditQ — нейтрален (1.0), пока партнёра ни разу не аудировали', () => {
    assert.equal(dashboard.getAuditQ('любой-id'), 1.0);
});

test('computeAuditItemScore — да/нет критерий (binary)', () => {
    const full = dashboard.computeAuditItemScore({ ufCrm_193_C01: '152975' }); // да → 1/1
    assert.equal(full.achieved, 1);
    assert.equal(full.maxApplicable, 1);
    assert.equal(full.efficiency, 1);

    const zero = dashboard.computeAuditItemScore({ ufCrm_193_C01: '152977' }); // нет → 0/1
    assert.equal(zero.achieved, 0);
    assert.equal(zero.efficiency, 0);
});

test('computeAuditItemScore — 3-уровневая шкала: направление lowGood/highGood учитывается', () => {
    // C05 "Степень износа инвентаря" — низкая (лучший ответ) = max
    const lowIsGood = dashboard.computeAuditItemScore({ ufCrm_193_C05: '152991' }); // низкая
    assert.equal(lowIsGood.achieved, 3);
    // C15 "Состояние спецодежды" — высокое (лучший ответ) = max (обратное направление)
    const highIsGood = dashboard.computeAuditItemScore({ ufCrm_193_C15: '153049' }); // высокое
    assert.equal(highIsGood.achieved, 3);
    // Средний уровень — ровно половина максимума в обоих направлениях
    const mid1 = dashboard.computeAuditItemScore({ ufCrm_193_C05: '152993' }); // средняя
    assert.equal(mid1.achieved, 1.5);
});

test('computeAuditItemScore — критерий №37 (midGood): средняя нагрузка лучше всего, оба края = 0', () => {
    assert.equal(dashboard.computeAuditItemScore({ ufCrm_193_C37: '153177' }).achieved, 0); // низкая
    assert.equal(dashboard.computeAuditItemScore({ ufCrm_193_C37: '153179' }).achieved, 3); // средняя
    assert.equal(dashboard.computeAuditItemScore({ ufCrm_193_C37: '153181' }).achieved, 0); // высокая
});

test('computeAuditItemScore — 5-балльная шкала: значение шкалы = балл', () => {
    const score3of5 = dashboard.computeAuditItemScore({ ufCrm_193_C19: '153071' }); // "3"
    assert.equal(score3of5.achieved, 3);
    assert.equal(score3of5.maxApplicable, 5);
    assert.equal(score3of5.efficiency, 0.6);
});

test('computeAuditItemScore — "н.п." исключается из числителя и знаменателя', () => {
    // C07 допускает "н.п." — критерий не должен влиять ни на достигнутые, ни на макс. баллы
    const withNa = dashboard.computeAuditItemScore({
        ufCrm_193_C01: '152975', // да → 1/1
        ufCrm_193_C07: '153007'  // н.п. → исключить
    });
    assert.equal(withNa.achieved, 1);
    assert.equal(withNa.maxApplicable, 1); // не 4 — критерий C07 (max 3) не учтён
    assert.equal(withNa.answeredCount, 1);
});

test('computeAuditItemScore — пустой черновик (ни один критерий не отвечен) → null', () => {
    assert.equal(dashboard.computeAuditItemScore({}), null);
});

test('getAuditQ считает средний % эффективности по аудитам SPA 1398 за период', () => {
    dashboard.applyTestState({
        partnerMap: { p1: 'Партнер 1' },
        auditEvalItems: [
            {
                ufCrm193Partner: 'p1',
                ufCrm193Date: '2026-03-05',
                ufCrm_193_C01: '152975', // да → 1/1 (100%)
                ufCrm_193_C02: '152979'  // да → 1/1 (100%)
            },
            {
                ufCrm193Partner: 'p1',
                ufCrm193Date: '2026-03-20',
                ufCrm_193_C01: '152977', // нет → 0/1 (0%)
                ufCrm_193_C02: '152979'  // да → 1/1 (100%)
            }
        ]
    });

    dashboard.buildIndexes();

    // Аудит 1: 2/2 = 100%. Аудит 2: 1/2 = 50%. Среднее по двум аудитам = 75%.
    assert.equal(dashboard.getAuditQ('p1'), 0.75);
});
