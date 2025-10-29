const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class FunCommandsService {

    async _getRandomContent(type, category = null) {
        const where = { type };
        if (category) {
            where.category = category;
        }

        const count = await prisma.funContent.count({ where });
        if (count === 0) {
            // Fallback content if the database is empty
            return { content: `No content for ${type} found.` };
        }

        const skip = Math.floor(Math.random() * count);
        const item = await prisma.funContent.findFirst({ where, skip });
        return item;
    }

    async cekSifat(name) {
        const sifatBaik = await this._getRandomContent('sifat_baik');
        const sifatBuruk = await this._getRandomContent('sifat_buruk');

        return {
            success: true,
            result: `*Sifat ${name}:*\n- *Kelebihan:* ${sifatBaik.content}\n- *Kekurangan:* ${sifatBuruk.content}`,
        };
    }

    async cekKhodam(name) {
        const khodam = await this._getRandomContent('khodam');
        return {
            success: true,
            result: `Khodam dari *${name}* adalah *${khodam.content}*.`,
        };
    }

    async getRandomQuote(category) {
        const quote = await this._getRandomContent('quote', category);
        return {
            success: true,
            result: `_${quote.content}_${quote.author ? `\n\n*- ${quote.author}*` : ''}`,
        };
    }

    async bisakah(text) {
        const response = await this._getRandomContent('bisakah_response');
        return {
            success: true,
            result: `*Bisakah ${text}?*\nJawab: ${response.content}`,
        };
    }

    async apakah(text) {
        const response = await this._getRandomContent('apakah_response');
        return {
            success: true,
            result: `*Apakah ${text}?*\nJawab: ${response.content}`,
        };
    }

    async kapan(text) {
        const response = await this._getRandomContent('kapan_response');
        return {
            success: true,
            result: `*Kapan ${text}?*\nJawab: ${response.content}`,
        };
    }

    async checkRateLimit(userId, command, limit = 5, cooldown = 30000) {
        const key = `${userId}_${command}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + cooldown);

        const rateLimit = await prisma.rateLimit.upsert({
            where: { key },
            update: { count: { increment: 1 } },
            create: { key, count: 1, expiresAt },
        });

        if (rateLimit.expiresAt < now) {
            await prisma.rateLimit.update({
                where: { key },
                data: { count: 1, expiresAt },
            });
            return true;
        }

        return rateLimit.count <= limit;
    }
}

module.exports = new FunCommandsService();
