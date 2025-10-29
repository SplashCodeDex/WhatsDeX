const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { Chess } = require('chess.js');
// AkinatorAPI is stateful and cannot be easily serialized to a database.
// For this refactor, Akinator will be omitted. A proper implementation
// would require a custom, serializable state management for it.

class GamesService {
    constructor() {
        // Periodically clean up expired games
        setInterval(() => this.cleanupExpiredGames(), 60 * 1000);
    }

    // --- Tebak Bom Game ---

    async startTebakBom(chatId, playerId) {
        const twoMinutesFromNow = new Date(Date.now() + 2 * 60 * 1000);
        const initialGameState = {
            petak: this._generateBombPositions(),
            board: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
            bomb: 3,
            lolos: 7,
            pick: 0,
            nyawa: 3,
        };

        const gameSession = await prisma.gameSession.create({
            data: {
                gameType: 'tebak_bom',
                chatId,
                players: [playerId],
                gameState: initialGameState,
                expiresAt: twoMinutesFromNow,
            },
        });

        return {
            success: true,
            message: `*TEBAK BOM*\n\n${initialGameState.board.join('')}\n\nPilih angka! Jangan sampai kena Bom!\nBomb: ${initialGameState.bomb}\nNyawa: ${'❤️'.repeat(initialGameState.nyawa)}`,
            gameId: gameSession.id,
        };
    }

    async processTebakBomGuess(gameId, guess) {
        const game = await this.getActiveGame(gameId);
        if (!game) {
            return { success: false, message: 'Game tidak ditemukan!' };
        }

        let gameState = game.gameState;
        const position = guess - 1;

        if (gameState.petak[position] === 1 || gameState.board[position] === '💣' || gameState.board[position] === '🌀') {
            return { success: false, message: 'Posisi sudah dipilih sebelumnya!' };
        }

        if (gameState.petak[position] === 2) { // It's a bomb
            gameState.board[position] = '💣';
            gameState.pick++;
            gameState.bomb--;
            gameState.nyawa--;

            if (gameState.nyawa < 1) {
                await this.endGame(gameId, 'lose');
                return { success: true, message: `BOOM! Kamu kehabisan nyawa. Permainan berakhir.`, gameOver: true };
            }
        } else { // Safe position
            gameState.petak[position] = 1;
            gameState.board[position] = '🌀';
            gameState.pick++;
            gameState.lolos--;

            if (gameState.lolos < 1) {
                await this.endGame(gameId, 'win');
                return { success: true, message: `Selamat! Kamu berhasil menghindari semua bom!`, gameOver: true };
            }
        }

        await prisma.gameSession.update({
            where: { id: gameId },
            data: { gameState },
        });

        return {
            success: true,
            message: `*PILIH ANGKA*\n\n${gameState.board.join('')}\n\nTerpilih: ${gameState.pick}\nSisa nyawa: ${'❤️'.repeat(gameState.nyawa)}\nBomb: ${gameState.bomb}`,
        };
    }

    _generateBombPositions() {
        const positions = [0, 0, 0, 2, 0, 2, 0, 2, 0, 0];
        return positions.sort(() => Math.random() - 0.5);
    }

    // --- Chess Game ---

    async startChessGame(chatId, player1Id, player2Id) {
        const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
        const chess = new Chess();
        const initialGameState = {
            fen: chess.fen(),
            turn: player1Id,
        };

        const gameSession = await prisma.gameSession.create({
            data: {
                gameType: 'chess',
                chatId,
                players: [player1Id, player2Id],
                gameState: initialGameState,
                expiresAt: thirtyMinutesFromNow,
            },
        });

        return {
            success: true,
            message: `♟️ *CHESS GAME* ♟️\n\n@${player1Id.split('@')[0]} (Putih) vs @${player2Id.split('@')[0]} (Hitam)\n\nGiliran: @${player1Id.split('@')[0]}\n\nFormat: \`from to\` (contoh: e2 e4)`,
            gameId: gameSession.id,
        };
    }

    async processChessMove(gameId, playerId, move) {
        const game = await this.getActiveGame(gameId);
        if (!game) {
            return { success: false, message: 'Game catur tidak ditemukan!' };
        }

        let gameState = game.gameState;
        if (gameState.turn !== playerId) {
            return { success: false, message: 'Bukan giliranmu!' };
        }

        const chess = new Chess(gameState.fen);
        const [from, to] = move.toLowerCase().split(' ');

        try {
            const result = chess.move({ from, to, promotion: 'q' }); // Auto-promote to queen for simplicity
            if (result === null) throw new Error('Invalid move');
        } catch (error) {
            return { success: false, message: 'Langkah tidak valid!' };
        }

        const player1 = game.players[0];
        const player2 = game.players[1];
        gameState.turn = gameState.turn === player1 ? player2 : player1;
        gameState.fen = chess.fen();

        if (chess.isGameOver()) {
            let resultMessage;
            if (chess.isCheckmate()) {
                const winner = gameState.turn === player1 ? player2 : player1; // The player whose turn it *isn't*
                resultMessage = `♟️ *SKAKMAT!* ♟️\n\nPemenang: @${winner.split('@')[0]}`;
            } else {
                resultMessage = '♟️ *PERMAINAN SERI!* ♟️';
            }
            await this.endGame(gameId, 'finished');
            return { success: true, message: resultMessage, gameOver: true, fen: gameState.fen };
        }

        await prisma.gameSession.update({
            where: { id: gameId },
            data: { gameState },
        });

        return {
            success: true,
            message: `Langkah: ${from} → ${to}\nGiliran: @${gameState.turn.split('@')[0]}`,
            fen: gameState.fen,
        };
    }

    // --- General Game Management ---

    async endGame(gameId, reason) {
        logger.info(`Game ${gameId} ended. Reason: ${reason}`);
        return prisma.gameSession.update({
            where: { id: gameId },
            data: { isActive: false },
        });
    }

    async getActiveGame(idOrPlayerId, gameType = null) {
        const whereClause = {
            isActive: true,
            expiresAt: { gt: new Date() },
        };

        if (idOrPlayerId.includes('@')) { // It's a player ID
             whereClause.players = { has: idOrPlayerId };
        } else { // It's a game ID
            whereClause.id = idOrPlayerId;
        }

        if (gameType) {
            whereClause.gameType = gameType;
        }

        return prisma.gameSession.findFirst({ where: whereClause });
    }

    async cleanupExpiredGames() {
        const result = await prisma.gameSession.updateMany({
            where: {
                isActive: true,
                expiresAt: { lt: new Date() },
            },
            data: { isActive: false },
        });
        if (result.count > 0) {
            logger.info(`Cleaned up ${result.count} expired game sessions.`);
        }
    }
}

module.exports = new GamesService();
