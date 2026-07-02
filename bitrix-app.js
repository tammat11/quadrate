/* global BX24 */
'use strict';

const app = document.getElementById('bx-app');

// ——— Состояние ———
let bxAuth = null;       // { access_token, domain }
let currentPartner = null; // { id, name }
let allPartners = [];
let entries = [];
let editingId = null;
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

// ——— API ———
async function apiGet(path) {
    const res = await fetch(path, {
        headers: { 'Authorization': `Bearer ${bxAuth.access_token}`, 'X-BX-Domain': bxAuth.domain }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

async function apiPost(path, body) {
    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${bxAuth.access_token}`,
            'X-BX-Domain': bxAuth.domain,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

async function apiDelete(path) {
    const res = await fetch(path, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${bxAuth.access_token}`, 'X-BX-Domain': bxAuth.domain }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

async function loadEntries() {
    const url = `/api/bitrix-app/management-entries?partner_id=${encodeURIComponent(currentPartner.id)}&month=${encodeURIComponent(selectedMonth)}`;
    const data = await apiGet(url);
    entries = Array.isArray(data.entries) ? data.entries : [];
}

// ——— Вычисления ———
function calcEntry(e) {
    const n = (k) => Number(e[k]) || 0;
    const revNet = n('revenue_gross') - n('vat');
    const fotTotal = n('fot_official') + n('fot_unofficial') + n('kaspi_jti') + n('curators') + n('pieceworkers') + n('self_employed') + n('payroll_taxes') + n('official_salary');
    const umsTotal = n('ums') + n('ums_els') + n('eco_line_ums') + n('gen_cleaning');
    const other = n('advances') + n('transport') + n('equipment_rent') + n('goods') + n('repairs') + n('consulting') + n('equipment') + n('buh_services');
    const taxes = n('ipn_kpn') + n('self_employed_taxes') + n('ip_expenses');
    const partnerMargin = revNet - fotTotal - umsTotal - other - taxes;
    const marginPct = revNet !== 0 ? partnerMargin / revNet * 100 : null;
    return { revNet, fotTotal, umsTotal, partnerMargin, marginPct };
}

// ——— HTML-шаблоны ———
function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderPartnerPicker() {
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

function renderMonthBar() {
    // Build last 6 months options
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        options.push({ key, label: formatMonthLabel(key) });
    }
    return `
        <div class="bxa-month-bar">
            <label class="bxa-month-label">Месяц начисления</label>
            <select class="bxa-select bxa-month-select" id="monthSelect">
                ${options.map(o => `<option value="${o.key}"${o.key === selectedMonth ? ' selected' : ''}>${o.label}</option>`).join('')}
            </select>
        </div>
    `;
}

function renderEntriesList() {
    if (!entries.length) {
        return `<div class="bxa-empty">За ${escHtml(formatMonthLabel(selectedMonth))} записей нет.<br>Нажмите «+ Добавить объект».</div>`;
    }
    return entries.map(e => {
        const c = calcEntry(e);
        const pctTxt = c.marginPct !== null ? c.marginPct.toFixed(1) + '%' : '—';
        const pctClass = c.marginPct === null ? '' : c.marginPct < 12 ? 'is-good' : c.marginPct < 30 ? 'is-warn' : 'is-bad';
        return `
            <div class="bxa-entry">
                <div class="bxa-entry-top">
                    <div class="bxa-entry-name">${escHtml(e.address || '—')}</div>
                    <div class="bxa-entry-actions">
                        <button class="bxa-icon-btn" data-edit="${e.id}" title="Редактировать">✎</button>
                        <button class="bxa-icon-btn bxa-icon-btn-del" data-delete="${e.id}" title="Удалить">✕</button>
                    </div>
                </div>
                ${e.ip_name ? `<div class="bxa-entry-sub">${escHtml(e.ip_name)}</div>` : ''}
                <div class="bxa-entry-nums">
                    <div class="bxa-entry-num"><span>Реализация (без НДС)</span><strong>${escHtml(fmtMoney(c.revNet))}</strong></div>
                    <div class="bxa-entry-num"><span>ИТОГО ФОТ</span><strong>${escHtml(fmtMoney(c.fotTotal))}</strong></div>
                    <div class="bxa-entry-num"><span>ИТОГО УМС</span><strong>${escHtml(fmtMoney(c.umsTotal))}</strong></div>
                    <div class="bxa-entry-num"><span>Маржа партнёра</span><strong>${escHtml(fmtMoney(c.partnerMargin))}</strong></div>
                    <div class="bxa-entry-num"><span>Маржа %</span><strong class="${pctClass}">${escHtml(pctTxt)}</strong></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderForm(entry = null) {
    const v = (k) => entry ? (Number(entry[k]) || '') : '';
    const s = (k) => entry ? escHtml(entry[k] || '') : '';
    const month = entry ? escHtml(entry.month_key || selectedMonth) : selectedMonth;
    return `
        <form class="bxa-form" id="mgmtForm">
            <input type="hidden" name="id" value="${entry ? entry.id : ''}">

            <div class="bxa-form-section">
                <div class="bxa-form-row bxa-form-row-4">
                    <label class="bxa-label">Месяц <span class="bxa-req">*</span>
                        <input class="bxa-input" type="month" name="month_key" required value="${month}">
                    </label>
                    <label class="bxa-label">Адрес объекта
                        <input class="bxa-input" type="text" name="address" value="${s('address')}" placeholder="ул. Абая, 10">
                    </label>
                    <label class="bxa-label">Наименование ИП
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
                    <label class="bxa-label">Реализация с НДС
                        <input class="bxa-input bxa-num" type="number" name="revenue_gross" value="${v('revenue_gross')}" placeholder="0">
                    </label>
                    <label class="bxa-label">НДС
                        <input class="bxa-input bxa-num" type="number" name="vat" value="${v('vat')}" placeholder="0">
                    </label>
                    <div class="bxa-computed">
                        <span>Реализация без НДС</span>
                        <strong data-calc-rev-net>—</strong>
                    </div>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">ФОТ</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">ФОТ офф. (Битрикс)
                        <input class="bxa-input bxa-num" type="number" name="fot_official" value="${v('fot_official')}" placeholder="0">
                    </label>
                    <label class="bxa-label">ФОТ неофф.
                        <input class="bxa-input bxa-num" type="number" name="fot_unofficial" value="${v('fot_unofficial')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Каспи / JTI
                        <input class="bxa-input bxa-num" type="number" name="kaspi_jti" value="${v('kaspi_jti')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Кураторы
                        <input class="bxa-input bxa-num" type="number" name="curators" value="${v('curators')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Сдельщики
                        <input class="bxa-input bxa-num" type="number" name="pieceworkers" value="${v('pieceworkers')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Самозанятые
                        <input class="bxa-input bxa-num" type="number" name="self_employed" value="${v('self_employed')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Налоги по з/п
                        <input class="bxa-input bxa-num" type="number" name="payroll_taxes" value="${v('payroll_taxes')}" placeholder="0">
                    </label>
                    <label class="bxa-label">ОФ ЗП 1С
                        <input class="bxa-input bxa-num" type="number" name="official_salary" value="${v('official_salary')}" placeholder="0">
                    </label>
                    <div class="bxa-computed">
                        <span>ИТОГО ФОТ</span>
                        <strong data-calc-fot>—</strong>
                    </div>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">УМС</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">УМС
                        <input class="bxa-input bxa-num" type="number" name="ums" value="${v('ums')}" placeholder="0">
                    </label>
                    <label class="bxa-label">УМС ELS
                        <input class="bxa-input bxa-num" type="number" name="ums_els" value="${v('ums_els')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Eco Line УМС
                        <input class="bxa-input bxa-num" type="number" name="eco_line_ums" value="${v('eco_line_ums')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Ген. уборка
                        <input class="bxa-input bxa-num" type="number" name="gen_cleaning" value="${v('gen_cleaning')}" placeholder="0">
                    </label>
                    <div class="bxa-computed">
                        <span>ИТОГО УМС</span>
                        <strong data-calc-ums>—</strong>
                    </div>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">Прочие расходы</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">Авансирования
                        <input class="bxa-input bxa-num" type="number" name="advances" value="${v('advances')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Транспортные расходы
                        <input class="bxa-input bxa-num" type="number" name="transport" value="${v('transport')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Аренда спецтехники
                        <input class="bxa-input bxa-num" type="number" name="equipment_rent" value="${v('equipment_rent')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Сумма товара
                        <input class="bxa-input bxa-num" type="number" name="goods" value="${v('goods')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Ремонт
                        <input class="bxa-input bxa-num" type="number" name="repairs" value="${v('repairs')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Консалтинг
                        <input class="bxa-input bxa-num" type="number" name="consulting" value="${v('consulting')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Оборудование
                        <input class="bxa-input bxa-num" type="number" name="equipment" value="${v('equipment')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Бух. услуги
                        <input class="bxa-input bxa-num" type="number" name="buh_services" value="${v('buh_services')}" placeholder="0">
                    </label>
                </div>
            </div>

            <div class="bxa-form-section">
                <div class="bxa-section-title">Налоги</div>
                <div class="bxa-form-row">
                    <label class="bxa-label">ИПН / КПН
                        <input class="bxa-input bxa-num" type="number" name="ipn_kpn" value="${v('ipn_kpn')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Налоги самозанятых
                        <input class="bxa-input bxa-num" type="number" name="self_employed_taxes" value="${v('self_employed_taxes')}" placeholder="0">
                    </label>
                    <label class="bxa-label">Расходы ИП
                        <input class="bxa-input bxa-num" type="number" name="ip_expenses" value="${v('ip_expenses')}" placeholder="0">
                    </label>
                </div>
            </div>

            <div class="bxa-form-section">
                <label class="bxa-label">Примечание
                    <textarea class="bxa-input bxa-textarea" name="note" rows="2" placeholder="Дополнительная информация...">${s('note')}</textarea>
                </label>
            </div>

            <div class="bxa-result" id="formResult">
                <div class="bxa-result-item">
                    <span>Маржа партнёра</span>
                    <strong data-calc-margin>—</strong>
                </div>
                <div class="bxa-result-item">
                    <span>Маржа %</span>
                    <strong data-calc-pct>—</strong>
                </div>
            </div>

            <div class="bxa-form-error" id="formError" hidden></div>

            <div class="bxa-form-btns">
                <button type="button" class="bxa-btn" id="cancelFormBtn">Отмена</button>
                <button type="submit" class="bxa-btn bxa-btn-primary" id="submitFormBtn">
                    ${entry ? 'Сохранить изменения' : 'Добавить объект'}
                </button>
            </div>
        </form>
    `;
}

function renderMain() {
    return `
        <div class="bxa-header">
            <div class="bxa-header-left">
                <div class="bxa-partner-name">${escHtml(currentPartner.name)}</div>
                <div class="bxa-partner-sub">Управленка · ${escHtml(formatMonthLabel(selectedMonth))}</div>
            </div>
            <button class="bxa-btn bxa-btn-primary" id="addEntryBtn">+ Добавить объект</button>
        </div>
        ${renderMonthBar()}
        <div id="formArea" hidden></div>
        <div id="entriesArea">${renderEntriesList()}</div>
    `;
}

// ——— Расчёт в форме ———
function attachFormCalc(form) {
    const n = (name) => Number(form.querySelector(`[name="${name}"]`)?.value) || 0;
    const setText = (sel, txt) => { const el = form.querySelector(sel); if (el) el.textContent = txt; };
    const fmt = (v) => v === 0 ? '0' : new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v);

    function calc() {
        const revNet = n('revenue_gross') - n('vat');
        const fotTotal = n('fot_official') + n('fot_unofficial') + n('kaspi_jti') + n('curators') + n('pieceworkers') + n('self_employed') + n('payroll_taxes') + n('official_salary');
        const umsTotal = n('ums') + n('ums_els') + n('eco_line_ums') + n('gen_cleaning');
        const other = n('advances') + n('transport') + n('equipment_rent') + n('goods') + n('repairs') + n('consulting') + n('equipment') + n('buh_services');
        const taxes = n('ipn_kpn') + n('self_employed_taxes') + n('ip_expenses');
        const partnerMargin = revNet - fotTotal - umsTotal - other - taxes;
        const marginPct = revNet !== 0 ? partnerMargin / revNet * 100 : null;

        setText('[data-calc-rev-net]', fmt(revNet));
        setText('[data-calc-fot]', fmt(fotTotal));
        setText('[data-calc-ums]', fmt(umsTotal));
        setText('[data-calc-margin]', fmt(partnerMargin));

        const pctEl = form.querySelector('[data-calc-pct]');
        if (pctEl) {
            pctEl.textContent = marginPct !== null ? marginPct.toFixed(1) + '%' : '—';
            pctEl.className = '';
            if (marginPct !== null) {
                if (marginPct < 12) pctEl.classList.add('is-good');
                else if (marginPct < 30) pctEl.classList.add('is-warn');
                else pctEl.classList.add('is-bad');
            }
        }
        const resultEl = form.querySelector('#formResult');
        if (resultEl) resultEl.classList.toggle('is-neg', partnerMargin < 0);
    }

    form.querySelectorAll('.bxa-num').forEach(el => el.addEventListener('input', calc));
    calc();
}

// ——— Рендер страниц ———
function showLoading(text = 'Загрузка...') {
    app.innerHTML = `<div class="bxa-loading"><div class="bxa-loading-spinner"></div><div class="bxa-loading-text">${escHtml(text)}</div></div>`;
}

function showError(msg) {
    app.innerHTML = `<div class="bxa-error"><div class="bxa-error-icon">!</div><div>${escHtml(msg)}</div></div>`;
}

function showPickerScreen() {
    app.innerHTML = renderPartnerPicker();
    const sel = document.getElementById('partnerSelect');
    const btn = document.getElementById('partnerSelectBtn');
    sel.addEventListener('change', () => { btn.disabled = !sel.value; });
    btn.addEventListener('click', () => {
        const pid = sel.value;
        const p = allPartners.find(p => p.id === pid);
        if (!p) return;
        currentPartner = p;
        showMainScreen();
    });
}

function showMainScreen() {
    app.innerHTML = renderMain();
    bindMainHandlers();
}

function bindMainHandlers() {
    const monthSel = document.getElementById('monthSelect');
    const addBtn = document.getElementById('addEntryBtn');
    const formArea = document.getElementById('formArea');
    const entriesArea = document.getElementById('entriesArea');

    monthSel?.addEventListener('change', async () => {
        selectedMonth = monthSel.value;
        showLoading('Загрузка...');
        try {
            await loadEntries();
            showMainScreen();
        } catch (e) {
            showError(e.message);
        }
    });

    addBtn?.addEventListener('click', () => {
        editingId = null;
        formArea.innerHTML = renderForm();
        formArea.hidden = false;
        attachFormCalc(formArea.querySelector('#mgmtForm'));
        bindFormHandlers(formArea);
        formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        addBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    entriesArea?.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('[data-edit]');
        if (editBtn) {
            const id = Number(editBtn.dataset.edit);
            const entry = entries.find(e => Number(e.id) === id);
            if (!entry) return;
            editingId = id;
            formArea.innerHTML = renderForm(entry);
            formArea.hidden = false;
            attachFormCalc(formArea.querySelector('#mgmtForm'));
            bindFormHandlers(formArea);
            formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        const delBtn = e.target.closest('[data-delete]');
        if (delBtn) {
            const id = Number(delBtn.dataset.delete);
            if (!confirm('Удалить эту запись?')) return;
            delBtn.disabled = true;
            try {
                await apiDelete(`/api/bitrix-app/management-entries/${id}?partner_id=${encodeURIComponent(currentPartner.id)}`);
                entries = entries.filter(e => Number(e.id) !== id);
                entriesArea.innerHTML = renderEntriesList();
            } catch (err) {
                alert(err.message || 'Ошибка при удалении');
                delBtn.disabled = false;
            }
        }
    });
}

function bindFormHandlers(formArea) {
    const form = formArea.querySelector('#mgmtForm');
    const cancelBtn = formArea.querySelector('#cancelFormBtn');
    const errorEl = formArea.querySelector('#formError');

    cancelBtn?.addEventListener('click', () => {
        formArea.hidden = true;
        formArea.innerHTML = '';
        editingId = null;
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('#submitFormBtn');
        submitBtn.disabled = true;
        if (errorEl) errorEl.hidden = true;
        try {
            const data = Object.fromEntries(new FormData(form).entries());
            data.partner_id = currentPartner.id;
            if (editingId) data.id = editingId;
            const url = `/api/bitrix-app/management-entries?partner_id=${encodeURIComponent(currentPartner.id)}`;
            const result = await apiPost(url, data);
            const saved = result.entry;
            if (editingId) {
                entries = entries.map(e => Number(e.id) === editingId ? saved : e);
            } else {
                entries = [saved, ...entries];
            }
            editingId = null;
            formArea.hidden = true;
            formArea.innerHTML = '';
            const entriesArea = document.getElementById('entriesArea');
            if (entriesArea) entriesArea.innerHTML = renderEntriesList();
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message || 'Ошибка при сохранении'; errorEl.hidden = false; }
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// ——— Инициализация ———
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(s);
    });
}

async function init() {
    showLoading('Инициализация...');
    try {
        // 1. Получаем портал Bitrix из нашего сервера
        const config = await fetch('/api/bitrix-app-config').then(r => r.json());
        if (!config.portalDomain) throw new Error('Не настроен BITRIX_BASE на сервере');

        // 2. Грузим BX24.js с портала
        await loadScript(`https://${config.portalDomain}/bitrix/js/rest/bx24.js`);

        // 3. Инициализируем BX24
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('BX24.init timeout')), 10000);
            BX24.init(() => { clearTimeout(timer); resolve(); });
        });

        // 4. Получаем токен
        const auth = BX24.getAuth();
        bxAuth = { access_token: auth.access_token, domain: auth.domain };

        // 5. Получаем текущего пользователя Bitrix
        const userData = await new Promise((resolve, reject) => {
            BX24.callMethod('user.current', {}, result => {
                if (result.error()) reject(new Error(result.error().ex?.error_description || 'user.current error'));
                else resolve(result.data());
            });
        });

        // 6. Идентифицируем партнёра
        showLoading('Определяем партнёра...');
        const identified = await fetch('/api/bitrix-app/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth: auth.access_token, domain: auth.domain, bitrix_user_id: userData.ID })
        }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });

        if (identified.partnerBitrixId) {
            currentPartner = { id: identified.partnerBitrixId, name: identified.partnerName || identified.partnerBitrixId };
        } else if (identified.allPartners?.length) {
            allPartners = identified.allPartners;
            showPickerScreen();
            return;
        } else {
            throw new Error('Не найден партнёр для вашего аккаунта Bitrix24');
        }

        // 7. Загружаем записи
        showLoading('Загружаем данные...');
        await loadEntries();
        showMainScreen();

    } catch (err) {
        showError(err.message || 'Ошибка инициализации');
    }
}

init();
