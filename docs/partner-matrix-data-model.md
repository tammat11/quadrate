# Модель данных PartnerMatrixRow и соответствие полям Bitrix

Документ описывает структуру одной строки матрицы партнёров для дашборда и откуда берутся данные (Bitrix vs расчёт в приложении).

---

## 1. Модель PartnerMatrixRow (псевдо-JSON)

Один объект — одна строка матрицы (один партнёр/ответственный за период).

```json
{
  "id": "string",
  "periodKey": "string",
  "bitrixPartnerId": "string",

  "name": "string",
  "region": "string | null",
  "managerId": "string | null",
  "managerName": "string | null",

  "dealsCount": "number",
  "dealsInScopeCount": "number",
  "totalOpportunity": "number",
  "currencyId": "string",
  "avgFotScore": "number",
  "avgRemarkScore": "number",
  "weightedScore": "number",
  "remarksCount": "number",
  "reactionDaysAvg": "number",

  "partnerLevel": "string",
  "statusLabel": "string",
  "statusZone": "string",
  "kpiScore": "number",
  "comment": "string | null",

  "history": "array",
  "dealIds": "array",
  "_rawFromBitrix": "object"
}
```

---

## 2. Описание полей и источник данных

### 2.1. Идентификаторы и период

| Поле            | Тип    | Источник   | Описание |
|-----------------|--------|------------|----------|
| `id`            | string | Вычисляется | Уникальный ключ строки матрицы, например `{bitrixPartnerId}_{periodKey}`. |
| `periodKey`     | string | UI/фильтр  | Ключ периода (месяц/квартал), например `"2026-03"` или `"2026-Q1"`. |
| `bitrixPartnerId` | string | Bitrix   | ID пользователя (ответственного) — из `deal.ASSIGNED_BY_ID`. |

### 2.2. Базовые атрибуты партнёра (из Bitrix / справочников)

| Поле          | Тип    | Источник | Соответствие в Bitrix |
|---------------|--------|----------|------------------------|
| `name`        | string | Bitrix   | `user.get` → `NAME` + `LAST_NAME` по `ASSIGNED_BY_ID`. |
| `region`      | string \| null | Bitrix (опционально) | Пользовательское поле пользователя (например UF_* в `user`), если есть; иначе — из сделки (UF_* региона по категории), если появится. |
| `managerId`   | string \| null | Bitrix | Руководитель партнёра: из `user.WORK_MANAGER_ID` или аналога в `user.get`. |
| `managerName` | string \| null | Bitrix | Имя руководителя по `managerId` через `user.get`. |

### 2.3. Показатели из сделок (агрегаты по сделкам партнёра за период)

| Поле                | Тип    | Источник   | Соответствие в Bitrix / формула |
|---------------------|--------|------------|----------------------------------|
| `dealsCount`        | number | Вычисляется | Число сделок по `deal.ASSIGNED_BY_ID` в выбранных категориях за период. |
| `dealsInScopeCount`  | number | Вычисляется | Число сделок, попавших в срез (категории 109, 79, 71 и выбранные стадии/фильтры). |
| `totalOpportunity`  | number | Bitrix     | Сумма `deal.OPPORTUNITY` по сделкам партнёра за период. |
| `currencyId`        | string | Bitrix     | `deal.CURRENCY_ID` (единая валюта среза, например KZT). |
| `avgFotScore`       | number | Вычисляется | Среднее по сделкам: FOT score из `calculateFOTScore(deal)` (MOVED_TIME, CLOSEDATE). |
| `avgRemarkScore`    | number | Вычисляется | Среднее по сделкам с замечаниями: `calculateRemarkScore(deal[UF_CRM_REVIEWDATE], deal[UF_CRM_FITBACK])`. |
| `weightedScore`     | number | Вычисляется | Как в текущем дашборде: по сделкам с замечанием — (fotScore + remarkScore)/2, иначе fotScore; затем среднее по партнёру. |
| `remarksCount`       | number | Вычисляется | Число сделок, где задано поле замечания: `deal[UF_CRM_REVIEWDATE]` присутствует. |
| `reactionDaysAvg`   | number | Вычисляется | Среднее по сделкам: разница в днях между `MOVED_TIME` и `CLOSEDATE` (или текущей датой). |

