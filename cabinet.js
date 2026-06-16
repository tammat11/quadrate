const authPanel = document.getElementById('authPanel');
const cabinetPanel = document.getElementById('cabinetPanel');
const phoneForm = document.getElementById('phoneForm');
const codeForm = document.getElementById('codeForm');
const phoneInput = document.getElementById('phoneInput');
const codeInput = document.getElementById('codeInput');
const authMessage = document.getElementById('authMessage');
const changePhoneBtn = document.getElementById('changePhoneBtn');
const cabinetRefreshBtn = document.getElementById('cabinetRefreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const cabinetStats = document.getElementById('cabinetStats');
const cabinetHero = document.getElementById('cabinetHero');
const cabinetPartnerPicker = document.getElementById('cabinetPartnerPicker');
const cabinetDetails = document.getElementById('cabinetDetails');
const cabinetDetailsExplained = document.getElementById('cabinetDetailsExplained');
const cabinetTitle = document.getElementById('cabinetTitle');
const cabinetSubtitle = document.getElementById('cabinetSubtitle');
const detailsTabBtn = document.getElementById('detailsTabBtn');
const managementTabBtn = document.getElementById('managementTabBtn');
const detailsPane = document.getElementById('detailsPane');
const managementPane = document.getElementById('managementPane');

let currentPhone = '';
let currentSession = null;
let activeCabinetTab = 'details';
let activeBreakdownFocus = 'calls';
let activeCabinetRow = null;
let selectedCabinetPartnerId = '';

const CABINET_PARTNER_SELECTOR_PHONES = new Set(['77070522006']);

const CABINET_METRIC_META = {
    calls: {
        plain: 'Обзвон и ответы.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    remarks: {
        plain: 'Замечания и просрочки.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    audit: {
        plain: 'Аудиты качества.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    realization: {
        plain: 'ФОТ и деньги.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    upravlenka: {
        plain: '',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    clockster: {
        plain: 'Clockster и дисциплина.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    training: {
        plain: 'Обучение.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    discipline: {
        plain: 'Внутренняя дисциплина.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    },
    umsrm: {
        plain: 'УМС/РМ.',
        good: 'Норма.',
        watch: 'Контроль.',
        bad: 'Просадка.'
    }
};

function setAuthMessage(text, type = '') {
    authMessage.textContent = text || '';
    authMessage.className = `cabinet-message${type ? ` cabinet-message-${type}` : ''}`;
}

function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return `7${digits}`;
    if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
    return digits;
}

function showAuth() {
    authPanel.hidden = false;
    cabinetPanel.hidden = true;
}

function showCabinet() {
    authPanel.hidden = true;
    cabinetPanel.hidden = false;
}

async function postJson(url, payload = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
}

async function fetchMe() {
    const response = await fetch('/api/cabinet/me', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return data?.authenticated ? data : null;
}

function findOwnRows(accounts, rows) {
    const ids = new Set();
    const partnerIds = new Set();
    const names = new Set();

    for (const account of accounts || []) {
        if (account.listElementId) ids.add(String(account.listElementId));
        if (account.partnerBitrixId) partnerIds.add(String(account.partnerBitrixId));
        if (account.listElementName) names.add(account.listElementName.trim().toLowerCase());
        if (account.employeeName) names.add(account.employeeName.trim().toLowerCase());
    }

    const byPartnerId = rows.filter(row => partnerIds.has(String(row.bitrixPartnerId)));
    if (byPartnerId.length) return byPartnerId;

    const direct = rows.filter(row => ids.has(String(row.bitrixPartnerId)));
    if (direct.length) return direct;

    return rows.filter(row => names.has(String(row.name || '').trim().toLowerCase()));
}

function findRowsForAccount(account, rows) {
    if (!account) return [];
    return findOwnRows([account], rows);
}

function canSelectAnyCabinetPartner() {
    return Boolean(currentSession?.canChoosePartner)
        || CABINET_PARTNER_SELECTOR_PHONES.has(normalizePhone(currentSession?.phone || currentPhone));
}

function getCabinetPartnerRowKey(row) {
    return String(row?.bitrixPartnerId || row?.name || '');
}

function buildCabinetOptionFromRow(row) {
    const id = getCabinetPartnerRowKey(row);
    if (!id) return null;
    return {
        id,
        label: row.name || 'Партнёр',
        sub: `${row.dealsCount || 0} объектов · итог ${DashboardApp.formatMetricNumber(row.matrixTotalScore || 0, 1)}`,
        row
    };
}

function getSelectableRowsFromMatrix(rows) {
    const seen = new Set();
    return (rows || []).reduce((options, row) => {
        const option = buildCabinetOptionFromRow(row);
        if (!option || seen.has(option.id)) return options;
        seen.add(option.id);
        options.push(option);
        return options;
    }, []);
}

function getSelectableCabinetOptions(accounts, rows) {
    if (canSelectAnyCabinetPartner()) {
        return getSelectableRowsFromMatrix(rows);
    }

    if (!CABINET_PARTNER_SELECTOR_PHONES.has(normalizePhone(currentSession?.phone || currentPhone))) {
        return [];
    }

    const seen = new Set();
    const options = [];
    for (const account of accounts || []) {
        const matchedRows = findRowsForAccount(account, rows);
        for (const row of matchedRows) {
            const id = String(row.bitrixPartnerId || account.partnerBitrixId || account.listElementId || row.name || '');
            if (!id || seen.has(id)) continue;
            seen.add(id);
            options.push({
                id,
                label: row.name || account.listElementName || account.employeeName || 'Партнёр',
                sub: `${row.dealsCount || 0} объектов · итог ${DashboardApp.formatMetricNumber(row.matrixTotalScore || 0, 1)}`,
                row
            });
        }
    }
    return options;
}

function metricCard(label, value, sub = '') {
    return `
        <div class="stat-card cabinet-stat-card">
            <h3>${DashboardApp.escapeHtml(label)}</h3>
            <div class="stat-value">${DashboardApp.escapeHtml(value)}</div>
            <div class="stat-trend">${DashboardApp.escapeHtml(sub)}</div>
        </div>
    `;
}

function getDetailTone(row, key, detail) {
    if (typeof detail?.displayText === 'string' && detail.displayText.trim() === '-') return 'muted';
    const q = Number(row.q?.[key] ?? 0);
    if (q >= 0.95) return 'good';
    if (q >= 0.75) return 'watch';
    return 'bad';
}

function getDetailStatus(tone) {
    if (tone === 'good') return 'норма';
    if (tone === 'watch') return 'контроль';
    if (tone === 'bad') return 'просадка';
    return 'нет данных';
}

function getToneExplanation(key, tone) {
    const meta = CABINET_METRIC_META[key];
    if (!meta) return '';
    if (tone === 'good') return meta.good;
    if (tone === 'watch') return meta.watch;
    if (tone === 'bad') return meta.bad;
    return meta.plain;
}

function detailCard(label, value, detail, row, key) {
    const sub = detail?.sub || '';
    const title = detail?.title || '';
    const tone = getDetailTone(row, key, detail);
    const q = Math.max(0, Math.min(1, Number(row.q?.[key] ?? 0)));
    const showBar = tone !== 'muted' && (detail?.format === 'percent' || value.endsWith('%'));
    const note = getToneExplanation(key, tone);
    return `
        <article class="cabinet-detail-card cabinet-detail-${tone}" title="${DashboardApp.escapeHtml(title)}">
            <div class="cabinet-detail-head">
                <div class="cabinet-detail-label">${DashboardApp.escapeHtml(label)}</div>
                <span class="cabinet-detail-status">${DashboardApp.escapeHtml(getDetailStatus(tone))}</span>
            </div>
            <div class="cabinet-detail-value">${DashboardApp.escapeHtml(value)}</div>
            <div class="cabinet-detail-sub">${DashboardApp.escapeHtml(sub)}</div>
            ${note ? `<div class="cabinet-detail-note">${DashboardApp.escapeHtml(note)}</div>` : ''}
            ${showBar ? `
                <div class="cabinet-detail-meter" aria-hidden="true">
                    <span style="width: ${DashboardApp.escapeHtml(String(Math.round(q * 100)))}%"></span>
                </div>
            ` : ''}
        </article>
    `;
}

function setCabinetTab(tab) {
    activeCabinetTab = tab === 'management' ? 'management' : 'details';
    const detailsActive = activeCabinetTab === 'details';
    if (detailsPane) detailsPane.hidden = !detailsActive;
    if (managementPane) managementPane.hidden = detailsActive;
    detailsTabBtn?.classList.toggle('is-active', detailsActive);
    managementTabBtn?.classList.toggle('is-active', !detailsActive);
    detailsTabBtn?.setAttribute('aria-selected', detailsActive ? 'true' : 'false');
    managementTabBtn?.setAttribute('aria-selected', !detailsActive ? 'true' : 'false');
}

function renderBreakdownRows(lines = []) {
    const normalizedLines = (lines || []).filter(Boolean);
    if (!normalizedLines.length) return '';
    return `
        <div class="cabinet-breakdown-rows">
            ${normalizedLines.map(line => {
                const text = String(line);
                const separatorIndex = text.indexOf(':');
                if (separatorIndex <= 0) {
                    return `<div class="cabinet-breakdown-note">${DashboardApp.escapeHtml(text)}</div>`;
                }
                const label = text.slice(0, separatorIndex).trim();
                const value = text.slice(separatorIndex + 1).trim();
                return `
                    <div class="cabinet-breakdown-row">
                        <span>${DashboardApp.escapeHtml(label)}</span>
                        <strong class="cabinet-breakdown-row-value">${DashboardApp.escapeHtml(value)}</strong>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderBreakdownSection(title, lines = [], extraHtml = '', modifier = '', intro = '') {
    const rowsHtml = renderBreakdownRows(lines);
    if (!rowsHtml && !extraHtml && !intro) return '';
    return `
        <section class="cabinet-breakdown-card${modifier ? ` ${modifier}` : ''}">
            <div class="cabinet-breakdown-head">
                <div class="cabinet-breakdown-title">${DashboardApp.escapeHtml(title)}</div>
            </div>
            ${intro ? `<p class="cabinet-breakdown-intro">${DashboardApp.escapeHtml(intro)}</p>` : ''}
            ${rowsHtml}
            ${extraHtml}
        </section>
    `;
}

function formatCabinetDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function renderRemarkItems(items = []) {
    if (!items.length) {
        return '<div class="cabinet-remark-empty">В этом месяце просроченных замечаний нет.</div>';
    }

    return `
        <div class="cabinet-remark-list">
            ${items.map(item => `
                <article class="cabinet-remark-item">
                    <div class="cabinet-remark-head">
                        <div class="cabinet-remark-title-wrap">
                            ${item.url
                                ? `<a class="cabinet-remark-label cabinet-remark-link" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">${DashboardApp.escapeHtml(item.label)}</a>`
                                : `<span class="cabinet-remark-label">${DashboardApp.escapeHtml(item.label)}</span>`}
                        </div>
                        <div class="cabinet-remark-actions">
                            <span class="cabinet-remark-status">-${DashboardApp.escapeHtml(DashboardApp.formatMetricNumber(item.penalty || 0, 2))}</span>
                        </div>
                    </div>
                    ${item.url ? `<div class="cabinet-remark-cta-row"><a class="cabinet-remark-cta" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">Открыть замечание</a></div>` : ''}
                    <div class="cabinet-remark-meta">
                        <span>Замечание ${DashboardApp.escapeHtml(formatCabinetDate(item.remarkDate))}</span>
                        <span>Ответ ${DashboardApp.escapeHtml(formatCabinetDate(item.feedbackDate))}</span>
                        <span>${DashboardApp.escapeHtml(item.lateDays == null ? 'Просрочка —' : `Просрочка ${item.lateDays} дн.`)}</span>
                    </div>
                </article>
            `).join('')}
        </div>
    `;
}

function renderClocksterMissedObjects(items = []) {
    const normalized = (items || []).filter(Boolean);
    if (!normalized.length) {
        return '<div class="cabinet-clockster-empty">За этот месяц не нашлось пропущенных объектов.</div>';
    }

    return `
        <div class="cabinet-clockster-list">
            ${normalized.map(item => `
                <article class="cabinet-clockster-item">
                    <div class="cabinet-clockster-head">
                        <div class="cabinet-clockster-title-wrap">
                            ${item.url
                                ? `<a class="cabinet-clockster-link" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">${DashboardApp.escapeHtml(item.label)}</a>`
                                : `<span class="cabinet-clockster-link">${DashboardApp.escapeHtml(item.label)}</span>`}
                        </div>
                        <span class="cabinet-clockster-status">${DashboardApp.escapeHtml(item.status || 'Не был посещён')}</span>
                    </div>
                    ${item.sublabel ? `<div class="cabinet-clockster-sub">${DashboardApp.escapeHtml(item.sublabel)}</div>` : ''}
                </article>
            `).join('')}
        </div>
    `;
}

function renderSectionFocusButtons() {
    const buttons = [
        ['calls', 'Обзвон'],
        ['remarks', 'Замечания'],
        ['audit', 'Аудит'],
        ['realization', 'ФОТ'],
        ['upravlenka', 'Управленка'],
        ['clockster', 'Клостер'],
        ['training', 'Обучение'],
        ['discipline', 'Дисциплины'],
        ['umsrm', 'УМС/РМ']
    ];

    return `
        <div class="cabinet-breakdown-focusbar cabinet-breakdown-wide" role="tablist" aria-label="Детали расчёта">
            ${buttons.map(([key, label]) => `
                <button type="button" class="cabinet-breakdown-focusbtn${activeBreakdownFocus === key ? ' is-active' : ''}" data-breakdown-focus="${DashboardApp.escapeHtml(key)}">${DashboardApp.escapeHtml(label)}</button>
            `).join('')}
        </div>
    `;
}

function renderSectionFocusContent(sectionKey, breakdown) {
    return renderSectionFocusContentWithRow(activeCabinetRow, sectionKey, breakdown);
}

function renderSectionFocusContentWithRow(row, sectionKey, breakdown) {
    const managementRows = breakdown.upravlenka?.rows || [];
    const managementSummary = breakdown.upravlenka?.summary || {};
    const managementMonthLabel = managementSummary.latestMonthKey
        ? DashboardApp.formatMonthLabel(managementSummary.latestMonthKey)
        : (managementRows[0]?.monthLabel || 'Выбранный месяц');
    const sectionMap = {
        calls: {
            title: 'Обзвон',
            intro: CABINET_METRIC_META.calls.plain,
            score: breakdown.calls?.score,
            lines: breakdown.calls?.lines || [],
            body: renderCallsDetails(breakdown.calls?.items || [])
        },
        remarks: {
            title: 'Замечания',
            intro: CABINET_METRIC_META.remarks.plain,
            score: breakdown.remarks?.score,
            lines: breakdown.remarks?.lines || [],
            body: renderRemarkItems(breakdown.remarks?.items || [])
        },
        audit: {
            title: 'Аудит',
            intro: CABINET_METRIC_META.audit.plain,
            score: breakdown.audit?.score,
            lines: breakdown.audit?.lines || [],
            body: renderAuditItems(breakdown.audit?.items || [])
        },
        realization: {
            title: 'ФОТ',
            intro: CABINET_METRIC_META.realization.plain,
            score: breakdown.realization?.score,
            lines: breakdown.realization?.lines || [],
            body: ''
        },
        upravlenka: {
            title: 'Управленка',
            intro: CABINET_METRIC_META.upravlenka.plain,
            score: breakdown.upravlenka?.score,
            lines: managementRows.length ? [`Месяц начисления: ${managementMonthLabel}`] : [],
            body: renderManagementRows(managementRows)
        },
        clockster: {
            title: 'Клостер',
            intro: CABINET_METRIC_META.clockster.plain,
            score: breakdown.clockster?.score,
            lines: breakdown.clockster?.lines || [],
            body: renderClocksterMissedObjects(breakdown.clockster?.missedObjects || [])
        },
        training: {
            title: 'Обучение',
            intro: CABINET_METRIC_META.training.plain,
            score: breakdown.training?.score,
            lines: breakdown.training?.lines || [],
            body: ''
        },
        discipline: {
            title: 'Дисциплины',
            intro: CABINET_METRIC_META.discipline.plain,
            score: breakdown.discipline?.score,
            lines: breakdown.discipline?.lines || [],
            body: ''
        },
        umsrm: {
            title: 'УМС/РМ',
            intro: CABINET_METRIC_META.umsrm.plain,
            score: breakdown.umsrm?.score,
            lines: breakdown.umsrm?.lines || [],
            body: ''
        }
    };
    const section = sectionMap[sectionKey] || sectionMap.calls;
    const detail = row?.details?.[sectionKey] || {};
    const scoreValue = Number(section.score ?? row?.q?.[sectionKey] ?? 0);
    const scoreText = (sectionKey === 'upravlenka' && detail?.sub === 'нет оценки')
        ? '—'
        : detail?.displayText
        || (detail?.format === 'percent' ? DashboardApp.formatPercent(scoreValue, detail?.digits ?? 0) : DashboardApp.formatMetricNumber(scoreValue, detail?.digits ?? 2));
    const scoreSub = detail?.sub || '';
    const scoreCalcLines = sectionKey === 'upravlenka'
        ? []
        : Array.isArray(detail?.calcLines) && detail.calcLines.length
        ? detail.calcLines
        : (detail?.calcText || detail?.title ? [detail.calcText || detail.title] : []);
    const lines = (section.lines || []).map(line => `<div class="cabinet-breakdown-row"><span>${DashboardApp.escapeHtml(line)}</span></div>`).join('');
    const body = section.body || '<div class="cabinet-breakdown-empty">Нет данных.</div>';
    return `
        <section class="cabinet-breakdown-card cabinet-breakdown-wide cabinet-breakdown-focuspanel">
            <div class="cabinet-breakdown-focushead">
                <div class="cabinet-breakdown-title">${DashboardApp.escapeHtml(section.title)}</div>
                <div class="cabinet-breakdown-note">${DashboardApp.escapeHtml(section.intro)}</div>
            </div>
            <div class="cabinet-breakdown-scorebox">
                <div class="cabinet-breakdown-scorecopy">
                    <div class="cabinet-breakdown-scorevalue">${DashboardApp.escapeHtml(scoreText)}</div>
                    ${scoreSub ? `<div class="cabinet-breakdown-score-sub">${DashboardApp.escapeHtml(scoreSub)}</div>` : ''}
                </div>
                ${scoreCalcLines.length ? `
                    <div class="cabinet-breakdown-scorecalc">
                        ${scoreCalcLines.map(line => `<div class="cabinet-breakdown-scorecalc-line">${DashboardApp.escapeHtml(line)}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="cabinet-breakdown-rows cabinet-breakdown-rows-focus">
                ${lines}
            </div>
            ${body}
        </section>
    `;
}

function renderAuditItems(items = []) {
    const normalized = (items || []).filter(Boolean);
    if (!normalized.length) {
        return '<div class="cabinet-remark-empty">За этот период аудитных записей нет.</div>';
    }

    return `
        <div class="cabinet-remark-list">
            ${normalized.map(item => `
                <article class="cabinet-remark-item">
                    <div class="cabinet-remark-head">
                        <div class="cabinet-remark-title-wrap">
                            ${item.url
                                ? `<a class="cabinet-remark-label cabinet-remark-link" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">${DashboardApp.escapeHtml(item.label)}</a>`
                                : `<span class="cabinet-remark-label">${DashboardApp.escapeHtml(item.label)}</span>`}
                        </div>
                        <span class="cabinet-remark-status">${DashboardApp.escapeHtml(item.status || 'Аудит')}</span>
                    </div>
                    <div class="cabinet-remark-meta">
                        <span>Аудит ${DashboardApp.escapeHtml(formatCabinetDate(item.remarkDate))}</span>
                        <span>${DashboardApp.escapeHtml(item.feedbackDate ? `Ответ ${formatCabinetDate(item.feedbackDate)}` : 'Ответ —')}</span>
                    </div>
                    ${item.url ? `<div class="cabinet-remark-cta-row"><a class="cabinet-remark-cta" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">Открыть аудит</a></div>` : ''}
                </article>
            `).join('')}
        </div>
    `;
}

function renderCallsDetails(items = []) {
    const normalized = (items || []).filter(Boolean);
    if (!normalized.length) {
        return '<div class="cabinet-calls-empty">Нет записей обзвона за выбранный месяц.</div>';
    }

    return `
        <details class="cabinet-calls-details">
            <summary class="cabinet-calls-summary">
                <span>Детали</span>
                <strong>${DashboardApp.escapeHtml(String(normalized.length))}</strong>
            </summary>
            <div class="cabinet-calls-list">
                ${normalized.map(item => `
                    <article class="cabinet-calls-item">
                        <div class="cabinet-calls-head">
                            <div class="cabinet-calls-title-wrap">
                                ${item.url
                                    ? `<a class="cabinet-calls-link" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">${DashboardApp.escapeHtml(item.label)}</a>`
                                    : `<span class="cabinet-calls-link">${DashboardApp.escapeHtml(item.label)}</span>`}
                                <span>${DashboardApp.escapeHtml(item.date ? formatCabinetDate(item.date) : 'Без даты')}</span>
                            </div>
                        </div>
                        <div class="cabinet-calls-fields">
                            ${item.fields.map(field => `
                                <div class="cabinet-calls-field">
                                    <span>${DashboardApp.escapeHtml(field.label)}</span>
                                    ${field.kind === 'url' && field.displayValue !== 'не заполнено'
                                        ? `<a href="${DashboardApp.escapeHtml(field.displayValue)}" target="_blank" rel="noreferrer">${DashboardApp.escapeHtml(field.displayValue)}</a>`
                                        : `<strong>${DashboardApp.escapeHtml(field.displayValue)}</strong>`}
                                </div>
                            `).join('')}
                        </div>
                        <div class="cabinet-calls-footer">
                            <span>Ответов ${DashboardApp.escapeHtml(String(item.answerCount || 0))}</span>
                            <span>Q ${DashboardApp.escapeHtml(item.q == null ? '—' : DashboardApp.formatPercent(item.q, 0))}</span>
                        </div>
                    </article>
                `).join('')}
            </div>
        </details>
    `;
}

function renderSummaryHero(row, breakdown) {
    const finalScore = DashboardApp.formatMetricNumber(breakdown.summary?.finalScore || row.matrixTotalScore || 0, 1);
    const rawTotal = DashboardApp.formatMetricNumber(breakdown.summary?.rawTotal || row.rawTotal || 0, 1);
    const coeff = DashboardApp.formatMetricNumber(breakdown.summary?.complexityCoeff || row.complexityCoeff || 1, 2);
    const overdueCount = breakdown.remarks?.overdueCount || 0;

    const remarkTone = overdueCount
        ? `Сейчас давят замечания: ${overdueCount} шт. с просрочкой.`
        : 'Просроченных замечаний в выбранном месяце нет.';

    return `
        <section class="cabinet-summary-hero">
            <div class="cabinet-summary-copy">
                <div class="cabinet-breakdown-title">Итог месяца</div>
                <div class="cabinet-summary-score">${DashboardApp.escapeHtml(finalScore)}</div>
                <p class="cabinet-summary-text">${DashboardApp.escapeHtml(remarkTone)}</p>
            </div>
            <div class="cabinet-summary-pills">
                <div class="cabinet-summary-pill">
                    <span>До коэффициента</span>
                    <strong>${DashboardApp.escapeHtml(rawTotal)}</strong>
                </div>
                <div class="cabinet-summary-pill">
                    <span>Коэффициент сложности</span>
                    <strong>${DashboardApp.escapeHtml(coeff)}</strong>
                </div>
                <div class="cabinet-summary-pill">
                    <span>Уровень</span>
                    <strong>${DashboardApp.escapeHtml(row.partnerLevel || '—')}</strong>
                </div>
            </div>
        </section>
    `;
}

function getPrimaryAction(row, breakdown) {
    const overdueCount = breakdown.remarks?.overdueCount || 0;
    if (overdueCount > 0) {
        return 'Закрыть просроченные замечания и дать ответы по зависшим кейсам. Обычно это самый быстрый способ вернуть потерянные баллы.';
    }
    if (Number(row.q?.calls || 0) < 0.8) {
        return 'Подтянуть обзвон и скорость ответов. Этот блок сейчас слабее нормы и заметно ограничивает итог.';
    }
    if (Number(row.q?.realization || 0) < 1) {
        return 'Проверить финансовый блок: выплаты, договорную базу и все, что влияет на ФОТ.';
    }
    if (Number(row.q?.training || 0) < 0.9) {
        return 'Добрать обучение и обязательные активности команды. Здесь еще лежит понятный запас роста.';
    }
    return 'Критичных провалов нет. Главная задача сейчас — удержать темп и не допустить просадки по операционным блокам.';
}

function renderUnderstandingGuide(row) {
    return '';
}

function getCabinetFocusText(row, breakdown) {
    const overdueCount = breakdown.remarks?.overdueCount || 0;
    const callsQ = Number(row.q?.calls || 0);
    const fotQ = Number(row.q?.realization || 0);
    const trainingQ = Number(row.q?.training || 0);

    if (overdueCount > 0) {
        return `Главная зона внимания сейчас — замечания. Есть ${overdueCount} просроченных кейсов, они напрямую режут итоговый балл.`;
    }
    if (callsQ < 0.8) {
        return 'Главная точка роста сейчас — обзвон. Если поднять дисциплину по ответам, итог начнет расти быстрее всего.';
    }
    if (fotQ < 1) {
        return 'По ФОТ есть запас для роста. Выплаты и договорная база пока не дотягивают до полного Q по блоку.';
    }
    if (trainingQ < 0.9) {
        return 'Обучение еще можно усилить. Сейчас блок недобирает до максимума и тормозит итог.';
    }
    return 'Картина по месяцу ровная: резких провалов нет, можно держать темп и добирать баллы по операционным блокам.';
}

function renderCabinetOverview(row) {
    const breakdown = row.breakdown || {};
    const overdueCount = breakdown.remarks?.overdueCount || 0;
    const focusText = getCabinetFocusText(row, breakdown);

    cabinetHero.innerHTML = `
        <article class="cabinet-overview-main">
            <div class="cabinet-overview-copy">
                <div class="cabinet-breakdown-title">Показатель партнера</div>
                <div class="cabinet-overview-score">${DashboardApp.escapeHtml(DashboardApp.formatMetricNumber(row.matrixTotalScore || 0, 1))}</div>
                <p class="cabinet-overview-text">${DashboardApp.escapeHtml(focusText)}</p>
            </div>
            <div class="cabinet-overview-aside">
                <div class="cabinet-overview-chip">
                    <span>Уровень</span>
                    <strong>${DashboardApp.escapeHtml(row.partnerLevel || '—')}</strong>
                </div>
                <div class="cabinet-overview-chip">
                    <span>Просрочки</span>
                    <strong>${DashboardApp.escapeHtml(String(overdueCount))}</strong>
                </div>
                <div class="cabinet-overview-chip">
                    <span>Объекты</span>
                    <strong>${DashboardApp.escapeHtml(String(row.dealsCount || 0))}</strong>
                </div>
            </div>
        </article>
    `;
}

function renderExplainedDetails(row) {
    activeCabinetRow = row;
    const breakdown = row.breakdown || {};
    const sectionEntries = [
        renderSummaryHero(row, breakdown),
        renderSectionFocusButtons(),
        renderSectionFocusContentWithRow(row, activeBreakdownFocus, breakdown)
    ];
    const sections = sectionEntries.filter(Boolean);
    cabinetDetailsExplained.innerHTML = sections.join('');
}

function formatMetric(row, key) {
    const value = row.q?.[key] ?? 0;
    const detail = row.details?.[key] || {};
    if (typeof detail.displayText === 'string') return detail.displayText;
    if (detail.format === 'percent') return DashboardApp.formatPercent(detail.displayValue ?? value, detail.digits ?? 0);
    return DashboardApp.formatMetricNumber(detail.displayValue ?? value, detail.digits ?? 2);
}

function getManagementCellValue(row, fieldName, fallback = '') {
    const raw = row?.raw || {};
    const value = raw[fieldName] ?? row?.[fieldName] ?? fallback;
    return value == null || value === '' ? fallback : value;
}

function formatManagementMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value == null || value === '' ? '-' : String(value);
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

function sumManagementField(rows, fieldName, fallbackKey = '') {
    return rows.reduce((sum, row) => {
        const value = fallbackKey ? getManagementCellValue(row, fieldName, row[fallbackKey]) : getManagementCellValue(row, fieldName);
        const number = Number(value);
        return Number.isFinite(number) ? sum + number : sum;
    }, 0);
}

function aggregateManagementRows(rows = [], label = 'Total', extra = {}) {
    const revenueNet = sumManagementField(rows, 'Реализация без НДС', 'revenueNet');
    const fotTotal = sumManagementField(rows, 'ИТОГО ФОТ', 'fotTotal');
    return {
        label,
        rowsCount: rows.length,
        revenueGross: sumManagementField(rows, 'Реализация с НДС', 'revenueGross'),
        revenueNet,
        vat: sumManagementField(rows, 'НДС', 'vat'),
        advances: sumManagementField(rows, 'Авансирования'),
        officialSalary: sumManagementField(rows, 'ОФ ЗП 1С'),
        unofficialFot: sumManagementField(rows, 'ФОТ НЕОФ'),
        kaspiJti: sumManagementField(rows, 'Kaspi/ JTI'),
        curators: sumManagementField(rows, 'Кураторы'),
        pieceworkers: sumManagementField(rows, 'Сдельщики'),
        selfEmployed: sumManagementField(rows, 'Самозанятые'),
        fotTotal,
        fotShare: revenueNet ? fotTotal / revenueNet : 0,
        umsTotal: sumManagementField(rows, 'ИТОГО УМС', 'umsTotal'),
        umsShare: revenueNet ? sumManagementField(rows, 'ИТОГО УМС', 'umsTotal') / revenueNet : 0,
        generalCleaning: sumManagementField(rows, 'Ген. Уборка'),
        transport: sumManagementField(rows, 'Транспортные расходы'),
        equipment: sumManagementField(rows, 'Оборудование'),
        repair: sumManagementField(rows, 'Ремонт'),
        consulting: sumManagementField(rows, 'Консалтинг'),
        accounting: sumManagementField(rows, 'Бух. Услуги'),
        incomeTax: sumManagementField(rows, 'ИПН/КПН'),
        selfEmployedTax: sumManagementField(rows, 'Налоги самозанятых'),
        expenseIp: sumManagementField(rows, 'Расходы ИП', 'expenseIp'),
        partnerMargin: sumManagementField(rows, 'Маржа Партнера', 'partnerMargin'),
        marginShare: revenueNet ? sumManagementField(rows, 'Маржа Партнера', 'partnerMargin') / revenueNet : 0,
        ...extra
    };
}

function buildManagementGroups(rows = []) {
    const groups = new Map();
    for (const row of rows) {
        const partnerName = row.responsibleName || getManagementCellValue(row, 'Ответственное_лицо_ИП_инфо') || row.partnerName || 'Партнер';
        if (!groups.has(partnerName)) groups.set(partnerName, []);
        groups.get(partnerName).push(row);
    }
    return Array.from(groups.entries()).map(([partnerName, groupRows]) => aggregateManagementRows(groupRows, partnerName));
}

function buildManagementBreakdownGroups(rows = [], getKey, getLabel, getExtra = () => ({})) {
    const groups = new Map();
    for (const row of rows) {
        const key = getKey(row) || 'Без названия';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }
    return Array.from(groups.entries())
        .map(([key, groupRows]) => aggregateManagementRows(groupRows, getLabel(groupRows[0], key), getExtra(groupRows[0], key)))
        .sort((a, b) => String(a.label).localeCompare(String(b.label), 'ru'));
}

function buildManagementTotal(groups = [], label = 'Total') {
    const total = groups.reduce((acc, group) => {
        acc.rowsCount += group.rowsCount;
        acc.revenueGross += group.revenueGross;
        acc.revenueNet += group.revenueNet;
        acc.vat += group.vat;
        acc.advances += group.advances;
        acc.officialSalary += group.officialSalary;
        acc.unofficialFot += group.unofficialFot;
        acc.kaspiJti += group.kaspiJti;
        acc.curators += group.curators;
        acc.pieceworkers += group.pieceworkers;
        acc.selfEmployed += group.selfEmployed;
        acc.fotTotal += group.fotTotal;
        acc.umsTotal += group.umsTotal;
        acc.generalCleaning += group.generalCleaning || 0;
        acc.transport += group.transport || 0;
        acc.equipment += group.equipment || 0;
        acc.repair += group.repair || 0;
        acc.consulting += group.consulting || 0;
        acc.accounting += group.accounting || 0;
        acc.incomeTax += group.incomeTax || 0;
        acc.selfEmployedTax += group.selfEmployedTax || 0;
        acc.expenseIp += group.expenseIp || 0;
        acc.partnerMargin += group.partnerMargin || 0;
        return acc;
    }, {
        label,
        rowsCount: 0,
        revenueGross: 0,
        revenueNet: 0,
        vat: 0,
        advances: 0,
        officialSalary: 0,
        unofficialFot: 0,
        kaspiJti: 0,
        curators: 0,
        pieceworkers: 0,
        selfEmployed: 0,
        fotTotal: 0,
        umsTotal: 0,
        generalCleaning: 0,
        transport: 0,
        equipment: 0,
        repair: 0,
        consulting: 0,
        accounting: 0,
        incomeTax: 0,
        selfEmployedTax: 0,
        expenseIp: 0,
        partnerMargin: 0
    });
    total.fotShare = total.revenueNet ? total.fotTotal / total.revenueNet : 0;
    total.umsShare = total.revenueNet ? total.umsTotal / total.revenueNet : 0;
    total.marginShare = total.revenueNet ? total.partnerMargin / total.revenueNet : 0;
    return total;
}

function renderManagementHierarchyTable(rows = []) {
    const partnerGroups = buildManagementGroups(rows);
    const tableRows = [];
    for (const partnerGroup of partnerGroups) {
        const partnerRows = rows.filter(row => {
            const partnerName = row.responsibleName || getManagementCellValue(row, 'Ответственное_лицо_ИП_инфо') || row.partnerName || 'Партнер';
            return partnerName === partnerGroup.label;
        });
        const companyGroups = buildManagementBreakdownGroups(
            partnerRows,
            row => row.companyName || getManagementCellValue(row, 'Наименовение_компании_1'),
            (row, key) => row.companyName || getManagementCellValue(row, 'Наименовение_компании_1') || key
        );
        for (const companyGroup of companyGroups) {
            const companyKey = `mgmt-${tableRows.length}`;
            const companyRows = partnerRows.filter(row => {
                const companyName = row.companyName || getManagementCellValue(row, 'Наименовение_компании_1') || 'Без названия';
                return companyName === companyGroup.label;
            });
            const objectGroups = buildManagementBreakdownGroups(
                companyRows,
                row => row.address || getManagementCellValue(row, 'Адрес_объекта_инфо') || row.title || row.id,
                row => row.address || getManagementCellValue(row, 'Адрес_объекта_инфо') || row.title || `Объект ${row.id || ''}`.trim()
            );
            tableRows.push({ ...companyGroup, level: 'company', display: companyGroup.label, companyKey, objectCount: objectGroups.length });
            for (const objectGroup of objectGroups) {
                tableRows.push({ ...objectGroup, level: 'object', display: objectGroup.label, companyKey });
            }
        }
    }
    tableRows.push({ ...buildManagementTotal(partnerGroups, 'Total'), level: 'grand-total', display: 'Total' });

    const columns = [
        ['Клиент / объект', group => group.display],
        ['Реализация с НДС', group => formatManagementMoney(group.revenueGross)],
        ['Реализация без НДС', group => formatManagementMoney(group.revenueNet)],
        ['НДС', group => formatManagementMoney(group.vat)],
        ['Авансирования', group => formatManagementMoney(group.advances)],
        ['ОФ ЗП 1С', group => formatManagementMoney(group.officialSalary)],
        ['Неоф ФОТ', group => formatManagementMoney(group.unofficialFot)],
        ['Каспи/JTI', group => formatManagementMoney(group.kaspiJti)],
        ['Кураторы', group => formatManagementMoney(group.curators)],
        ['Сдельщики', group => formatManagementMoney(group.pieceworkers)],
        ['Самозанятые', group => formatManagementMoney(group.selfEmployed)],
        ['ИТОГО ФОТ', group => formatManagementMoney(group.fotTotal)],
        ['Доля ФОТ %', group => DashboardApp.formatPercent(group.fotShare || 0, 2)],
        ['ИТОГО УМС', group => formatManagementMoney(group.umsTotal)],
        ['Доля УМС %', group => DashboardApp.formatPercent(group.umsShare || 0, 2)],
        ['Ген. уборка', group => formatManagementMoney(group.generalCleaning)],
        ['Транспортные расходы', group => formatManagementMoney(group.transport)],
        ['Оборудование', group => formatManagementMoney(group.equipment)],
        ['Ремонт', group => formatManagementMoney(group.repair)],
        ['Консалтинг', group => formatManagementMoney(group.consulting)],
        ['Бух. услуги', group => formatManagementMoney(group.accounting)],
        ['ИПН/КПН', group => formatManagementMoney(group.incomeTax)],
        ['Налоги самозанятых', group => formatManagementMoney(group.selfEmployedTax)],
        ['Расходы ИП', group => formatManagementMoney(group.expenseIp)],
        ['Маржа партнера', group => formatManagementMoney(group.partnerMargin)],
        ['Маржа %', group => DashboardApp.formatPercent(group.marginShare || 0, 2)]
    ];
    const columnWidths = columns.map(([label], index) => {
        if (index === 0) return '420px';
        if (label === 'Транспортные расходы') return '170px';
        if (label === 'Маржа партнера') return '155px';
        if (label.includes('Реализация')) return '150px';
        if (label.includes('Доля') || label.includes('%')) return '115px';
        if (label.includes('Налоги')) return '150px';
        if (label.includes('Самозанятые')) return '150px';
        return '130px';
    });
    const gridTemplate = columnWidths.join(' ');

    return `
        <div class="cabinet-management-scrollbar" data-management-scrollbar hidden aria-hidden="true">
            <div class="cabinet-management-scrollbar-inner" data-management-scrollbar-inner></div>
        </div>
        <div class="cabinet-management-table-wrap" data-management-table-wrap role="region" aria-label="Таблица управленки">
            <div class="cabinet-management-grid" role="table" style="--management-grid-template: ${gridTemplate};">
                <div class="cabinet-management-row is-head" role="row">
                    ${columns.map(([label]) => `<div class="cabinet-management-cell" role="columnheader">${DashboardApp.escapeHtml(label)}</div>`).join('')}
                </div>
                ${tableRows.map(group => `
                    <div class="cabinet-management-row is-${DashboardApp.escapeHtml(group.level)}${group.level === 'object' ? ' is-hidden' : ''}" role="row"${group.companyKey ? ` data-company-key="${DashboardApp.escapeHtml(group.companyKey)}"` : ''}>
                        ${columns.map(([label, getter], index) => {
                            const value = getter(group);
                            const isNumber = index > 0;
                            const className = `cabinet-management-cell${isNumber ? ' is-number' : ''}${index === 0 ? ' is-tree-cell' : ''}`;
                            if (index === 0) {
                                return `
                                    <div class="${className}" role="cell">
                                        <div class="cabinet-management-tree cabinet-management-tree-${DashboardApp.escapeHtml(group.level)}">
                                            ${group.level === 'company'
                                                ? `<button type="button" class="cabinet-management-expand" data-management-toggle="${DashboardApp.escapeHtml(group.companyKey)}" aria-expanded="false" aria-label="Показать адреса">+</button>`
                                                : ''}
                                            <span>${DashboardApp.escapeHtml(String(value || '-'))}</span>
                                        </div>
                                    </div>
                                `;
                            }
                            return `<div class="${className}" role="cell">${DashboardApp.escapeHtml(String(value || '-'))}</div>`;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderManagementRows(rows = []) {
    const normalized = (rows || []).filter(Boolean);
    if (!normalized.length) {
        return '<div class="cabinet-management-empty">За выбранный месяц данных по управленке нет.</div>';
    }

    return `
        ${renderManagementHierarchyTable(normalized)}
    `;
}

function renderManagementPane(row) {
    const breakdown = row?.breakdown?.upravlenka || {};
    const rows = Array.isArray(breakdown.rows) ? breakdown.rows : [];
    const summary = breakdown.summary || {};
    if (!rows.length && !summary.rowCount) {
        return `
            <div class="cabinet-placeholder">
                <h3>Управленка</h3>
                <p>По этому партнёру за выбранный месяц данных из Marja_full нет.</p>
            </div>
        `;
    }

    const marginShare = Number.isFinite(Number(summary.marginShare))
        ? Number(summary.marginShare)
        : (Number(summary.avgMargin ?? breakdown.score ?? 0) || 0);
    const qValue = Number.isFinite(Number(breakdown.score))
        ? Number(breakdown.score)
        : (Number(summary.avgMargin) || 0);
    const managementPoints = Number.isFinite(Number(summary.managementPoints))
        ? Number(summary.managementPoints)
        : Math.round(qValue * 10);
    const monthLabel = summary.latestMonthKey
        ? DashboardApp.formatMonthLabel(summary.latestMonthKey)
        : (rows[0]?.monthLabel || 'Выбранный месяц');
    return `
        <section class="cabinet-breakdown-card cabinet-breakdown-wide cabinet-management-report">
            <div class="cabinet-breakdown-head">
                <div class="cabinet-breakdown-title">Управленка</div>
                <div class="cabinet-management-month">Месяц начисления</div>
            </div>
            <div class="cabinet-management-period">
                <span>Месяц начисления</span>
                <strong>${DashboardApp.escapeHtml(monthLabel)}</strong>
            </div>
            <p class="cabinet-breakdown-intro">Данные из view <code>Marja_full</code>.</p>
            <div class="cabinet-management-summary">
                <div class="cabinet-management-summary-score">
                    <div class="cabinet-management-summary-value">${DashboardApp.escapeHtml(DashboardApp.formatPercent(qValue, 0))}</div>
                    <div class="cabinet-management-summary-sub">${DashboardApp.escapeHtml(`${DashboardApp.formatMetricNumber(managementPoints, 0)} из 10`)}</div>
                </div>
                <div class="cabinet-management-summary-cards">
                    <div class="cabinet-management-summary-card">
                        <span>Маржа %</span>
                        <strong>${DashboardApp.escapeHtml(DashboardApp.formatPercent(marginShare, 0))}</strong>
                    </div>
                    <div class="cabinet-management-summary-card">
                        <span>Реализация без НДС</span>
                        <strong>${DashboardApp.escapeHtml(DashboardApp.formatMoneyShort(summary.revenueNetSum || 0))}</strong>
                    </div>
                    <div class="cabinet-management-summary-card">
                        <span>Маржа партнёра</span>
                        <strong>${DashboardApp.escapeHtml(DashboardApp.formatMoneyShort(summary.partnerMarginSum || 0))}</strong>
                    </div>
                    <div class="cabinet-management-summary-card">
                        <span>Расходы ИП</span>
                        <strong>${DashboardApp.escapeHtml(DashboardApp.formatMoneyShort(summary.expenseIpSum || 0))}</strong>
                    </div>
                </div>
            </div>
            ${renderManagementRows(rows)}
        </section>
    `;
}

function renderCabinetRows(rows) {
    if (!rows.length) {
        renderCabinetPartnerPicker([]);
        cabinetHero.innerHTML = '';
        cabinetStats.innerHTML = metricCard('Данные', '-', 'Не нашли вашу строку в матрице');
        cabinetDetails.innerHTML = '<p class="cabinet-empty">Пока не нашли привязку к матрице.</p>';
        cabinetDetailsExplained.innerHTML = '';
        return;
    }

    const row = rows[0];
    cabinetTitle.textContent = row.name || 'Личный кабинет';
    cabinetSubtitle.textContent = `${currentSession?.phoneMasked || ''} · ${row.dealsCount || 0} объектов`;
    renderCabinetOverview(row);
    cabinetStats.innerHTML = '';

    const metrics = [
        ['Обзвон', 'calls'],
        ['Замечания', 'remarks'],
        ['Аудит', 'audit'],
        ['ФОТ', 'realization'],
        ['Управленка', 'upravlenka'],
        ['Клостер', 'clockster'],
        ['Обучение', 'training'],
        ['Дисциплины', 'discipline'],
        ['УМС/РМ', 'umsrm']
    ];

    cabinetDetails.innerHTML = metrics
        .map(([label, key]) => detailCard(label, formatMetric(row, key), row.details?.[key], row, key))
        .join('');
    renderExplainedDetails(row);
    if (managementPane) managementPane.innerHTML = renderManagementPane(row);
    syncManagementScrollbars();
}

function renderCabinetPartnerPicker(options = []) {
    if (!cabinetPartnerPicker) return;
    if (options.length <= 1) {
        cabinetPartnerPicker.hidden = true;
        cabinetPartnerPicker.innerHTML = '';
        return;
    }

    cabinetPartnerPicker.hidden = false;
    const selectedOption = options.find(option => String(option.id) === String(selectedCabinetPartnerId)) || options[0];
    cabinetPartnerPicker.innerHTML = `
        <div class="cabinet-partner-picker-head">
            <div>
                <div class="cabinet-breakdown-title">Выбор партнёра</div>
                <p>Твой номер открыт как админ: можно зайти в кабинет любого партнёра.</p>
            </div>
            <div class="cabinet-partner-current">${DashboardApp.escapeHtml(selectedOption?.sub || '')}</div>
        </div>
        <label class="cabinet-partner-select-wrap">
            <span>Партнёр</span>
            <select id="cabinetPartnerSelect">
                ${options.map(option => `
                    <option value="${DashboardApp.escapeHtml(option.id)}"${String(option.id) === String(selectedCabinetPartnerId) ? ' selected' : ''}>
                        ${DashboardApp.escapeHtml(option.label)}
                    </option>
                `).join('')}
            </select>
        </label>
    `;
}

cabinetPartnerPicker?.addEventListener('change', event => {
    if (event.target?.id !== 'cabinetPartnerSelect') return;
    selectedCabinetPartnerId = String(event.target.value || '');
    loadCabinetData(false);
});

cabinetDetailsExplained.addEventListener('click', event => {
    const managementToggle = event.target.closest?.('[data-management-toggle]');
    if (managementToggle) {
        const key = String(managementToggle.dataset.managementToggle || '');
        const isExpanded = managementToggle.getAttribute('aria-expanded') === 'true';
        cabinetDetailsExplained
            .querySelectorAll(`.cabinet-management-row.is-object[data-company-key="${CSS.escape(key)}"]`)
            .forEach(row => row.classList.toggle('is-hidden', isExpanded));
        managementToggle.setAttribute('aria-expanded', String(!isExpanded));
        managementToggle.textContent = isExpanded ? '+' : '−';
        return;
    }

    const button = event.target.closest?.('[data-breakdown-focus]');
    if (!button) return;
    const nextFocus = String(button.dataset.breakdownFocus || '').trim();
    if (!nextFocus || nextFocus === activeBreakdownFocus) return;
    activeBreakdownFocus = nextFocus;
    if (activeCabinetRow) {
        renderExplainedDetails(activeCabinetRow);
        syncManagementScrollbars();
    }
});

function syncManagementScrollbars() {
    const roots = [cabinetDetailsExplained, managementPane].filter(Boolean);
    for (const root of roots) {
        root.querySelectorAll('[data-management-table-wrap]').forEach(wrap => {
            const scrollbar = wrap.parentElement?.querySelector?.('[data-management-scrollbar]');
            const scrollbarInner = scrollbar?.querySelector?.('[data-management-scrollbar-inner]');
            const grid = wrap.querySelector('.cabinet-management-grid');
            if (!scrollbar || !scrollbarInner || !grid) return;

            let syncingFromWrap = false;
            let syncingFromScrollbar = false;
            let wrapFrame = 0;
            let scrollbarFrame = 0;

            const syncFromWrap = () => {
                if (syncingFromScrollbar) return;
                if (wrapFrame) cancelAnimationFrame(wrapFrame);
                wrapFrame = requestAnimationFrame(() => {
                    wrapFrame = 0;
                    syncingFromWrap = true;
                    if (scrollbar.scrollLeft !== wrap.scrollLeft) scrollbar.scrollLeft = wrap.scrollLeft;
                    syncingFromWrap = false;
                });
            };
            const syncFromScrollbar = () => {
                if (syncingFromWrap) return;
                if (scrollbarFrame) cancelAnimationFrame(scrollbarFrame);
                scrollbarFrame = requestAnimationFrame(() => {
                    scrollbarFrame = 0;
                    syncingFromScrollbar = true;
                    if (wrap.scrollLeft !== scrollbar.scrollLeft) wrap.scrollLeft = scrollbar.scrollLeft;
                    syncingFromScrollbar = false;
                });
            };
            const refreshMetrics = () => {
                const contentWidth = Math.max(grid.scrollWidth, wrap.scrollWidth);
                scrollbarInner.style.width = `${contentWidth}px`;
                const hasOverflow = contentWidth > wrap.clientWidth + 4;
                scrollbar.hidden = !hasOverflow;
                scrollbar.setAttribute('aria-hidden', hasOverflow ? 'false' : 'true');
                if (!hasOverflow) {
                    wrap.scrollLeft = 0;
                    scrollbar.scrollLeft = 0;
                } else {
                    syncFromWrap();
                }
            };

            if (!wrap.dataset.managementScrollBound) {
                wrap.addEventListener('scroll', syncFromWrap, { passive: true });
                scrollbar.addEventListener('scroll', syncFromScrollbar, { passive: true });
                wrap.dataset.managementScrollBound = '1';
            }

            refreshMetrics();
            requestAnimationFrame(refreshMetrics);
        });
    }
}

window.addEventListener('resize', () => syncManagementScrollbars());

async function loadCabinetData(forceRefresh = false) {
    if (!currentSession) return;
    cabinetRefreshBtn.disabled = true;
    cabinetRefreshBtn.textContent = 'Обновляем...';
    try {
        DashboardApp.setupMonthSelect();
        await DashboardApp.loadDashboard({ forceRefresh });
        const rows = DashboardApp.getMatrixRowsSnapshot();
        const options = getSelectableCabinetOptions(currentSession.accounts, rows);
        if (options.length) {
            if (!selectedCabinetPartnerId || !options.some(option => String(option.id) === String(selectedCabinetPartnerId))) {
                selectedCabinetPartnerId = String(options[0].id);
            }
            renderCabinetPartnerPicker(options);
            const selectedOption = options.find(option => String(option.id) === String(selectedCabinetPartnerId));
            renderCabinetRows(selectedOption?.row ? [selectedOption.row] : []);
            return;
        }
        selectedCabinetPartnerId = '';
        renderCabinetPartnerPicker([]);
        renderCabinetRows(findOwnRows(currentSession.accounts, rows));
    } finally {
        cabinetRefreshBtn.disabled = false;
        cabinetRefreshBtn.textContent = 'Обновить';
    }
}

phoneForm.addEventListener('submit', async event => {
    event.preventDefault();
    currentPhone = normalizePhone(phoneInput.value);
    setAuthMessage('Отправляем код...');
    try {
        const data = await postJson('/api/cabinet/request-code', { phone: currentPhone });
        if (data.autoLogin) {
            currentSession = data;
            showCabinet();
            setAuthMessage('');
            await loadCabinetData();
            return;
        }
        phoneForm.hidden = true;
        codeForm.hidden = false;
        codeInput.focus();
        const devTail = data.devCode ? ` Тестовый код: ${data.devCode}` : '';
        setAuthMessage(`Код отправлен на ${data.phoneMasked}.${devTail}`, data.devCode ? 'warn' : 'success');
    } catch (error) {
        setAuthMessage(error.message, 'error');
    }
});

codeForm.addEventListener('submit', async event => {
    event.preventDefault();
    setAuthMessage('Проверяем код...');
    try {
        currentSession = await postJson('/api/cabinet/verify-code', {
            phone: currentPhone,
            code: codeInput.value
        });
        showCabinet();
        await loadCabinetData();
    } catch (error) {
        setAuthMessage(error.message, 'error');
    }
});

changePhoneBtn.addEventListener('click', () => {
    codeForm.hidden = true;
    phoneForm.hidden = false;
    codeInput.value = '';
    setAuthMessage('');
    phoneInput.focus();
});

cabinetRefreshBtn.addEventListener('click', () => loadCabinetData(true));
detailsTabBtn?.addEventListener('click', () => setCabinetTab('details'));
managementTabBtn?.addEventListener('click', () => setCabinetTab('management'));

document.getElementById('monthSelect')?.addEventListener('change', () => loadCabinetData(false));

logoutBtn.addEventListener('click', async () => {
    await postJson('/api/cabinet/logout').catch(() => {});
    currentSession = null;
    selectedCabinetPartnerId = '';
    codeInput.value = '';
    showAuth();
});

window.addEventListener('load', async () => {
    currentSession = await fetchMe();
    if (!currentSession) {
        showAuth();
        return;
    }
    showCabinet();
    setCabinetTab(activeCabinetTab);
    await loadCabinetData();
});
