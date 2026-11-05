import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertLength,
  normalizeText,
  inspectText,
} from '../src/scripts/tessera-tools.mjs';

test('长度换算保留合理精度并支持反向单位', () => {
  assert.equal(convertLength('1.5', 'm', 'cm'), '150');
  assert.equal(convertLength('5280', 'ft', 'mi'), '1');
  assert.equal(convertLength('2.54', 'cm', 'in'), '1');
});

test('长度换算拒绝空值、非数字和不支持的单位', () => {
  assert.equal(convertLength('', 'm', 'cm'), null);
  assert.equal(convertLength('abc', 'm', 'cm'), null);
  assert.equal(convertLength('1', 'kg', 'm'), null);
});

test('文本整理统一换行、行尾空格和过多空行', () => {
  assert.equal(
    normalizeText('第一行  \r\n\r\n\r\n  第二行\t\r\n'),
    '第一行\n\n  第二行',
  );
});

test('文本检查按 Unicode 字符与非空行统计', () => {
  assert.deepEqual(inspectText('千机 🧩\n\nTools'), {
    characters: 11,
    lines: 2,
    words: 2,
  });
});