### 2.4. Поля матрицы (уровень, статус, KPI, комментарий)

| Поле           | Тип    | Источник   | Описание |
|----------------|--------|------------|----------|
| `partnerLevel` | string | Вычисляется | Уровень партнёра по правилам матрицы (например "A" / "B" / "C" по баллам или объёму). Правила задаются отдельно (пороги из Word). |
| `statusLabel`  | string | Вычисляется | Текстовый статус для ячейки: "Excellent", "Good", "Needs Review", "Риск", "Лидер", "Новый" и т.д. |
| `statusZone`   | string | Вычисляется | Зона для раскраски: "green" \| "yellow" \| "red" по порогам (например по weightedScore: >0.8, 0.5–0.8, <0.5). |
| `kpiScore`     | number | Вычисляется | Сводный балл KPI по матрице (может совпадать с weightedScore или быть отдельной формулой). |
| `comment`      | string \| null | Bitrix или ввод | Комментарий к партнёру: при наличии — из пользовательского поля сделки/партнёра (UF_*), иначе ручной ввод (потребуется новое UF_ или хранение на фронте/бэкенде). |

### 2.5. Служебные и ссылки

| Поле             | Тип   | Источник   | Описание |
|------------------|-------|------------|----------|
| `history`        | array | Вычисляется | Массив записей по сделкам для графика/детализации: `{ date: deal.DATE_CREATE, score: number }`. |
| `dealIds`        | array | Bitrix     | Список `deal.ID` по партнёру за период (для перехода в Bitrix или детальной карточки). |
| `_rawFromBitrix` | object | —        | Опционально: сырые данные по сделкам/пользователю для отладки. |

---

## 3. Карта соответствия: столбец матрицы → Bitrix / формула

Используемые поля Bitrix в текущем дашборде и расширения под матрицу:

| Столбец матрицы / показатель | Источник данных | Поле Bitrix / формула |
|-----------------------------|-----------------|------------------------|
| Партнёр (имя)               | Bitrix          | `user.get` по `deal.ASSIGNED_BY_ID` → NAME, LAST_NAME |
| Регион                      | Bitrix (если есть) | Поле пользователя UF_* (регион) или UF_* сделки по категории |
| Менеджер                    | Bitrix          | `user.WORK_MANAGER_ID` (или аналог), затем user.get по нему |
| Кол-во сделок               | Вычисляется     | count(deal) где deal.ASSIGNED_BY_ID = partner, фильтр по CATEGORY_ID, периоду |
| Сумма сделок                | Bitrix          | sum(deal.OPPORTUNITY) |
| Средний балл (FOT)          | Вычисляется     | average(calculateFOTScore(deal)); deal.MOVED_TIME, deal.CLOSEDATE |
| Замечания (кол-во)          | Вычисляется     | count(deal где deal.UF_CRM_REVIEWDATE задано) |
| Балл замечаний              | Вычисляется     | calculateRemarkScore(deal.UF_CRM_REVIEWDATE, deal.UF_CRM_FITBACK) |
| Итоговый балл / статус      | Вычисляется     | weightedScore; статус по порогам (например >0.8 / 0.5–0.8 / <0.5) |
| Уровень партнёра            | Вычисляется     | Правила матрицы (пороги по баллу/объёму); при необходимости вход — см. ниже UF_ уровня |
| Период начисления           | Bitrix / фильтр | deal.UF_CRM_1707145268405 (MONTH_ACCRUAL) или фильтр по DATE_CREATE/CLOSEDATE |
| Категория сделки            | Bitrix          | deal.CATEGORY_ID (109, 79, 71 в текущем коде) |
| Стадия                      | Bitrix          | deal.STAGE_ID |
| Комментарий                 | Bitrix или новое | Сейчас в сделках: deal.COMMENTS; для комментария к партнёру — новое UF_ или сущность |

---

## 4. Используемые API и фильтры Bitrix

