const test = require('node:test');
const assert = require('node:assert/strict');

const server = require('../server.js');

test('normalizeBitrixUserId достает ID из битриксового объекта свойства', () => {
    assert.equal(server.normalizeBitrixUserId({ VALUE: '303' }), '303');
    assert.equal(server.normalizeBitrixUserId({ '147149447': '303' }), '303');
    assert.equal(server.normalizeBitrixUserId([{ foo: 'x' }, { '1': '475' }]), '475');
});

test('normalizePhone приводит локальные и 8-номера к формату 7XXXXXXXXXX', () => {
    assert.equal(server.normalizePhone('+7 747 481 27 80'), '77474812780');
    assert.equal(server.normalizePhone('87474812780'), '77474812780');
    assert.equal(server.normalizePhone('7474812780'), '77474812780');
});

test('flattenCabinetAccounts и groupCabinetAccounts сохраняют структуру кабинетов', () => {
    const grouped = {
        '77474812780': [
            {
                listElementId: '2348495',
                listElementName: 'Бакытгуль ИП',
                partnerBitrixId: '2362017',
                employeeId: '303',
                employeeName: 'Бакытгул Калиаскар'
            },
            {
                listElementId: '2348497',
                listElementName: 'Барыс ИП',
                partnerBitrixId: '2362017',
                employeeId: '303',
                employeeName: 'Бакытгул Калиаскар'
            }
        ]
    };

    const flat = server.flattenCabinetAccounts(grouped);
    assert.equal(flat.length, 2);
    assert.equal(flat[0].phoneMasked, '7***2780');

    const rebuilt = server.groupCabinetAccounts(flat);
    assert.deepEqual(rebuilt, {
        '77474812780': [
            {
                listElementId: '2348495',
                listElementName: 'Бакытгуль ИП',
                partnerBitrixId: '2362017',
                employeeId: '303',
                employeeName: 'Бакытгул Калиаскар',
                phoneMasked: '7***2780'
            },
            {
                listElementId: '2348497',
                listElementName: 'Барыс ИП',
                partnerBitrixId: '2362017',
                employeeId: '303',
                employeeName: 'Бакытгул Калиаскар',
                phoneMasked: '7***2780'
            }
        ]
    });
});
