'use strict';

const app = document.getElementById('bx-app');

// ——— Состояние ———
let currentPartner = null; // { id, name }
let allPartners = [];
let mysqlRows = [];       // данные из Marja_full
let entries = [];         // наши данные из Postgres
let editingId = null;
let prefillMysql = null;  // строка из MySQL для предзаполнения
let selectedMonth = getCurrentMonthKey();

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
async function api(method, path, body) {
    const opts = { method, credentials: 'same-origin' };
    if (body !== undefined) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

// ——— Вычисления ———
function calcTotals(e) {
    const n = (k) => Number(e[k]) || 0;
    const revNet    = n('revenue_gross') - n('vat');
    const fotTotal  = n('fot_official') + n('fot_unofficial') + n('kaspi_jti') + n('curators') + n('pieceworkers') + n('self_employed') + n('payroll_taxes') + n('official_salary');
    const umsTotal  = n('ums') + n('ums_els') + n('eco_line_ums') + n('gen_cleaning');
    const other     = n('advances') + n('transport') + n('equipment_rent') + n('goods') + n('repairs') + n('consulting') + n('equipment') + n('buh_services');
    const taxes     = n('ipn_kpn') + n('self_employed_taxes') + n('ip_expenses');
    const pMargin   = revNet - fotTotal - umsTotal - other - taxes;
    const pct       = revNet !== 0 ? pMargin / revNet * 100 : null;
    return { revNet, fotTotal, umsTotal, pMargin, pct };
}

// ——— Шаблоны ———
function renderMonthBar() {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        options.push({ key, label: formatMonthLabel(key) });
    }
    return `
        <div class="bxa-topbar">
            <div class="bxa-partner-name">${escHtml(currentPartner.name)}</div>
            <div class="bxa-topbar-right">
                <select class="bxa-select" id="monthSelect">
                    ${options.map(o => `<option value="${o.key}"${o.key === selectedMonth ? ' selected' : ''}>${o.label}</option>`).join('')}
                </select>
                <button class="bxa-btn bxa-btn-primary" id="addBtn">+ Добавить объект</button>
            </div>
        </div>
    `;
}