- **user.get** — список пользователей; по ID получаем имя, фамилию, при необходимости руководителя и регион (если есть UF_ у user).
- **crm.deal.list** — сделки:
  - `filter`: `CATEGORY_ID` ∈ {109, 79, 71} (или конфигурируемый список), опционально по периоду (`>=DATE_CREATE`, `<=CLOSEDATE` или по `UF_CRM_1707145268405`), при необходимости по `STAGE_ID`.
  - `select`: `['*', 'UF_*']` чтобы получить все стандартные и пользовательские поля (в т.ч. UF_CRM_REVIEWDATE, UF_CRM_FITBACK, UF_CRM_1707145268405).

Данные агрегируются на стороне фронтенда (как в текущем `processData`): обход сделок, группировка по `ASSIGNED_BY_ID`, расчёт FOT/remark/weighted score и заполнение полей PartnerMatrixRow.

---

## 5. Новые пользовательские поля Bitrix (при необходимости)

Если в матрице нужны поля, которых нет в CRM:

| Назначение           | Сущность   | Предложение        | Примечание |
|----------------------|------------|--------------------|------------|
| Регион партнёра      | User       | UF_CRM_PARTNER_REGION (string/list) | Для фильтра и отображения в матрице. |
| Уровень партнёра     | User       | UF_CRM_PARTNER_LEVEL (string/list)  | Опционально: хранить утверждённый уровень; иначе только расчёт. |
| Менеджер партнёра    | User       | WORK_MANAGER_ID или UF_*            | Если уже есть в Bitrix — использовать его. |
| Комментарий по партнёру | Deal/User | UF_CRM_PARTNER_MATRIX_COMMENT (string) | Один комментарий на партнёра/период: либо у сделки, либо у пользователя. |

---

## 6. Связь с текущей логикой FOT-дашборда

- **processData (dashboard.js)** уже считает по каждому партнёру: `name`, `dealsCount`, `totalScore`, `remarksCount`, `history`.
- **Расширение под матрицу:**
  - Оставить расчёт FOT score и remark score по сделке (MOVED_TIME, CLOSEDATE, UF_CRM_REVIEWDATE, UF_CRM_FITBACK).
  - Добавить в агрегат по партнёру: `totalOpportunity`, `reactionDaysAvg`, списки `dealIds`.
  - Ввести срез по периоду: фильтрация сделок по `UF_CRM_1707145268405` или по датам (DATE_CREATE/CLOSEDATE в выбранном месяце/квартале).
  - После агрегации для каждого партнёра заполнять объект **PartnerMatrixRow**: идентификаторы, базовые атрибуты (name, region, manager из user.get), показатели из сделок, вычисляемые поля матрицы (partnerLevel, statusLabel, statusZone, kpiScore, comment).
- **Рендер:** таблица матрицы строится из массива `PartnerMatrixRow[]`; карточки и графики могут брать те же строки (например, распределение по statusZone, топ по weightedScore).

---

## 7. Пример экземпляра PartnerMatrixRow

```json
{
  "id": "207_2026-03",
  "periodKey": "2026-03",
  "bitrixPartnerId": "207",
  "name": "Иван Иванов",
  "region": null,
  "managerId": "281",
  "managerName": "Петр Петров",
  "dealsCount": 12,
  "dealsInScopeCount": 12,
  "totalOpportunity": 5000000.00,
  "currencyId": "KZT",
  "avgFotScore": 0.85,
  "avgRemarkScore": 0.90,
  "weightedScore": 0.86,
  "remarksCount": 2,
  "reactionDaysAvg": 1.5,
  "partnerLevel": "A",
  "statusLabel": "Excellent",
  "statusZone": "green",
  "kpiScore": 0.86,
  "comment": null,
  "history": [
    { "date": "2026-03-01T10:00:00+03:00", "score": 0.9 },
    { "date": "2026-03-05T14:00:00+03:00", "score": 0.82 }
  ],
  "dealIds": ["166789", "166787", "166785"]
}
```

---

Итог: модель **PartnerMatrixRow** задаёт одну строку матрицы партнёров; поля однозначно отнесены к данным из Bitrix (deal, user) или к расчётам на основе существующих формул FOT/remark и правил матрицы. После утверждения этой схемы можно переходить к реализации: расширение `processData`, срез по периоду и вывод таблицы матрицы в UI.
