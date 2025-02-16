const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
    name: "weather",
    aliases: ["cuaca"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx.used, "bogor"))
        );

        try {
            const apiUrl = tools.api.createUrl("agatz", "/api/cuaca", {
                message: input
            });
            const result = (await axios.get(apiUrl)).data.data;

            return await ctx.reply(
                `${quote(`Lokasi: ${result.location.name}, ${result.location.region}, ${result.location.country}`)}\n` +
                `${quote(`Latitude: ${result.location.lat}`)}\n` +
                `${quote(`Longitude: ${result.location.lon}`)}\n` +
                `${quote(`Zona Waktu: ${result.location.tz_id}`)}\n` +
                `${quote(`Waktu Lokal: ${result.location.localtime}`)}\n` +
                `${quote("─────")}\n` +
                `${quote(`Cuaca: ${await tools.general.translate(result.current.condition.text, "id")}`)}\n` +
                `${quote(`Suhu Saat Ini: ${result.current.temp_c}°C (${result.current.temp_f}°F)`)}\n` +
                `${quote(`Terasa Seperti: ${result.current.feelslike_c}°C (${result.current.feelslike_f}°F)`)}\n` +
                `${quote(`Kelembaban: ${result.current.humidity}%`)}\n` +
                `${quote(`Kecepatan Angin: ${result.current.wind_kph} kph (${result.current.wind_mph} mph)`)}\n` +
                `${quote(`Arah Angin: ${result.current.wind_dir} (${result.current.wind_degree}°)`)}\n` +
                `${quote(`Tekanan Udara: ${result.current.pressure_mb} mb (${result.current.pressure_in} in)`)}\n` +
                `${quote(`Curah Hujan: ${result.current.precip_mm} mm (${result.current.precip_in} in)`)}\n` +
                `${quote(`Kondisi Langit: ${result.current.cloud}% awan`)}\n` +
                `${quote(`Indeks UV: ${result.current.uv}`)}\n` +
                `${quote(`Jarak Pandang: ${result.current.vis_km} km (${result.current.vis_miles} mil)`)}\n` +
                `${quote(`Hembusan Angin: ${result.current.gust_kph} kph (${result.current.gust_mph} mph)`)}\n` +
                "\n" +
                config.msg.footer
            );
        } catch (error) {
            consolefy.error(`Error: ${error}`);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};