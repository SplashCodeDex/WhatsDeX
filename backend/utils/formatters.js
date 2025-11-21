function convertMsToDuration(ms, units = []) {
  if (!ms || ms <= 0) return '0 hari';

  const timeUnits = {
    tahun: 31557600000,
    bulan: 2629800000,
    minggu: 604800000,
    hari: 86400000,
    jam: 3600000,
    menit: 60000,
    detik: 1000,
    milidetik: 1,
  };

  if (units.length > 0) {
    const result = [];
    for (const unit of units) {
      if (timeUnits[unit]) {
        const value = Math.floor(ms / timeUnits[unit]);
        if (value > 0) result.push(`${value} ${unit}`);
        ms %= timeUnits[unit];
      }
    }
    return result.join(' ') || `0 ${units[0]}`;
  }

  const result = [];
  for (const [unit, duration] of Object.entries(timeUnits)) {
    const value = Math.floor(ms / duration);
    if (value > 0) {
      result.push(`${value} ${unit}`);
      ms %= duration;
    }
  }
  return result.join(' ') || '0 detik';
}

function ucwords(text) {
  if (!text) return null;

  return text.toLowerCase().replace(/\b\w/g, t => t.toUpperCase());
}

export default {
  convertMsToDuration,
  ucwords,
};