function renderMysqlTable() {
    if (!mysqlRows.length) return '';
    const key = (row) => String(row.external_id || '');
    return `
        <div class="bxa-section">
            <div class="bxa-section-head">Данные из Marja_full <span class="bxa-badge">${mysqlRows.length}</span></div>
            <div class="bxa-mysql-table-wrap">
                <table class="bxa-mysql-table">
                    <thead><tr>
                        <th>Название / Адрес</th>
                        <th>ИП</th>
                        <th>Реализация без НДС</th>
                        <th>ИТОГО ФОТ</th>
                        <th>ИТОГО УМС</th>
                        <th>Маржа партнёра</th>
                        <th>Маржа %</th>
                        <th></th>
                    </tr></thead>
                    <tbody>
                        ${mysqlRows.map(row => {
                            const revNet = Number(row['Реализация без НДС']) || (Number(row['Реализация с НДС']) - Number(row['НДС']));
                            const fotTotal = Number(row['ИТОГО ФОТ']) || 0;
                            const umsTotal = Number(row['ИТОГО УМС']) || 0;
                            const pMargin = Number(row['Маржа Партнера']) || 0;
                            const pct = Number(row['Маржа']) || 0;
                            const pctClass = pct < 0.12 ? 'is-good' : pct < 0.30 ? 'is-warn' : 'is-bad';
                            return `
                                <tr data-mysql-id="${escHtml(key(row))}">
                                    <td>${escHtml(row['Название'] || row['Адрес_объекта_инфо'] || '—')}</td>
                                    <td>${escHtml(row['Наименование_ИП_инфо'] || '—')}</td>
                                    <td class="num">${fmtMoney(revNet)}</td>
                                    <td class="num">${fmtMoney(fotTotal)}</td>
                                    <td class="num">${fmtMoney(umsTotal)}</td>
                                    <td class="num">${fmtMoney(pMargin)}</td>
                                    <td class="num ${pctClass}">${(pct * 100).toFixed(1)}%</td>
                                    <td><button class="bxa-btn bxa-btn-sm" data-prefill="${escHtml(key(row))}">Внести</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderEntries() {
    if (!entries.length) {
        return `<div class="bxa-empty">Внесённых данных за ${escHtml(formatMonthLabel(selectedMonth))} нет.</div>`;
    }
    return `
        <div class="bxa-section">
            <div class="bxa-section-head">Внесённые данные <span class="bxa-badge">${entries.length}</span></div>
            ${entries.map(e => {
                const c = calcTotals(e);
                const pctTxt = c.pct !== null ? c.pct.toFixed(1) + '%' : '—';
                const pctClass = c.pct === null ? '' : c.pct < 12 ? 'is-good' : c.pct < 30 ? 'is-warn' : 'is-bad';
                return `
                    <div class="bxa-entry">
                        <div class="bxa-entry-top">
                            <div>
                                <div class="bxa-entry-name">${escHtml(e.address || '—')}</div>
                                ${e.ip_name ? `<div class="bxa-entry-sub">${escHtml(e.ip_name)}</div>` : ''}
                            </div>
                            <div class="bxa-entry-acts">
                                <button class="bxa-icon-btn" data-edit="${e.id}">✎</button>
                                <button class="bxa-icon-btn bxa-icon-del" data-delete="${e.id}">✕</button>
                            </div>
                        </div>
                        <div class="bxa-entry-nums">
                            <div class="bxa-num-item"><span>Реализация (без НДС)</span><strong>${fmtMoney(c.revNet)}</strong></div>
                            <div class="bxa-num-item"><span>ИТОГО ФОТ</span><strong>${fmtMoney(c.fotTotal)}</strong></div>
                            <div class="bxa-num-item"><span>ИТОГО УМС</span><strong>${fmtMoney(c.umsTotal)}</strong></div>
                            <div class="bxa-num-item"><span>Маржа партнёра</span><strong>${fmtMoney(c.pMargin)}</strong></div>
                            <div class="bxa-num-item"><span>Маржа %</span><strong class="${pctClass}">${pctTxt}</strong></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderForm(entry = null, mysql = null) {
    const v = (k) => {
        if (entry && (Number(entry[k]) || entry[k])) return Number(entry[k]) || '';
        if (mysql) {
            const map = {
                revenue_gross: 'Реализация с НДС', vat: 'НДС',
                fot_official: 'ФОТ ОФФ Битрикс', fot_unofficial: 'ФОТ НЕОФ',
                kaspi_jti: 'Kaspi/ JTI', curators: 'Кураторы', pieceworkers: 'Сдельщики',
                self_employed: 'Самозанятые', payroll_taxes: 'Налоги_по_зарплате',
                official_salary: 'ОФ ЗП 1С',
                ums: 'УМС', ums_els: 'УМС ELS', eco_line_ums: 'Eco Line УМС', gen_cleaning: 'Ген. Уборка',
                advances: 'Авансирования', transport: 'Транспортные расходы',
                equipment_rent: 'Аренда спецтехники', goods: 'Сумма_Товара',
                repairs: 'Ремонт', consulting: 'Консалтинг', equipment: 'Оборудование',
                buh_services: 'Бух. Услуги', ipn_kpn: 'ИПН/КПН',
                self_employed_taxes: 'Налоги самозанятых', ip_expenses: 'Расходы ИП'
            };
            const val = mysql[map[k]];
            return val ? Number(val) || '' : '';
        }
        return '';
    };
    const s = (k) => {
        if (entry) return escHtml(entry[k] || '');
        if (mysql) {
            const strMap = { address: ['Адрес_объекта_инфо','Название'], ip_name: ['Наименование_ИП_инфо'], company_name: ['Наименовение_компании_1'] };
            for (const col of (strMap[k] || [])) {
                if (mysql[col]) return escHtml(mysql[col]);
            }
        }
        return '';
    };
    const month = entry ? escHtml(entry.month_key) : (mysql ? escHtml(mysql['__month_key'] || selectedMonth) : selectedMonth);
    const mysqlId = mysql ? String(mysql.external_id || '') : (entry?.mysql_external_id || '');

    return `
        <form class="bxa-form" id="mgmtForm">
            <input type="hidden" name="id" value="${entry ? entry.id : ''}">
            <input type="hidden" name="mysql_external_id" value="${escHtml(mysqlId)}">
            ${mysql ? `<div class="bxa-form-source">Данные из Marja_full · ${escHtml(mysql['Название'] || mysql['Адрес_объекта_инфо'] || '')}</div>` : ''}

            <div class="bxa-form-section">
                <div class="bxa-form-row bxa-form-row-4">
                    <label class="bxa-label">Месяц <span class="bxa-req">*</span>
                        <input class="bxa-input" type="month" name="month_key" required value="${month}">
                    </label>
                    <label class="bxa-label">Адрес объекта
                        <input class="bxa-input" type="text" name="address" value="${s('address')}" placeholder="ул. Абая, 10">
                    </label>
                    <label class="bxa-label">ИП
                        <input class="bxa-input" type="text" name="ip_name" value="${s('ip_name')}" placeholder="ИП Иванов">
                    </label>
                    <label class="bxa-label">Компания
                        <input class="bxa-input" type="text" name="company_name" value="${s('company_name')}" placeholder="ТОО Пример">
                    </label>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">Реализация</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">С НДС<input class="bxa-input bxa-num" type="number" name="revenue_gross" value="${v('revenue_gross')}" placeholder="0"></label>
                    <label class="bxa-label">НДС<input class="bxa-input bxa-num" type="number" name="vat" value="${v('vat')}" placeholder="0"></label>
                    <div class="bxa-computed"><span>Без НДС</span><strong data-c="revNet">—</strong></div>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">ФОТ</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">ФОТ офф.<input class="bxa-input bxa-num" type="number" name="fot_official" value="${v('fot_official')}" placeholder="0"></label>
                    <label class="bxa-label">ФОТ неофф.<input class="bxa-input bxa-num" type="number" name="fot_unofficial" value="${v('fot_unofficial')}" placeholder="0"></label>
                    <label class="bxa-label">Каспи/JTI<input class="bxa-input bxa-num" type="number" name="kaspi_jti" value="${v('kaspi_jti')}" placeholder="0"></label>
                    <label class="bxa-label">Кураторы<input class="bxa-input bxa-num" type="number" name="curators" value="${v('curators')}" placeholder="0"></label>
                    <label class="bxa-label">Сдельщики<input class="bxa-input bxa-num" type="number" name="pieceworkers" value="${v('pieceworkers')}" placeholder="0"></label>
                    <label class="bxa-label">Самозанятые<input class="bxa-input bxa-num" type="number" name="self_employed" value="${v('self_employed')}" placeholder="0"></label>
                    <label class="bxa-label">Налоги з/п<input class="bxa-input bxa-num" type="number" name="payroll_taxes" value="${v('payroll_taxes')}" placeholder="0"></label>
                    <label class="bxa-label">ОФ ЗП 1С<input class="bxa-input bxa-num" type="number" name="official_salary" value="${v('official_salary')}" placeholder="0"></label>
                    <div class="bxa-computed"><span>ИТОГО ФОТ</span><strong data-c="fotTotal">—</strong></div>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">УМС</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">УМС<input class="bxa-input bxa-num" type="number" name="ums" value="${v('ums')}" placeholder="0"></label>
                    <label class="bxa-label">УМС ELS<input class="bxa-input bxa-num" type="number" name="ums_els" value="${v('ums_els')}" placeholder="0"></label>
                    <label class="bxa-label">Eco Line УМС<input class="bxa-input bxa-num" type="number" name="eco_line_ums" value="${v('eco_line_ums')}" placeholder="0"></label>
                    <label class="bxa-label">Ген. уборка<input class="bxa-input bxa-num" type="number" name="gen_cleaning" value="${v('gen_cleaning')}" placeholder="0"></label>
                    <div class="bxa-computed"><span>ИТОГО УМС</span><strong data-c="umsTotal">—</strong></div>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">Прочие расходы</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">Авансирования<input class="bxa-input bxa-num" type="number" name="advances" value="${v('advances')}" placeholder="0"></label>
                    <label class="bxa-label">Транспорт<input class="bxa-input bxa-num" type="number" name="transport" value="${v('transport')}" placeholder="0"></label>
                    <label class="bxa-label">Аренда техники<input class="bxa-input bxa-num" type="number" name="equipment_rent" value="${v('equipment_rent')}" placeholder="0"></label>
                    <label class="bxa-label">Товар<input class="bxa-input bxa-num" type="number" name="goods" value="${v('goods')}" placeholder="0"></label>
                    <label class="bxa-label">Ремонт<input class="bxa-input bxa-num" type="number" name="repairs" value="${v('repairs')}" placeholder="0"></label>
                    <label class="bxa-label">Консалтинг<input class="bxa-input bxa-num" type="number" name="consulting" value="${v('consulting')}" placeholder="0"></label>
                    <label class="bxa-label">Оборудование<input class="bxa-input bxa-num" type="number" name="equipment" value="${v('equipment')}" placeholder="0"></label>
                    <label class="bxa-label">Бух. услуги<input class="bxa-input bxa-num" type="number" name="buh_services" value="${v('buh_services')}" placeholder="0"></label>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">Налоги</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">ИПН/КПН<input class="bxa-input bxa-num" type="number" name="ipn_kpn" value="${v('ipn_kpn')}" placeholder="0"></label>
                    <label class="bxa-label">Нал. самозан.<input class="bxa-input bxa-num" type="number" name="self_employed_taxes" value="${v('self_employed_taxes')}" placeholder="0"></label>
                    <label class="bxa-label">Расходы ИП<input class="bxa-input bxa-num" type="number" name="ip_expenses" value="${v('ip_expenses')}" placeholder="0"></label>
                </div>
            </div>

            <div class="bxa-form-section">
                <label class="bxa-label">Примечание
                    <textarea class="bxa-input bxa-textarea" name="note" rows="2" placeholder="Доп. информация...">${entry ? escHtml(entry.note || '') : ''}</textarea>
                </label>
            </div>

            <div class="bxa-result" id="formResult">
                <div class="bxa-result-item"><span>Маржа партнёра</span><strong data-c="pMargin">—</strong></div>
                <div class="bxa-result-item"><span>Маржа %</span><strong data-c="pct" class="">—</strong></div>
            </div>

            <div class="bxa-form-error" id="formError" hidden></div>
            <div class="bxa-form-btns">
                <button type="button" id="cancelFormBtn" class="bxa-btn">Отмена</button>
                <button type="submit" id="submitBtn" class="bxa-btn bxa-btn-primary">
                    ${entry ? 'Сохранить изменения' : 'Сохранить в БД и Битрикс'}
                </button>
            </div>
        </form>
    `;
}

function renderPickerScreen() {
    return `
        <div class="bxa-picker">
            <div class="bxa-picker-title">Выберите партнёра</div>
            <select class="bxa-select" id="partnerSelect">
                <option value="">— выберите —</option>
                ${allPartners.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.name)}</option>`).join('')}
            </select>
            <button class="bxa-btn bxa-btn-primary" id="partnerSelectBtn" disabled>Продолжить</button>
        </div>
    `;
}

// ——— Расчёт в форме ———
function attachCalc(container) {
    const n = (name) => Number(container.querySelector(`[name="${name}"]`)?.value) || 0;
    const setText = (attr, txt) => { const el = container.querySelector(`[data-c="${attr}"]`); if (el) el.textContent = txt; };
    const fmt = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v);

    function calc() {
        const c = calcTotals({
            revenue_gross: n('revenue_gross'), vat: n('vat'),
            fot_official: n('fot_official'), fot_unofficial: n('fot_unofficial'),
            kaspi_jti: n('kaspi_jti'), curators: n('curators'), pieceworkers: n('pieceworkers'),
            self_employed: n('self_employed'), payroll_taxes: n('payroll_taxes'), official_salary: n('official_salary'),
            ums: n('ums'), ums_els: n('ums_els'), eco_line_ums: n('eco_line_ums'), gen_cleaning: n('gen_cleaning'),
            advances: n('advances'), transport: n('transport'), equipment_rent: n('equipment_rent'),
            goods: n('goods'), repairs: n('repairs'), consulting: n('consulting'),
            equipment: n('equipment'), buh_services: n('buh_services'),
            ipn_kpn: n('ipn_kpn'), self_employed_taxes: n('self_employed_taxes'), ip_expenses: n('ip_expenses')
        });
        setText('revNet', fmt(c.revNet));
        setText('fotTotal', fmt(c.fotTotal));
        setText('umsTotal', fmt(c.umsTotal));
        setText('pMargin', fmt(c.pMargin));
        const pctEl = container.querySelector('[data-c="pct"]');
        if (pctEl) {
            pctEl.textContent = c.pct !== null ? c.pct.toFixed(1) + '%' : '—';
            pctEl.className = '';
            if (c.pct !== null) pctEl.classList.add(c.pct < 12 ? 'is-good' : c.pct < 30 ? 'is-warn' : 'is-bad');
        }
        container.querySelector('#formResult')?.classList.toggle('is-neg', c.pMargin < 0);
    }
    container.querySelectorAll('.bxa-num').forEach(el => el.addEventListener('input', calc));
    calc();
}

// ——— Загрузка данных ———
async function loadData() {
    const [mysqlData, entriesData] = await Promise.all([
        api('GET', `/api/bitrix-app/mysql-data?partner_id=${encodeURIComponent(currentPartner.id)}&month=${encodeURIComponent(selectedMonth)}`).catch(() => ({ rows: [] })),
        api('GET', `/api/bitrix-app/entries?partner_id=${encodeURIComponent(currentPartner.id)}&month=${encodeURIComponent(selectedMonth)}`).catch(() => ({ entries: [] }))
    ]);
    mysqlRows = Array.isArray(mysqlData.rows) ? mysqlData.rows : [];
    entries = Array.isArray(entriesData.entries) ? entriesData.entries : [];
}

// ——— Рендер основного экрана ———
function renderMain() {
    app.innerHTML = `
        ${renderMonthBar()}
        <div id="formArea" hidden></div>
        ${renderMysqlTable()}
        <div id="entriesArea">${renderEntries()}</div>
    `;
    bindMain();
}

function showForm(entry = null, mysql = null) {
    const fa = document.getElementById('formArea');
    fa.innerHTML = renderForm(entry, mysql);
    fa.hidden = false;
    attachCalc(fa);
    fa.scrollIntoView({ behavior: 'smooth', block: 'start' });

    fa.querySelector('#cancelFormBtn')?.addEventListener('click', () => {
        fa.hidden = true; fa.innerHTML = ''; editingId = null; prefillMysql = null;
    });
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
            editingId = null; prefillMysql = null;
            fa.hidden = true; fa.innerHTML = '';
            document.getElementById('entriesArea').innerHTML = renderEntries();
            bindEntryActions();
            // Показываем уведомление
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
        showLoading('Загрузка...');
        await loadData().catch(() => {});
        renderMain();
    });

    document.getElementById('addBtn')?.addEventListener('click', () => {
        editingId = null; prefillMysql = null;
        showForm(null, null);
    });

    // Кнопки "Внести" из MySQL-таблицы
    app.querySelectorAll('[data-prefill]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.prefill;
            const row = mysqlRows.find(r => String(r.external_id) === id);
            if (!row) return;
            prefillMysql = row;
            showForm(null, row);
        });
    });

    bindEntryActions();
}

function bindEntryActions() {
    const area = document.getElementById('entriesArea');
    if (!area) return;
    area.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.edit);
            const entry = entries.find(e => Number(e.id) === id);
            if (!entry) return;
            editingId = id;
            showForm(entry, null);
        });
    });
    area.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.delete);
            if (!confirm('Удалить эту запись из БД?')) return;
            btn.disabled = true;
            try {
                await api('DELETE', `/api/bitrix-app/entries/${id}?partner_id=${encodeURIComponent(currentPartner.id)}`);
                entries = entries.filter(e => Number(e.id) !== id);
                document.getElementById('entriesArea').innerHTML = renderEntries();
                bindEntryActions();
            } catch (err) {
                alert(err.message || 'Ошибка');
                btn.disabled = false;
            }
        });
    });
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
        // Читаем параметры из URL (Bitrix передаёт их при открытии приложения)
        const params = new URLSearchParams(window.location.search);
        const bxAuth = params.get('AUTH_ID') || params.get('auth');
        const bxDomain = params.get('DOMAIN') || params.get('domain');

        if (!bxAuth || !bxDomain) {
            showError('Откройте это приложение из Битрикс24 (параметры AUTH_ID и DOMAIN обязательны).');
            return;
        }

        // Логинимся на нашем сервере
        const loginData = await api('POST', '/api/bitrix-app/login', { auth: bxAuth, domain: bxDomain });

        if (loginData.partnerBitrixId) {
            currentPartner = { id: loginData.partnerBitrixId, name: loginData.partnerName || loginData.partnerBitrixId };
        } else if (loginData.allPartners?.length) {
            allPartners = loginData.allPartners;
            app.innerHTML = renderPickerScreen();
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
            showError('Не найден партнёр для вашего аккаунта Битрикс24. Обратитесь к администратору.');
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
