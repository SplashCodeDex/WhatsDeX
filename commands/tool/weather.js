const axios = require('axios');
const moment = require('moment-timezone');
const z = require('zod');
const { createUrl } = require('../../tools/api');
const { ucwords } = require('../../utils/formatters');

module.exports = {
  name: 'weather',
  aliases: ['cuaca'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async (ctx) => {
    const { formatter, config } = ctx.bot.context;

    try {
      const input = ctx.args.join(' ');

      // Validation
      const locationSchema = z.string().min(1, { message: 'Please provide a location.' });
      const validationResult = locationSchema.safeParse(input);
      if (!validationResult.success) {
        return ctx.reply(formatter.quote(`❎ ${validationResult.error.issues[0].message}\n\nExample: .weather London`));
      }
      const location = validationResult.data;

      // API Call
      const apiUrl = createUrl('diibot', '/api/tools/cekcuaca', {
        query: location,
      });
      const result = (await axios.get(apiUrl)).data.result;

      const replyText = [
        `Lokasi: ${result.name}, ${result.sys.country}`,
        `Koordinat: ${result.coord.lat}, ${result.coord.lon}`,
        `Terakhir diperbarui: ${moment.unix(result.dt).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')} WIB`,
        '· · ─ ·✶· ─ · ·',
        `Cuaca: ${ucwords(result.weather[0].description)}`,
        `Suhu: ${result.main.temp}°C (Min ${result.main.temp_min}°C | Max ${result.main.temp_max}°C)`,
        `Terasa seperti: ${result.main.feels_like}°C`,
        `Kelembaban: ${result.main.humidity}%`,
        `Tekanan Udara: ${result.main.pressure} hPa`,
        '· · ─ ·✶· ─ · ·',
        `Angin: ${result.wind.speed} m/s (${(result.wind.speed * 3.6).toFixed(1)} km/h)`,
        `Arah Angin: ${result.wind.deg}°`,
        `Hembusan: ${result.wind.gust} m/s`,
        '· · ─ ·✶· ─ · ·',
        `Awan: ${result.clouds.all}%`,
        `Jarak Pandang: ${(result.visibility / 1000).toFixed(1)} km`,
        `Matahari Terbit: ${moment.unix(result.sys.sunrise).tz('Asia/Jakarta').format('HH:mm')} WIB`,
        `Matahari Terbenam: ${moment.unix(result.sys.sunset).tz('Asia/Jakarta').format('HH:mm')} WIB`,
      ].map((line) => formatter.quote(line)).join('\n');

      return ctx.reply({
        text: replyText,
        footer: config.msg.footer,
      });
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};