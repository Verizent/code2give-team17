function toLocalized(row, prefix) {
  const zh = row[`${prefix}_zh`];
  return {
    en: row[`${prefix}_en`],
    "zh-Hant": zh,
    "zh-Hans": zh,
  };
}

module.exports = { toLocalized };
