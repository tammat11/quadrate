'use strict';

const app = document.getElementById('bx-app');

// ——— Состояние ———
let currentPartner = null; // { id, name }
let allPartners = [];
let deals = [];    // сделки из Bitrix cat 79
let entries = [];  // внесённые данные из Postgres
let editingId = null;
let activeDealId = null; // deal.id для которого открыта форма
let selectedMonth = getCurrentMonthKey();
let selectedCompany = '';
let availableMonths = []; // реальные месяцы 2026 года, за которые есть сделки в воронке 79
let sortDir = 'asc'; // сортировка по марже: от минуса к плюсу по умолчанию
// Session token — mobile Bitrix webview often blocks third-party cookies, so we pass it explicitly
let sessionToken = new URLSearchParams(window.location.search).get('s') || '';

function getCurrentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key) {
    if (!key) return '';
    const [y, m] = key.split('-').map(Number);
    const names = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    return `${names[m - 1] || m} ${y}`;
}

function fmtMoney(val) {
    const n = Number(val);
    if (!n && n !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);
}

function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ——— API ———
function withSessionParam(path) {
    if (!sessionToken) return path;
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}s=${encodeURIComponent(sessionToken)}`;
}

async function api(method, path, body) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (sessionToken) opts.headers['X-Bx-Session'] = sessionToken;
    if (body !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    const res = await fetch(withSessionParam(path), opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

// ——— Вычисления ———
// Реализация без НДС = Сумма к оплате + Удержания ELS + Сумма авансирования + Сумма ФОТ (считается на сервере, приходит как deal.revenueNet)
function calcTotals(e, revenueNet) {
    const n = (k) => Number(e[k]) || 0;
    const revNet = Number(revenueNet) || 0;
    const fotTotal = n('fot_unofficial') + n('curators') + n('pieceworkers');
    const umsTotal = n('ums') + n('gen_cleaning');
    const otherExpenses = n('equipment_rent') + n('transport') + n('repairs') + n('consulting') + n('equipment');
    const partnerMargin = revNet - fotTotal - umsTotal - otherExpenses;
    const marginPct = revNet !== 0 ? (partnerMargin / revNet * 100) : null;
    return { fotTotal, umsTotal, otherExpenses, partnerMargin, marginPct };
}

// Цвет маржи — просто по знаку: плюс зелёный, минус красный
function marginColorClass(margin) {
    if (margin === null || margin === undefined) return '';
    return margin >= 0 ? 'is-pos' : 'is-neg';
}

// ——— Топбар с выбором месяца — только реальные месяцы 2026 года из воронки 79 ———
function renderMonthBar() {
    const months = availableMonths.length ? availableMonths : [selectedMonth];
    const options = months.map(key => ({ key, label: formatMonthLabel(key) }));
    return `
        <div class="bxa-topbar">
            <div class="bxa-partner-name">${escHtml(currentPartner.name)}</div>
            <div class="bxa-topbar-right">
                <select class="bxa-select" id="monthSelect">
                    ${options.map(o => `<option value="${o.key}"${o.key === selectedMonth ? ' selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>
        </div>`;
}

// ——— Компания сделки (реальное название карточки компании из Bitrix) ———
function dealCompany(deal) {
    return (deal.company || '').trim();
}

function getCompanyList() {
    const seen = new Set();
    const list = [];
    deals.forEach(d => {
        const c = dealCompany(d);
        if (c && !seen.has(c)) { seen.add(c); list.push(c); }
    });
    return list.sort((a, b) => a.localeCompare(b, 'ru'));
}

// ——— Список объектов (сделки из cat 79) ———
function renderDeals() {
    if (!deals.length) {
        return `<div class="bxa-empty">Нет объектов с "Месяц начисления" = ${escHtml(formatMonthLabel(selectedMonth))}.<br>Проверьте, что поле заполнено в сделках воронки 79.</div>`;
    }
    const companies = getCompanyList();
    let filtered = selectedCompany ? deals.filter(d => dealCompany(d) === selectedCompany) : deals.slice();

    // Сортировка по марже: от минуса к плюсу (или наоборот по клику на заголовок)
    const rowsData = filtered.map(deal => ({ deal, ...dealRowData(deal) }));
    rowsData.sort((a, b) => {
        const pa = a.c && a.c.marginPct !== null ? a.c.marginPct : Infinity;
        const pb = b.c && b.c.marginPct !== null ? b.c.marginPct : Infinity;
        return sortDir === 'asc' ? pa - pb : pb - pa;
    });

    // Итоги по всем видимым строкам — точная сумма по каждому полю (не по группам)
    const fieldTotals = Object.fromEntries(TABLE_ROW_FIELDS.map(f => [f, 0]));
    let totalRevenueNet = 0, totalMargin = 0;
    rowsData.forEach(({ deal, c, e }) => {
        totalRevenueNet += Number(deal.revenueNet) || 0;
        if (e) TABLE_ROW_FIELDS.forEach(f => { fieldTotals[f] += Number(e[f]) || 0; });
        if (c) totalMargin += c.partnerMargin;
    });
    const totalMarginPct = totalRevenueNet !== 0 ? (totalMargin / totalRevenueNet * 100) : null;

    return `
        <div class="bxa-section">
            <div class="bxa-section-head bxa-section-head-filters">
                <div class="bxa-section-head-row">
                    <span>Объекты за ${escHtml(formatMonthLabel(selectedMonth))}</span>
                    <span class="bxa-badge">${filtered.length}</span>
                </div>
                ${companies.length > 1 ? `
                    <select class="bxa-select bxa-select-sm bxa-company-filter" id="companyFilter">
                        <option value="">Все компании</option>
                        ${companies.map(c => `<option value="${escHtml(c)}"${c === selectedCompany ? ' selected' : ''}>${escHtml(c)}</option>`).join('')}
                    </select>` : ''}
                <button type="button" class="bxa-btn bxa-btn-sm" id="transferPrevMonthBtn">↺ Перенести данные с прошлого месяца</button>
            </div>
            ${!filtered.length ? '<div class="bxa-empty">Нет объектов по выбранной компании.</div>' : ''}

            <!-- Мобильные карточки -->
            <div class="bxa-deals-cards">
                ${rowsData.map(({ deal, c, filled }) => {
                    const colorClass = c ? marginColorClass(c.partnerMargin) : '';
                    return `
                        <div class="bxa-deal-card ${filled ? 'is-filled' : ''}" data-open-deal="${escHtml(String(deal.id))}">
                            <div class="bxa-deal-info">
                                <div class="bxa-deal-title">${escHtml(deal.title)} <span class="bxa-deal-id">${escHtml(String(deal.id))}</span></div>
                                ${Number(deal.revenue) ? `
                                    <div class="bxa-deal-nums">
                                        <div class="bxa-mini-chip"><span>Реализация</span><strong>${fmtMoney(deal.revenue)}</strong></div>
                                        ${c ? `<div class="bxa-mini-chip bxa-mini-chip-total ${colorClass}"><span>Маржа</span><strong>${fmtMoney(c.partnerMargin)}</strong></div>` : ''}
                                        ${c ? `<div class="bxa-mini-chip bxa-mini-chip-total ${colorClass}"><span>Маржинальность</span><strong>${c.marginPct !== null ? c.marginPct.toFixed(1) + '%' : '—'}</strong></div>` : ''}
                                    </div>` : ''}
                                ${!c && !Number(deal.revenue) ? '<div class="bxa-deal-empty">Не заполнено</div>' : ''}
                            </div>
                            <div class="bxa-deal-status">${filled ? '✓' : '+'}</div>
                        </div>`;
                }).join('')}
            </div>

            <!-- Табличный вид для компьютера — редактирование прямо в ячейках -->
            <div class="bxa-deals-table-wrap">
                <table class="bxa-deals-table">
                    <thead>
                        <tr>
                            <th class="bxa-col-title">Клиент / Объект</th>
                            <th>Реализация без НДС</th>
                            <th>ФОТ неофф.</th>
                            <th>Кураторы</th>
                            <th>УМС</th>
                            <th>Аренда тех.</th>
                            <th>Транспорт</th>
                            <th>Ремонт</th>
                            <th>Ген.уборка</th>
                            <th>Консалтинг</th>
                            <th>Оборудование</th>
                            <th>Сумма маржи</th>
                            <th class="bxa-th-sortable" id="marginSortHead" data-dir="${sortDir}">Маржинальность <span class="bxa-sort-icon">${sortDir === 'asc' ? '▲' : '▼'}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsData.map(({ deal, c, filled, e }) => {
                            const val = (k) => e && Number(e[k]) ? Number(e[k]) : '';
                            const input = (k) => `<input class="bxa-cell-input" type="text" inputmode="decimal" data-deal-id="${escHtml(String(deal.id))}" data-field="${k}" value="${val(k) ? fmtMoney(val(k)) : ''}" placeholder="0">`;
                            const colorClass = c ? marginColorClass(c.partnerMargin) : '';
                            return `
                                <tr class="bxa-deals-row ${filled ? 'is-filled' : ''}" data-deal-id="${escHtml(String(deal.id))}">
                                    <td class="bxa-col-title">
                                        <div class="bxa-table-title">${escHtml(deal.title)}</div>
                                        <span class="bxa-deal-id">${escHtml(String(deal.id))}</span>
                                    </td>
                                    <td class="bxa-num-cell">${Number(deal.revenueNet) ? fmtMoney(deal.revenueNet) : '—'}</td>
                                    <td class="bxa-cell">${input('fot_unofficial')}</td>
                                    <td class="bxa-cell">${input('curators')}</td>
                                    <td class="bxa-cell">${input('ums')}</td>
                                    <td class="bxa-cell">${input('equipment_rent')}</td>
                                    <td class="bxa-cell">${input('transport')}</td>
                                    <td class="bxa-cell">${input('repairs')}</td>
                                    <td class="bxa-cell">${input('gen_cleaning')}</td>
                                    <td class="bxa-cell">${input('consulting')}</td>
                                    <td class="bxa-cell">${input('equipment')}</td>
                                    <td class="bxa-num-cell bxa-margin-sum-cell ${colorClass}" data-margin-sum-cell>${c ? fmtMoney(c.partnerMargin) : '—'}</td>
                                    <td class="bxa-num-cell bxa-margin-cell ${colorClass}" data-margin-cell>${c && c.marginPct !== null ? c.marginPct.toFixed(1) + '%' : '—'}</td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <!-- Итоговая строка — отдельная таблица ВНЕ прокручиваемой области, чтобы не зависеть
                 от position:sticky на tfoot/td (ненадёжно работает в связке с border-collapse
                 в разных браузерах — строка обрезалась/пропадала при скролле). Всегда видна целиком. -->
            <div class="bxa-deals-totals-wrap">
                <table class="bxa-deals-table bxa-deals-totals-table">
                    <tbody>
                        <tr class="bxa-totals-row">
                            <td class="bxa-col-title">Итого</td>
                            <td class="bxa-num-cell">${fmtMoney(totalRevenueNet)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.fot_unofficial)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.curators)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.ums)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.equipment_rent)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.transport)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.repairs)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.gen_cleaning)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.consulting)}</td>
                            <td class="bxa-num-cell">${fmtMoney(fieldTotals.equipment)}</td>
                            <td class="bxa-num-cell ${marginColorClass(totalMargin)}">${fmtMoney(totalMargin)}</td>
                            <td class="bxa-num-cell ${marginColorClass(totalMargin)}">${totalMarginPct !== null ? totalMarginPct.toFixed(1) + '%' : '—'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// Поля-колонки, реально показанные и редактируемые в таблице
const TABLE_ROW_FIELDS = ['fot_unofficial','curators','ums','equipment_rent','transport','repairs','gen_cleaning','consulting','equipment'];
// Поля, которые убрали из UI по просьбе заказчика, но их значения нельзя терять при автосохранении —
// переносим их как есть из уже сохранённой записи/данных Bitrix, не давая пользователю их редактировать здесь
const PRESERVED_FIELDS = ['pieceworkers'];

function parseNum(raw) {
    if (raw === null || raw === undefined) return 0;
    const cleaned = String(raw).replace(/[^\d.,-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function bindTableInputs() {
    const table = document.querySelector('.bxa-deals-table');
    if (!table) return;
    table.querySelectorAll('.bxa-cell-input').forEach(input => {
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
        input.addEventListener('focus', () => {
            // На время редактирования показываем «сырое» число без разделителей тысяч
            const n = parseNum(input.value);
            input.value = n ? String(n) : '';
        });
        input.addEventListener('blur', () => {
            const n = parseNum(input.value);
            input.value = n ? fmtMoney(n) : '';
            saveTableRow(input.dataset.dealId);
        });
    });
    table.querySelector('#marginSortHead')?.addEventListener('click', () => {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        document.getElementById('dealsArea').innerHTML = renderDeals();
        bindDealActions();
    });
}

let rowSaveTimers = {};
async function saveTableRow(dealId) {
    const row = document.querySelector(`.bxa-deals-row[data-deal-id="${dealId}"]`);
    if (!row) return;
    const deal = deals.find(d => String(d.id) === String(dealId));
    if (!deal) return;

    const existingEntry = entries.find(en => en.deal_id === String(dealId));
    const preservedSource = existingEntry || deal.bxValues || {};

    const values = {};
    TABLE_ROW_FIELDS.forEach(f => {
        const el = row.querySelector(`[data-field="${f}"]`);
        values[f] = parseNum(el?.value);
    });
    // Переносим скрытые поля (Сдельщики и т.п.) неизменными — они не редактируются в этой таблице
    PRESERVED_FIELDS.forEach(f => { values[f] = Number(preservedSource[f]) || 0; });

    const hasAnyValue = TABLE_ROW_FIELDS.some(f => values[f]);

    // Live-update margin cells instantly, before the network round-trip
    const marginCell = row.querySelector('[data-margin-cell]');
    const marginSumCell = row.querySelector('[data-margin-sum-cell]');
    const c = calcTotals(values, deal.revenueNet);
    const colorClass = hasAnyValue ? marginColorClass(c.partnerMargin) : '';
    if (marginCell) {
        marginCell.textContent = hasAnyValue && c.marginPct !== null ? c.marginPct.toFixed(1) + '%' : '—';
        marginCell.className = 'bxa-num-cell bxa-margin-cell' + (colorClass ? ' ' + colorClass : '');
    }
    if (marginSumCell) {
        marginSumCell.textContent = hasAnyValue ? fmtMoney(c.partnerMargin) : '—';
        marginSumCell.className = 'bxa-num-cell bxa-margin-sum-cell' + (colorClass ? ' ' + colorClass : '');
    }
    row.classList.toggle('is-filled', hasAnyValue);

    // Nothing entered and no saved row exists — nothing to persist
    if (!hasAnyValue && !existingEntry) return;

    // Debounce network save per row so fast tabbing between fields doesn't fire N requests
    clearTimeout(rowSaveTimers[dealId]);
    rowSaveTimers[dealId] = setTimeout(async () => {
        const payload = {
            ...values,
            deal_id: String(dealId),
            month_key: selectedMonth,
            address: existingEntry?.address || deal.title,
        };
        if (existingEntry) payload.id = existingEntry.id;
        row.classList.add('is-saving');
        try {
            const result = await api('POST', `/api/bitrix-app/entries?partner_id=${encodeURIComponent(currentPartner.id)}`, payload);
            if (existingEntry) {
                entries = entries.map(en => Number(en.id) === Number(existingEntry.id) ? result.entry : en);
            } else {
                entries = [result.entry, ...entries];
            }
            row.classList.toggle('is-filled', hasAnyValue);
        } catch (err) {
            showNotice(err.message || 'Ошибка сохранения');
        } finally {
            row.classList.remove('is-saving');
        }
    }, 500);
}

function dealRowData(deal) {
    const entry = entries.find(e => e.deal_id === String(deal.id));
    const hasBxValues = deal.bxValues && Object.keys(deal.bxValues).length > 0;
    const source = entry || (hasBxValues ? deal.bxValues : null);
    const hasAnyValue = source && TABLE_ROW_FIELDS.some(f => Number(source[f]));
    const c = hasAnyValue ? calcTotals(source, deal.revenueNet) : null;
    const filled = !!entry && hasAnyValue;
    return { entry, c, filled, e: source };
}

// ——— Форма ———
function renderForm(deal, entry = null) {
    const bxValues = (!entry && deal.bxValues) ? deal.bxValues : null;
    const v = (k) => {
        if (entry) return Number(entry[k]) || '';
        if (bxValues && bxValues[k]) return bxValues[k];
        return '';
    };
    const s = (k) => entry ? escHtml(entry[k] || '') : '';
    return `
        <div class="bxa-form-header">
            <div>
                <div class="bxa-form-deal-title">${escHtml(deal.title)} <span class="bxa-deal-id">${escHtml(String(deal.id))}</span></div>
                ${Number(deal.revenueNet) ? `<div class="bxa-form-deal-rev">Реализация без НДС: <strong>${fmtMoney(deal.revenueNet)}</strong></div>` : ''}
            </div>
            <button type="button" id="closeFormBtn" class="bxa-icon-btn">✕</button>
        </div>
        ${bxValues ? '<div class="bxa-bx-notice">Часть полей предзаполнена из данных Bitrix — проверьте и сохраните</div>' : ''}

        <div class="bxa-copy-bar" id="copyBar"></div>

        <form class="bxa-form" id="mgmtForm">
            <input type="hidden" name="id" value="${entry ? entry.id : ''}">
            <input type="hidden" name="deal_id" value="${escHtml(String(deal.id))}">
            <input type="hidden" name="month_key" value="${escHtml(selectedMonth)}">
            <input type="hidden" name="address" value="${entry ? s('address') : escHtml(deal.title)}">
            <!-- Сдельщики убраны из формы, но значение сохраняем неизменным, чтобы не затирать данные -->
            <input type="hidden" name="pieceworkers" value="${v('pieceworkers') || 0}">

            <div class="bxa-form-section">
                <div class="bxa-section-title">ФОТ</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">ФОТ неофф.<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="fot_unofficial" value="${v('fot_unofficial')}" placeholder="0"></label>
                    <label class="bxa-label">Кураторы<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="curators" value="${v('curators')}" placeholder="0"></label>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">Расходы</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">УМС<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="ums" value="${v('ums')}" placeholder="0"></label>
                    <label class="bxa-label">Аренда тех.<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="equipment_rent" value="${v('equipment_rent')}" placeholder="0"></label>
                    <label class="bxa-label">Транспорт<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="transport" value="${v('transport')}" placeholder="0"></label>
                    <label class="bxa-label">Ремонт<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="repairs" value="${v('repairs')}" placeholder="0"></label>
                    <label class="bxa-label">Ген.уборка<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="gen_cleaning" value="${v('gen_cleaning')}" placeholder="0"></label>
                    <label class="bxa-label">Консалтинг<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="consulting" value="${v('consulting')}" placeholder="0"></label>
                    <label class="bxa-label">Оборудование<input class="bxa-input bxa-num" inputmode="decimal" type="number" name="equipment" value="${v('equipment')}" placeholder="0"></label>
                </div>
            </div>

            <div class="bxa-result" id="formResult">
                <div class="bxa-result-item"><span>Реализация без НДС</span><strong>${fmtMoney(deal.revenueNet)}</strong></div>
                <div class="bxa-result-item bxa-result-total"><span>Маржинальность</span><strong data-c="pct">—</strong></div>
            </div>

            <div class="bxa-form-error" id="formError" hidden></div>
            <div class="bxa-form-btns">
                <button type="button" id="cancelFormBtn" class="bxa-btn">Отмена</button>
                <button type="submit" id="submitBtn" class="bxa-btn bxa-btn-primary">
                    ${entry ? 'Сохранить изменения' : 'Сохранить'}
                </button>
            </div>
        </form>`;
}

const COPY_FIELDS = ['fot_unofficial','curators','pieceworkers','ums','equipment_rent','transport','repairs','gen_cleaning','consulting','equipment'];

async function renderCopyBar(container, dealId, partnerId, currentEntry) {
    const bar = container.querySelector('#copyBar');
    if (!bar) return;
    try {
        const data = await api('GET', `/api/bitrix-app/deal-history?deal_id=${encodeURIComponent(dealId)}&partner_id=${encodeURIComponent(partnerId)}`);
        const history = (data.entries || []).filter(e => e.month_key !== selectedMonth);
        if (!history.length) { bar.innerHTML = ''; return; }
        bar.innerHTML = `
            <span class="bxa-copy-label">Перенести из месяца:</span>
            <select class="bxa-select bxa-select-sm" id="copyMonthSelect">
                <option value="">— выбрать —</option>
                ${history.map(e => `<option value="${escHtml(e.month_key)}">${escHtml(formatMonthLabel(e.month_key))}</option>`).join('')}
            </select>
            <button type="button" class="bxa-btn bxa-btn-sm" id="copyMonthBtn" disabled>Перенести</button>`;
        const sel = bar.querySelector('#copyMonthSelect');
        const btn = bar.querySelector('#copyMonthBtn');
        sel.addEventListener('change', () => { btn.disabled = !sel.value; });
        btn.addEventListener('click', () => {
            const src = history.find(e => e.month_key === sel.value);
            if (!src) return;
            const form = container.querySelector('#mgmtForm');
            COPY_FIELDS.forEach(f => {
                const input = form.querySelector(`[name="${f}"]`);
                if (input) input.value = Number(src[f]) || '';
            });
            container.querySelectorAll('.bxa-num').forEach(el => el.dispatchEvent(new Event('input')));
            showNotice(`Данные перенесены из ${formatMonthLabel(sel.value)}`);
        });
    } catch { bar.innerHTML = ''; }
}

// ——— Расчёт в форме ———
function attachCalc(container, revenue) {
    const n = (name) => Number(container.querySelector(`[name="${name}"]`)?.value) || 0;
    const pctEl = container.querySelector('[data-c="pct"]');

    function calc() {
        const c = calcTotals({
            fot_unofficial: n('fot_unofficial'),
            curators: n('curators'), pieceworkers: n('pieceworkers'),
            ums: n('ums'), equipment_rent: n('equipment_rent'), transport: n('transport'),
            repairs: n('repairs'), gen_cleaning: n('gen_cleaning'),
            consulting: n('consulting'), equipment: n('equipment')
        }, revenue);
        if (pctEl) {
            pctEl.textContent = c.marginPct !== null ? c.marginPct.toFixed(1) + '%' : '—';
            pctEl.className = marginColorClass(c.marginPct !== null ? c.partnerMargin : null);
        }
        container.querySelector('#formResult')?.classList.toggle('is-neg', c.partnerMargin < 0);
    }
    container.querySelectorAll('.bxa-num').forEach(el => el.addEventListener('input', calc));
    calc();
}

// ——— Загрузка данных ———
async function loadData() {
    const [dealsData, entriesData] = await Promise.all([
        api('GET', `/api/bitrix-app/deals?partner_id=${encodeURIComponent(currentPartner.id)}&month=${encodeURIComponent(selectedMonth)}`).catch(() => ({ deals: [] })),
        api('GET', `/api/bitrix-app/entries?partner_id=${encodeURIComponent(currentPartner.id)}&month=${encodeURIComponent(selectedMonth)}`).catch(() => ({ entries: [] }))
    ]);
    deals = Array.isArray(dealsData.deals) ? dealsData.deals : [];
    entries = Array.isArray(entriesData.entries) ? entriesData.entries : [];
    if (Array.isArray(dealsData.availableMonths) && dealsData.availableMonths.length) {
        availableMonths = dealsData.availableMonths;
        if (!availableMonths.includes(selectedMonth)) {
            // Текущий (реальный) месяц не входит в реальные месяцы сделок — переключаемся
            // на самый свежий доступный и перезапрашиваем данные именно под него,
            // иначе селектор покажет новый месяц, а на экране останутся пустые данные от старого.
            selectedMonth = availableMonths[0];
            await loadData();
        }
    }
}

// ——— Рендер основного экрана ———
function renderMain() {
    app.innerHTML = `
        ${renderMonthBar()}
        <div id="formArea" class="bxa-form-area" hidden></div>
        <div id="dealsArea">${renderDeals()}</div>
    `;
    bindMain();
}

function openForm(dealId, entry = null) {
    const deal = deals.find(d => String(d.id) === String(dealId));
    if (!deal) return;
    activeDealId = String(dealId);
    const fa = document.getElementById('formArea');
    fa.innerHTML = renderForm(deal, entry);
    fa.hidden = false;
    attachCalc(fa, deal.revenueNet);
    renderCopyBar(fa, dealId, currentPartner.id, entry);

    const close = () => { fa.hidden = true; fa.innerHTML = ''; editingId = null; activeDealId = null; };
    fa.querySelector('#closeFormBtn')?.addEventListener('click', close);
    fa.querySelector('#cancelFormBtn')?.addEventListener('click', close);

    fa.querySelector('#mgmtForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = fa.querySelector('#submitBtn');
        const errEl = fa.querySelector('#formError');
        btn.disabled = true;
        errEl.hidden = true;
        try {
            const data = Object.fromEntries(new FormData(e.target).entries());
            if (editingId) data.id = editingId;
            const result = await api('POST', `/api/bitrix-app/entries?partner_id=${encodeURIComponent(currentPartner.id)}`, data);
            if (editingId) {
                entries = entries.map(en => Number(en.id) === editingId ? result.entry : en);
            } else {
                entries = [result.entry, ...entries];
            }
            editingId = null;
            fa.hidden = true; fa.innerHTML = '';
            document.getElementById('dealsArea').innerHTML = renderDeals();
            bindDealActions();
            showNotice('Сохранено в БД и отправлено в Битрикс');
        } catch (err) {
            errEl.textContent = err.message || 'Ошибка при сохранении';
            errEl.hidden = false;
        } finally {
            btn.disabled = false;
        }
    });
}

function showNotice(text) {
    const el = document.createElement('div');
    el.className = 'bxa-notice';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('visible'), 10);
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, 3000);
}

function bindMain() {
    document.getElementById('monthSelect')?.addEventListener('change', async (e) => {
        selectedMonth = e.target.value;
        selectedCompany = '';
        showLoading('Загрузка...');
        await loadData().catch(() => {});
        renderMain();
    });
    bindDealActions();
}

function bindDealActions() {
    const area = document.getElementById('dealsArea');
    if (!area) return;
    // Re-bind on every render — renderDeals() recreates the <select>, so the old listener would be lost otherwise
    document.getElementById('companyFilter')?.addEventListener('change', (e) => {
        selectedCompany = e.target.value;
        document.getElementById('dealsArea').innerHTML = renderDeals();
        bindDealActions();
    });
    area.querySelectorAll('[data-open-deal]').forEach(card => {
        card.addEventListener('click', () => {
            const dealId = card.dataset.openDeal;
            const entry = entries.find(e => e.deal_id === dealId);
            editingId = entry ? Number(entry.id) : null;
            openForm(dealId, entry || null);
        });
    });
    document.getElementById('transferPrevMonthBtn')?.addEventListener('click', transferFromPreviousMonth);
    bindTableInputs();
}

function shiftMonthKey(monthKey, delta) {
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Переносит данные объектов с предыдущего месяца в текущий — сопоставление по названию
// сделки (адресу), т.к. Bitrix каждый месяц создаёт новую сделку с новым ID для того же объекта.
// Заполняет только пустые строки, уже внесённые в этом месяце данные не трогает.
async function transferFromPreviousMonth() {
    const btn = document.getElementById('transferPrevMonthBtn');
    const prevMonth = shiftMonthKey(selectedMonth, -1);
    if (btn) { btn.disabled = true; btn.textContent = 'Переносим...'; }
    try {
        const prevData = await api('GET', `/api/bitrix-app/entries?partner_id=${encodeURIComponent(currentPartner.id)}&month=${encodeURIComponent(prevMonth)}`);
        const prevEntries = Array.isArray(prevData.entries) ? prevData.entries : [];
        if (!prevEntries.length) {
            showNotice(`Нет данных за ${formatMonthLabel(prevMonth)}`);
            return;
        }
        const prevByAddress = new Map();
        prevEntries.forEach(e => { if (e.address) prevByAddress.set(e.address, e); });

        let transferred = 0;
        for (const deal of deals) {
            const existingEntry = entries.find(en => en.deal_id === String(deal.id));
            if (existingEntry && TABLE_ROW_FIELDS.some(f => Number(existingEntry[f]))) continue; // уже заполнено — не трогаем
            const prevEntry = prevByAddress.get(deal.title);
            if (!prevEntry) continue;

            const payload = { deal_id: String(deal.id), month_key: selectedMonth, address: deal.title };
            TABLE_ROW_FIELDS.forEach(f => { payload[f] = Number(prevEntry[f]) || 0; });
            PRESERVED_FIELDS.forEach(f => { payload[f] = Number(prevEntry[f]) || 0; });
            if (existingEntry) payload.id = existingEntry.id;

            try {
                const result = await api('POST', `/api/bitrix-app/entries?partner_id=${encodeURIComponent(currentPartner.id)}`, payload);
                if (existingEntry) {
                    entries = entries.map(en => Number(en.id) === Number(existingEntry.id) ? result.entry : en);
                } else {
                    entries = [result.entry, ...entries];
                }
                transferred++;
            } catch {}
        }

        document.getElementById('dealsArea').innerHTML = renderDeals();
        bindDealActions();
        showNotice(transferred ? `Перенесено объектов: ${transferred}` : `Нечего переносить — все объекты уже совпадают или заполнены`);
    } catch (err) {
        showNotice(err.message || 'Ошибка переноса');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '↺ Перенести данные с прошлого месяца'; }
    }
}

function showLoading(text = 'Загрузка...') {
    app.innerHTML = `<div class="bxa-loading"><div class="bxa-loading-spinner"></div><div class="bxa-loading-text">${escHtml(text)}</div></div>`;
}

function showError(msg) {
    app.innerHTML = `<div class="bxa-error"><div class="bxa-error-icon">!</div><div>${escHtml(msg)}</div></div>`;
}

// ——— Инициализация ———
async function init() {
    showLoading('Авторизация...');
    try {
        let loginData;
        const params = new URLSearchParams(window.location.search);
        const bxAuth = params.get('AUTH_ID') || params.get('auth');
        const bxDomain = params.get('DOMAIN') || params.get('domain');

        if (bxAuth && bxDomain) {
            loginData = await api('POST', '/api/bitrix-app/login', { auth: bxAuth, domain: bxDomain });
            if (loginData.sessionToken) sessionToken = loginData.sessionToken;
        } else if (sessionToken) {
            loginData = await api('GET', '/api/bitrix-app/me');
        } else {
            const meRes = await fetch('/api/bitrix-app/me', { credentials: 'same-origin' });
            if (!meRes.ok) {
                showError('Откройте это приложение из Битрикс24.');
                return;
            }
            loginData = await meRes.json();
        }

        if (loginData.partnerBitrixId) {
            currentPartner = { id: loginData.partnerBitrixId, name: loginData.partnerName || loginData.partnerBitrixId };
        } else if (loginData.allPartners?.length) {
            allPartners = loginData.allPartners;
            app.innerHTML = `
                <div class="bxa-picker">
                    <div class="bxa-picker-title">Выберите партнёра</div>
                    <select class="bxa-select" id="partnerSelect">
                        <option value="">— выберите —</option>
                        ${allPartners.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.name)}</option>`).join('')}
                    </select>
                    <button class="bxa-btn bxa-btn-primary" id="partnerSelectBtn" disabled>Продолжить</button>
                </div>`;
            document.getElementById('partnerSelect').addEventListener('change', (e) => {
                document.getElementById('partnerSelectBtn').disabled = !e.target.value;
            });
            document.getElementById('partnerSelectBtn').addEventListener('click', async () => {
                const id = document.getElementById('partnerSelect').value;
                const p = allPartners.find(x => x.id === id);
                if (!p) return;
                currentPartner = p;
                showLoading('Загружаем данные...');
                await loadData().catch(() => {});
                renderMain();
            });
            return;
        } else {
            showError('Не найден партнёр для вашего аккаунта. Обратитесь к администратору.');
            return;
        }

        showLoading('Загружаем данные...');
        await loadData();
        renderMain();
    } catch (err) {
        showError(err.message || 'Ошибка инициализации');
    }
}

init();
