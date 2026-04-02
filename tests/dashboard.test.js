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

test('месячный диапазон отчета ограничен мартом 2026 — мартом 2027', () => {
    const months = dashboard.getAllowedReportingMonths();
    assert.equal(months[0], '2026-03');
    assert.equal(months.at(-1), '2027-03');
    assert.equal(months.length, 13);
    assert.equal(dashboard.normalizeSelectedMonth('all'), 'summary');
    assert.equal(dashboard.normalizeSelectedMonth('2024-03'), '2026-03');
    assert.equal(dashboard.normalizeSelectedMonth('2027-04'), '2026-03');
    assert.equal(dashboard.normalizeSelectedMonth('2026-11'), '2026-11');
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
                UF_CRM_FITBACK: '2026-03-05'
            },
            {
                UF_CRM_1743669674: 'p1',
                UF_CRM_REVIEWDATE: '2026-03-01',
                UF_CRM_FITBACK: '2026-03-20'
            }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.ok(Math.abs(dashboard.getRemarksQ('p1') - 0.05) < 1e-12);
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
                UF_CRM_FITBACK: '2026-04-20'
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
                UF_CRM_FITBACK: '2026-03-04'
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

test('getTrainingQ берет среднюю сумму и делит на 10', () => {
    dashboard.applyTestState({
        opuItems: [
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-31T10:00:00+03:00', UF_CRM_KASJD12: '4' },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-31T10:00:00+03:00', UF_CRM_KASJD12: '5' }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getTrainingQ('p1'), 0.45);
});

test('getTrainingQ читает живой bitrix-ключ ufCrm_KASJD12', () => {
    dashboard.applyTestState({
        opuItems: [
            { ufCrm127_1756273714: 'p1', ufCrm127_1756290422310: '03', createdTime: '2026-03-31T10:00:00+03:00', ufCrm_KASJD12: 8.5 }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getTrainingQ('p1'), 0.85);
});

test('getRealizationQ пока возвращает заглушку 1.0', () => {
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
            { ID: 'd1', UF_CRM_1743669674: '3421309' },
            { ID: 'd2', UF_CRM_1743669674: '3421309' },
            { ID: 'd3', UF_CRM_1743669674: '3421309' },
            { ID: 'd4', UF_CRM_1743669674: '3421309' }
        ],
        fotDbItems: [
            { partner_id: 1794, partner_name: 'Токенова Сара', period_year: 2026, period_month: 2, object_bitrix_id: 'obj-1', payments_count: 2, total_amount: '1000' },
            { partner_id: 1794, partner_name: 'Токенова Сара', period_year: 2026, period_month: 2, object_bitrix_id: 'obj-2', payments_count: 1, total_amount: '500' },
            { partner_id: 1794, partner_name: 'Токенова Сара', period_year: 2026, period_month: 1, object_bitrix_id: 'obj-3', payments_count: 1, total_amount: '500' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();

    assert.equal(dashboard.getRealizationQ('3421309'), 1);
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
    assert.equal(dashboard.getTrainingQ('p1'), 0.5);
});

test('обзвон фильтруется по дате обзвона, а не по дате создания карточки', () => {
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
                createdTime: '2026-04-05T10:00:00+03:00',
                ufCrm1731775114484085: '2026-03-20T12:00:00+03:00',
                ufCrm173_1771396927: 141219
            },
            {
                ufCrm173Partner: 'p1',
                createdTime: '2026-03-05T10:00:00+03:00',
                ufCrm1731775114484085: '2026-01-20T12:00:00+03:00',
                ufCrm173_1771396927: 141215
            }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 1);
});

test('Общий свод берет только месяцы в диапазоне март 2026 — март 2027', () => {
    global.document = {
        getElementById(id) {
            if (id === 'monthSelect') return { value: 'summary' };
            return null;
        }
    };

    dashboard.applyTestState({
        callsItems: [
            { ufCrm173Partner: 'p1', createdTime: '2026-03-05T10:00:00+03:00', ufCrm173_1771396927: 141219 },
            { ufCrm173Partner: 'p1', createdTime: '2027-02-05T10:00:00+03:00', ufCrm173_1771396927: 141217 },
            { ufCrm173Partner: 'p1', createdTime: '2025-12-05T10:00:00+03:00', ufCrm173_1771396927: 141215 }
        ],
        opuItems: [
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2026-03-31T11:18:34+03:00', UF_CRM_KASJD12: '5' },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '03', CREATED_TIME: '2027-03-31T11:18:34+03:00', UF_CRM_KASJD12: '3' },
            { UF_CRM_127_1756273714: 'p1', UF_CRM_127_1756290422310: '11', CREATED_TIME: '2025-11-01T00:00:00+03:00', UF_CRM_KASJD12: '1' }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 5 / 6);
    assert.equal(dashboard.getTrainingQ('p1'), 0.4);
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
            { ufCrm173Partner: 'p1', createdTime: '2026-02-15T10:00:00+03:00', ufCrm173_1771396927: 141215 },
            { ufCrm173Partner: 'p1', createdTime: '2026-03-15T10:00:00+03:00', ufCrm173_1771396927: 141219 },
            { ufCrm173Partner: 'p1', createdTime: '2026-04-15T10:00:00+03:00', ufCrm173_1771396927: 141217 }
        ]
    });

    dashboard.buildIndexes();

    assert.equal(dashboard.getCallsQ('p1'), 2 / 3);
});

test('audit считает сделки с источником От аудитора замечание', () => {
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

    assert.equal(dashboard.getAuditQ('p1'), 2);
});

test('audit штрафует итог на 1 балл за каждую отрицательную сделку', () => {
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
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(row.auditPenaltyScore, 2);
    assert.equal(row.matrixTotalScore, Math.round((row.preAuditTotalScore - 2) * 100) / 100);
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
    assert.deepEqual(columns.map(column => column.label), ['Партнер', 'Отношения', 'Деньги', 'ОПУ', 'Сумма', 'Коэфф.', 'Итог']);

    dashboard.applyTestState({
        expandedMatrixGroups: {
            relations: true,
            money: false,
            operations: true
        }
    });

    columns = dashboard.getVisibleMatrixColumns();
    assert.deepEqual(columns.map(column => column.label), [
        'Партнер',
        'Отношения',
        'Обзвон',
        'Замечания',
        'Аудит',
        'Деньги',
        'ОПУ',
        'Клостер',
        'Обучение',
        'Дисциплины',
        'УМС/РМ',
        'Сумма',
        'Коэфф.',
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

    assert.deepEqual(metrics['3370865'], { visits: 1, hours: 9, uniqueObjects: 1, objectIds: ['obj-1'] });
    assert.deepEqual(metrics['2361999'], { visits: 3, hours: 10, uniqueObjects: 2, objectIds: ['obj-2', 'obj-3'] });
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

test('заглушки ФОТ и УМС/РМ отображаются как тире, а не как 100%', () => {
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
    assert.equal(row.details.umsrm.displayText, '-');
});

test('коэф аккаунта берется по связке ответственный+компания, а общий коэф считается как среднее из четырех частей', () => {
    dashboard.applyTestState({
        partnerMap: {
            p1: 'Партнер 1'
        },
        companyMap: {
            c1: 'Kaspi bank AO',
            c2: 'TOO "BI Service"'
        },
        lastUserMap: {
            u1: 'Арайлым  Ташенова',
            u2: 'Алина Сидорова'
        },
        accountCoefficientRows: [
            { responsible: 'Арайлым Ташенова', company: 'Kaspi bank AO', coeff: 1.1, status: null },
            { responsible: 'Алина Сидорова', company: 'TOO "BI Service"', coeff: 0.8, status: null }
        ],
        deals69: [
            { ID: 'd1', COMPANY_ID: 'c1', ASSIGNED_BY_ID: 'u1', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '100' },
            { ID: 'd2', COMPANY_ID: 'c2', ASSIGNED_BY_ID: 'u2', UF_CRM_1743669674: 'p1', UF_CRM_1707724024179: '200' }
        ]
    });

    dashboard.buildIndexes();
    dashboard.processData();
    dashboard.buildMatrixRows();

    const row = dashboard.getMatrixRowsSnapshot().find(item => item.bitrixPartnerId === 'p1');
    assert.ok(row);
    assert.equal(Number(row.complexityParts.accountCoeff.toFixed(3)), 0.95);
    assert.equal(Number(row.complexityParts.objectsCoeff.toFixed(3)), 1);
    assert.equal(Number(row.complexityParts.areaCoeff.toFixed(3)), 1);
    assert.equal(Number(row.complexityParts.opuCoeff.toFixed(3)), 1);
    assert.equal(Number(row.complexityCoeff.toFixed(3)), 0.988);
});

test('коэф объектов и площади считаются по перцентилям сети, а не по старым жестким потолкам', () => {
    dashboard.applyTestState({
        partnerMap: {
            low: 'Партнер low',
            mid: 'Партнер mid',
            high: 'Партнер high'
        },
        deals69: [
            { ID: 'l1', UF_CRM_1743669674: 'low', UF_CRM_1707724024179: '1000' },
            { ID: 'm1', UF_CRM_1743669674: 'mid', UF_CRM_1707724024179: '5000' },
            { ID: 'm2', UF_CRM_1743669674: 'mid', UF_CRM_1707724024179: '5000' },
            { ID: 'm3', UF_CRM_1743669674: 'mid', UF_CRM_1707724024179: '5000' },
            { ID: 'm4', UF_CRM_1743669674: 'mid', UF_CRM_1707724024179: '5000' },
            { ID: 'm5', UF_CRM_1743669674: 'mid', UF_CRM_1707724024179: '5000' },
            { ID: 'h1', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h2', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h3', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h4', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h5', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h6', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h7', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h8', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' },
            { ID: 'h9', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '30000' }
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
    assert.equal(Number(low.complexityParts.objectsCoeff.toFixed(2)), 0.8);
    assert.equal(Number(mid.complexityParts.objectsCoeff.toFixed(2)), 1.0);
    assert.equal(Number(high.complexityParts.objectsCoeff.toFixed(2)), 1.2);
    assert.equal(Number(low.complexityParts.areaCoeff.toFixed(2)), 0.8);
    assert.equal(Number(mid.complexityParts.areaCoeff.toFixed(2)), 1.0);
    assert.equal(Number(high.complexityParts.areaCoeff.toFixed(2)), 1.2);
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

test('К.ОПУ берется из ручных значений и считается по шкале 0.8-1.2', () => {
    dashboard.applyTestState({
        partnerMap: {
            low: 'Жандос Альсейтов',
            mid: 'Айткулова А.',
            high: 'Зобова Е.'
        },
        deals69: [
            { ID: 'd1', UF_CRM_1743669674: 'low', UF_CRM_1707724024179: '100' },
            { ID: 'd2', UF_CRM_1743669674: 'mid', UF_CRM_1707724024179: '100' },
            { ID: 'd3', UF_CRM_1743669674: 'high', UF_CRM_1707724024179: '100' }
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
    assert.equal(Number(low.complexityParts.opuCoeff.toFixed(2)), 0.8);
    assert.equal(Number(mid.complexityParts.opuCoeff.toFixed(2)), 1.0);
    assert.equal(Number(high.complexityParts.opuCoeff.toFixed(2)), 1.2);
});
