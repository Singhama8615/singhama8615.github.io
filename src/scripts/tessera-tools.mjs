const lengthInMeters = Object.freeze({
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
});

/**
 * 把一个长度值换算为目标单位。
 *
 * @param {string | number} value 用户输入的数值
 * @param {string} fromUnit 原单位
 * @param {string} toUnit 目标单位
 * @returns {string | null} 格式化结果；输入无效时返回 null
 */
export function convertLength(value, fromUnit, toUnit) {
  if (typeof value === 'string' && value.trim() === '') return null;
  const numberValue = Number(value);
  const fromFactor = lengthInMeters[fromUnit];
  const toFactor = lengthInMeters[toUnit];
  if (!Number.isFinite(numberValue) || !fromFactor || !toFactor) return null;

  const converted = (numberValue * fromFactor) / toFactor;
  return Number(converted.toPrecision(12)).toString();
}

/**
 * 整理文本换行与行尾空白，保留有意义的行首缩进。
 *
 * @param {string} value 原始文本
 * @returns {string} 整理后的文本
 */
export function normalizeText(value) {
  return String(value)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

/**
 * 统计字符、非空行和中英文词组。
 *
 * @param {string} value 待检查文本
 * @returns {{characters: number, lines: number, words: number}} 文本统计
 */
export function inspectText(value) {
  const text = String(value);
  return {
    characters: Array.from(text).length,
    lines: text.split(/\r?\n/).filter((line) => line.trim()).length,
    words: text.match(/[\p{Script=Han}]+|[\p{L}\p{N}]+/gu)?.length ?? 0,
  };
}
