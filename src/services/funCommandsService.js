/**
 * Fun Commands Service - Entertainment features for WhatsApp Bot
 * Implements fun interactions with proper error handling and rate limiting
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class FunCommandsService {
    constructor() {
        this.rateLimits = new Map();
        this.khodamData = null;
        this.quotesData = null;
    }

    /**
     * Initialize service data
     */
    async initialize() {
        try {
            await this.loadKhodamData();
            await this.loadQuotesData();
        } catch (error) {
            console.error('Error initializing fun commands service:', error);
        }
    }

    /**
     * Load Khodam data from external source
     */
    async loadKhodamData() {
        try {
            const response = await axios.get('https://raw.githubusercontent.com/nazedev/database/refs/heads/master/random/cekkhodam.json');
            this.khodamData = response.data;
        } catch (error) {
            console.error('Error loading khodam data:', error);
            // Fallback data
            this.khodamData = [
                { nama: 'Dokter Indosiar', deskripsi: 'Khodam yang selalu memberikan resep obat' },
                { nama: 'Sigit Rendang', deskripsi: 'Khodam yang ahli dalam kuliner' },
                { nama: 'Ustadz Sinetron', deskripsi: 'Khodam yang pandai berdakwah' }
            ];
        }
    }

    /**
     * Load quotes data
     */
    async loadQuotesData() {
        try {
            const [motivasiRes, bijakRes, bucinRes] = await Promise.all([
                axios.get('https://raw.githubusercontent.com/nazedev/database/refs/heads/master/kata-kata/motivasi.json'),
                axios.get('https://raw.githubusercontent.com/nazedev/database/refs/heads/master/kata-kata/bijak.json'),
                axios.get('https://raw.githubusercontent.com/nazedev/database/refs/heads/master/kata-kata/bucin.json')
            ]);

            this.quotesData = {
                motivasi: motivasiRes.data,
                bijak: bijakRes.data,
                bucin: bucinRes.data
            };
        } catch (error) {
            console.error('Error loading quotes data:', error);
            // Fallback data
            this.quotesData = {
                motivasi: ['Tetap semangat!'],
                bijak: ['Hidup adalah pilihan'],
                bucin: ['Aku sayang kamu']
            };
        }
    }

    /**
     * Cek Sifat command implementation
     * @param {string} name - Name to analyze
     */
    async cekSifat(name) {
        try {
            const sifatBaik = [
                'Bijak', 'Sabar', 'Kreatif', 'Humoris', 'Mudah bergaul',
                'Mandiri', 'Setia', 'Jujur', 'Dermawan', 'Idealis',
                'Adil', 'Sopan', 'Tekun', 'Rajin', 'Pemaaf'
            ];

            const sifatBuruk = [
                'Sombong', 'Minder', 'Pendendam', 'Sensitif', 'Perfeksionis',
                'Caper', 'Pelit', 'Egois', 'Pesimis', 'Penyendiri'
            ];

            const randomSifatBaik = sifatBaik[Math.floor(Math.random() * sifatBaik.length)];
            const randomSifatBuruk = sifatBuruk[Math.floor(Math.random() * sifatBuruk.length)];

            const keberanian = Math.floor(Math.random() * 100);
            const kepedulian = Math.floor(Math.random() * 100);
            const kecemasan = Math.floor(Math.random() * 100);
            const ketakutan = Math.floor(Math.random() * 100);
            const akhlakBaik = Math.floor(Math.random() * 100);
            const akhlakBuruk = Math.floor(Math.random() * 100);

            return {
                success: true,
                result: `╭──❍「 *Cek Sifat* 」❍\n` +
                       `│• Sifat ${name}\n` +
                       `│• Orang yang : *${randomSifatBaik}*\n` +
                       `│• Kekurangan : *${randomSifatBuruk}*\n` +
                       `│• Keberanian : *${keberanian}%*\n` +
                       `│• Kepedulian : *${kepedulian}%*\n` +
                       `│• Kecemasan : *${kecemasan}%*\n` +
                       `│• Ketakutan : *${ketakutan}%*\n` +
                       `│• Akhlak Baik : *${akhlakBaik}%*\n` +
                       `│• Akhlak Buruk : *${akhlakBuruk}%*\n` +
                       `╰──────❍`
            };

        } catch (error) {
            console.error('Error in cek sifat:', error);
            throw new Error('Failed to analyze personality');
        }
    }

    /**
     * Cek Khodam command implementation
     * @param {string} name - Name to check
     */
    async cekKhodam(name) {
        try {
            if (!this.khodamData) {
                await this.loadKhodamData();
            }

            const randomKhodam = this.khodamData[Math.floor(Math.random() * this.khodamData.length)];

            return {
                success: true,
                result: `Khodam dari *${name}* adalah *${randomKhodam.nama}*\n_${randomKhodam.deskripsi}_`
            };

        } catch (error) {
            console.error('Error in cek khodam:', error);
            throw new Error('Failed to check khodam');
        }
    }

    /**
     * Cek Mati command implementation
     * @param {string} name - Name to check
     */
    async cekMati(name) {
        try {
            // Use agify.io API for age prediction
            const response = await axios.get(`https://api.agify.io/?name=${encodeURIComponent(name)}`);
            const age = response.data.age || Math.floor(Math.random() * 90) + 20;

            return {
                success: true,
                result: `Nama : ${name}\n*Mati Pada Umur :* ${age} Tahun.\n\n_Cepet Cepet Tobat Bro_\n_Soalnya Mati ga ada yang tau_`
            };

        } catch (error) {
            console.error('Error in cek mati:', error);
            // Fallback if API fails
            const age = Math.floor(Math.random() * 90) + 20;
            return {
                success: true,
                result: `Nama : ${name}\n*Mati Pada Umur :* ${age} Tahun.\n\n_Cepet Cepet Tobat Bro_\n_Soalnya Mati ga ada yang tau_`
            };
        }
    }

    /**
     * Get random quote by category
     * @param {string} category - Quote category (motivasi, bijak, bucin)
     */
    async getRandomQuote(category) {
        try {
            if (!this.quotesData) {
                await this.loadQuotesData();
            }

            const quotes = this.quotesData[category];
            if (!quotes || quotes.length === 0) {
                throw new Error('Quotes not available');
            }

            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

            return {
                success: true,
                result: category === 'quotes' ?
                    `_${randomQuote.quotes}_\n\n*- ${randomQuote.author}*` :
                    randomQuote
            };

        } catch (error) {
            console.error(`Error getting ${category} quote:`, error);
            throw new Error(`Failed to get ${category} quote`);
        }
    }

    /**
     * Bisakah command implementation
     * @param {string} text - Question to ask
     */
    async bisakah(text) {
        try {
            const responses = [
                'Bisa', 'Coba Saja', 'Pasti Bisa', 'Mungkin Saja',
                'Tidak Bisa', 'Tidak Mungkin', 'Coba Ulangi',
                'Ngimpi kah?', 'yakin bisa?'
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            return {
                success: true,
                result: `*Bisakah ${text}*\nJawab : ${randomResponse}`
            };

        } catch (error) {
            console.error('Error in bisakah:', error);
            throw new Error('Failed to process question');
        }
    }

    /**
     * Apakah command implementation
     * @param {string} text - Question to ask
     */
    async apakah(text) {
        try {
            const responses = [
                'Iya', 'Tidak', 'Bisa Jadi', 'Coba Ulangi',
                'Mungkin Saja', 'Mungkin Tidak', 'Mungkin Iya', 'Ntahlah'
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            return {
                success: true,
                result: `*Apakah ${text}*\nJawab : ${randomResponse}`
            };

        } catch (error) {
            console.error('Error in apakah:', error);
            throw new Error('Failed to process question');
        }
    }

    /**
     * Kapan command implementation
     * @param {string} text - Question to ask
     */
    async kapan(text) {
        try {
            const responses = [
                'Besok', 'Lusa', 'Nanti', '4 Hari Lagi', '5 Hari Lagi',
                '6 Hari Lagi', '1 Minggu Lagi', '2 Minggu Lagi', '3 Minggu Lagi',
                '1 Bulan Lagi', '2 Bulan Lagi', '3 Bulan Lagi', '4 Bulan Lagi',
                '5 Bulan Lagi', '6 Bulan Lagi', '1 Tahun Lagi', '2 Tahun Lagi',
                '3 Tahun Lagi', '4 Tahun Lagi', '5 Tahun Lagi', '6 Tahun Lagi',
                '1 Abad lagi', '3 Hari Lagi', 'Bulan Depan', 'Ntahlah',
                'Tidak Akan Pernah'
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            return {
                success: true,
                result: `*Kapan ${text}*\nJawab : ${randomResponse}`
            };

        } catch (error) {
            console.error('Error in kapan:', error);
            throw new Error('Failed to process question');
        }
    }

    /**
     * Check rate limit for fun commands
     * @param {string} userId - User ID
     * @param {string} command - Command name
     */
    checkRateLimit(userId, command) {
        const key = `${userId}_${command}`;
        const now = Date.now();
        const limit = this.rateLimits.get(key);

        if (!limit || now - limit.lastUsed > 30000) { // 30 seconds cooldown
            this.rateLimits.set(key, { lastUsed: now, count: 1 });
            return true;
        }

        if (limit.count >= 5) { // Max 5 uses per 30 seconds
            return false;
        }

        limit.count++;
        return true;
    }
}

module.exports = new FunCommandsService();