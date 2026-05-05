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

function detailCard(label, value, detail, row, key) {
    const sub = detail?.sub || '';
    const title = detail?.title || '';
    const tone = getDetailTone(row, key, detail);
    const q = Math.max(0, Math.min(1, Number(row.q?.[key] ?? 0)));
    const showBar = tone !== 'muted' && (detail?.format === 'percent' || value.endsWith('%'));
    return `
        <article class="cabinet-detail-card cabinet-detail-${tone}" title="${DashboardApp.escapeHtml(title)}">
            <div class="cabinet-detail-head">
                <div class="cabinet-detail-label">${DashboardApp.escapeHtml(label)}</div>
                <span class="cabinet-detail-status">${DashboardApp.escapeHtml(getDetailStatus(tone))}</span>
            </div>
            <div class="cabinet-detail-value">${DashboardApp.escapeHtml(value)}</div>
            <div class="cabinet-detail-sub">${DashboardApp.escapeHtml(sub)}</div>
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
    detailsPane.hidden = !detailsActive;
    managementPane.hidden = detailsActive;
    detailsTabBtn.classList.toggle('is-active', detailsActive);
    managementTabBtn.classList.toggle('is-active', !detailsActive);
    detailsTabBtn.setAttribute('aria-selected', detailsActive ? 'true' : 'false');
    managementTabBtn.setAttribute('aria-selected', !detailsActive ? 'true' : 'false');
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
                        <strong>${DashboardApp.escapeHtml(value)}</strong>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderBreakdownSection(title, lines = [], extraHtml = '', modifier = '') {
    const rowsHtml = renderBreakdownRows(lines);
    if (!rowsHtml && !extraHtml) return '';
    return `
        <section class="cabinet-breakdown-card${modifier ? ` ${modifier}` : ''}">
            <div class="cabinet-breakdown-head">
                <div class="cabinet-breakdown-title">${DashboardApp.escapeHtml(title)}</div>
            </div>
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
                            <span class="cabinet-remark-label">${DashboardApp.escapeHtml(item.label)}</span>
                            <span>${DashboardApp.escapeHtml(item.id ? `Сделка #${item.id}` : 'Сделка')}</span>
                        </div>
                        <div class="cabinet-remark-actions">
                            ${item.url
                                ? `<a class="cabinet-remark-open" href="${DashboardApp.escapeHtml(item.url)}" target="_blank" rel="noreferrer">Открыть в Bitrix</a>`
                                : ''}
                            <span class="cabinet-remark-status">-${DashboardApp.escapeHtml(DashboardApp.formatMetricNumber(item.penalty || 0, 2))}</span>
                        </div>
                    </div>
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

function renderSummaryHero(row, breakdown) {
    const finalScore = DashboardApp.formatMetricNumber(breakdown.summary?.finalScore || row.matrixTotalScore || 0, 1);
    const rawTotal = DashboardApp.formatMetricNumber(breakdown.summary?.rawTotal || row.rawTotal || 0, 1);
    const coeff = DashboardApp.formatMetricNumber(breakdown.summary?.complexityCoeff || row.complexityCoeff || 1, 2);
    const overdueCount = breakdown.remarks?.overdueCount || 0;

    const remarkTone = overdueCount
        ? `Сейчас на балл сильнее всего давят замечания: ${overdueCount} шт. с просрочкой.`
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
    const relationsScore = DashboardApp.formatMetricNumber(row.relationsScore || 0, 1);
    const moneyScore = DashboardApp.formatMetricNumber(row.moneyScore || 0, 1);
    const operationsScore = DashboardApp.formatMetricNumber(row.operationsScore || 0, 1);
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
        <div class="cabinet-overview-grid">
            <article class="cabinet-overview-card">
                <div class="cabinet-detail-label">Отношения</div>
                <div class="cabinet-overview-card-value">${DashboardApp.escapeHtml(relationsScore)}</div>
                <p>Обзвон, замечания, аудит</p>
            </article>
            <article class="cabinet-overview-card">
                <div class="cabinet-detail-label">Деньги</div>
                <div class="cabinet-overview-card-value">${DashboardApp.escapeHtml(moneyScore)}</div>
                <p>ФОТ, управленка</p>
            </article>
            <article class="cabinet-overview-card">
                <div class="cabinet-detail-label">ОПУ</div>
                <div class="cabinet-overview-card-value">${DashboardApp.escapeHtml(operationsScore)}</div>
                <p>Клостер, обучение, дисциплины, УМС/РМ</p>
            </article>
        </div>
    `;
}

function renderExplainedDetails(row) {
    const breakdown = row.breakdown || {};
    const sectionEntries = [
        renderSummaryHero(row, breakdown),
        renderBreakdownSection(
            'Замечания',
            breakdown.remarks?.lines || [],
            renderRemarkItems(breakdown.remarks?.items || []),
            'cabinet-breakdown-wide cabinet-breakdown-alert'
        ),
        renderBreakdownSection('Обзвон', breakdown.calls?.lines || []),
        renderBreakdownSection('ФОТ', breakdown.realization?.lines || []),
        renderBreakdownSection('Клостер', breakdown.clockster?.lines || []),
        renderBreakdownSection('Обучение', breakdown.training?.lines || []),
        renderBreakdownSection('Дисциплины', breakdown.discipline?.lines || []),
        renderBreakdownSection('УМС/РМ', breakdown.umsrm?.lines || [])
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

function renderCabinetRows(rows) {
    if (!rows.length) {
        cabinetHero.innerHTML = '';
        cabinetStats.innerHTML = metricCard('Данные', '-', 'Не нашли вашу строку в матрице');
        cabinetDetails.innerHTML = '<p class="cabinet-empty">Телефон подтвержден, но связка с партнером в матрице не найдена. Проверь ID элемента инфоблока 109 или имя партнера.</p>';
        cabinetDetailsExplained.innerHTML = '';
        return;
    }

    const row = rows[0];
    cabinetTitle.textContent = row.name || 'Личный кабинет';
    cabinetSubtitle.textContent = `ID ${row.bitrixPartnerId} · ${row.dealsCount || 0} объектов · ${currentSession?.phoneMasked || ''}`;
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
}

async function loadCabinetData(forceRefresh = false) {
    if (!currentSession) return;
    cabinetRefreshBtn.disabled = true;
    cabinetRefreshBtn.textContent = 'Обновляем...';
    try {
        DashboardApp.setupMonthSelect();
        await DashboardApp.loadDashboard({ forceRefresh });
        const rows = DashboardApp.getMatrixRowsSnapshot();
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
detailsTabBtn.addEventListener('click', () => setCabinetTab('details'));
managementTabBtn.addEventListener('click', () => setCabinetTab('management'));

document.getElementById('monthSelect')?.addEventListener('change', () => loadCabinetData(false));

logoutBtn.addEventListener('click', async () => {
    await postJson('/api/cabinet/logout').catch(() => {});
    currentSession = null;
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
