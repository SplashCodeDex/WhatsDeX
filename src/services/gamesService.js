/**
 * Games Service - Interactive games for WhatsApp Bot
 * Implements proper architecture with error handling, logging, and rate limiting
 */

const axios = require('axios');
const { AkinatorAPI, AkinatorAnswer } = require('aki-api');
const { Chess } = require('chess.js');

class GamesService {
  constructor() {
    this.activeGames = new Map();
    this.gameTimeouts = new Map();
    this.rateLimits = new Map();
  }

  /**
   * Tebak Bom Game Implementation
   * @param {string} chatId - Chat ID
   * @param {string} playerId - Player ID
   */
  async startTebakBom(chatId, playerId) {
    try {
      const gameId = `${chatId}_${playerId}_${Date.now()}`;

      const gameData = {
        id: gameId,
        chatId,
        playerId,
        petak: this.generateBombPositions(),
        board: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
        bomb: 3,
        lolos: 7,
        pick: 0,
        nyawa: ['❤️', '❤️', '❤️'],
        startTime: Date.now(),
      };

      this.activeGames.set(gameId, gameData);

      // Set timeout for 2 minutes
      const timeout = setTimeout(() => {
        this.endGame(gameId, 'timeout');
      }, 120000);

      this.gameTimeouts.set(gameId, timeout);

      return {
        success: true,
        message: `*TEBAK BOM*\n\n${gameData.board.join('')}\n\nPilih angka tersebut! Jangan sampai terkena Bom!\nBomb: ${gameData.bomb}\nNyawa: ${gameData.nyawa.join('')}`,
        gameId,
      };
    } catch (error) {
      console.error('Error starting tebak bom:', error);
      throw new Error('Failed to start tebak bom game');
    }
  }

  /**
   * Process Tebak Bom guess
   * @param {string} gameId - Game ID
   * @param {number} guess - User's guess (1-10)
   */
  async processTebakBomGuess(gameId, guess) {
    try {
      const game = this.activeGames.get(gameId);
      if (!game) {
        return { success: false, message: 'Game tidak ditemukan!' };
      }

      if (guess < 1 || guess > 10) {
        return { success: false, message: 'Pilih angka 1-10!' };
      }

      const position = guess - 1;

      // Check if position already picked
      if (game.petak[position] === 1) {
        return { success: false, message: 'Posisi sudah dipilih sebelumnya!' };
      }

      // Check if it's a bomb
      if (game.petak[position] === 2) {
        game.board[position] = '💣';
        game.pick++;
        game.bomb--;
        game.nyawa.pop();

        if (game.nyawa.length < 1) {
          return await this.endGame(gameId, 'lose');
        }
        return {
          success: true,
          message: `*PILIH ANGKA*\n\nKamu terkena bomb\n${game.board.join('')}\n\nTerpilih: ${game.pick}\nSisa nyawa: ${game.nyawa.join('')}`,
          isBomb: true,
        };
      }
      // Safe position
      game.petak[position] = 1;
      game.board[position] = '🌀';
      game.pick++;
      game.lolos--;

      if (game.lolos < 1) {
        return await this.endGame(gameId, 'win');
      }
      return {
        success: true,
        message: `*PILIH ANGKA*\n\n${game.board.join('')}\n\nTerpilih: ${game.pick}\nSisa nyawa: ${game.nyawa.join('')}\nBomb: ${game.bomb}`,
        isSafe: true,
      };
    } catch (error) {
      console.error('Error processing tebak bom guess:', error);
      throw new Error('Failed to process guess');
    }
  }

  /**
   * Akinator Game Implementation
   * @param {string} playerId - Player ID
   */
  async startAkinator(playerId) {
    try {
      const gameId = `akinator_${playerId}_${Date.now()}`;

      const akinator = new AkinatorAPI({ region: 'id', childMode: false });
      await akinator.start();

      const gameData = {
        id: gameId,
        playerId,
        akinator,
        startTime: Date.now(),
      };

      this.activeGames.set(gameId, gameData);

      // Set timeout for 10 minutes
      const timeout = setTimeout(() => {
        this.endGame(gameId, 'timeout');
      }, 600000);

      this.gameTimeouts.set(gameId, timeout);

      return {
        success: true,
        message: `🎮 Akinator Game:\n\n@${playerId.split('@')[0]}\n${akinator.question}\n\n- 0 - Ya\n- 1 - Tidak\n- 2 - Tidak Tau\n- 3 - Mungkin\n- 4 - Mungkin Tidak\n- 5 - Back`,
        gameId,
      };
    } catch (error) {
      console.error('Error starting akinator:', error);
      throw new Error('Failed to start akinator game');
    }
  }

  /**
   * Process Akinator answer
   * @param {string} gameId - Game ID
   * @param {number} answer - User's answer (0-5)
   */
  async processAkinatorAnswer(gameId, answer) {
    try {
      const game = this.activeGames.get(gameId);
      if (!game || !game.akinator) {
        return { success: false, message: 'Game akinator tidak ditemukan!' };
      }

      if (answer === 5) {
        // Back/End game
        if (game.akinator.progress.toFixed(0) == 0) {
          await this.endGame(gameId, 'quit');
          return { success: true, message: '🎮 Akinator Game End!\nWith *0* Progress' };
        }

        game.akinator.isWin = false;
        await game.akinator.cancelAnswer();

        return {
          success: true,
          message: `🎮 Akinator Game Back:\n\n@${game.playerId.split('@')[0]} (${game.akinator.progress.toFixed(2)})%\n${game.akinator.question}\n\n- 0 - Ya\n- 1 - Tidak\n- 2 - Tidak Tau\n- 3 - Mungkin\n- 4 - Mungkin Tidak\n- 5 - ${game.akinator.progress.toFixed(0) == 0 ? 'End' : 'Back'}`,
          needNewQuestion: true,
        };
      }

      await game.akinator.answer(answer);

      if (game.akinator.isWin) {
        return {
          success: true,
          message: `🎮 Akinator Answer:\n\n@${game.playerId.split('@')[0]}\nDia adalah *${game.akinator.sugestion_name}*\n_${game.akinator.sugestion_desc}_\n\n- 5 - Back\n- *Ya* (untuk keluar dari sesi)`,
          isWin: true,
          suggestion: {
            name: game.akinator.sugestion_name,
            description: game.akinator.sugestion_desc,
            photo: game.akinator.sugestion_photo,
          },
        };
      }
      return {
        success: true,
        message: `🎮 Akinator Game:\n\n@${game.playerId.split('@')[0]} (${game.akinator.progress.toFixed(2)})%\n${game.akinator.question}\n\n- 0 - Ya\n- 1 - Tidak\n- 2 - Tidak Tau\n- 3 - Mungkin\n- 4 - Mungkin Tidak\n- 5 - Back`,
        progress: game.akinator.progress,
      };
    } catch (error) {
      console.error('Error processing akinator answer:', error);
      throw new Error('Failed to process akinator answer');
    }
  }

  /**
   * Chess Game Implementation
   * @param {string} chatId - Chat ID
   * @param {string} player1Id - Player 1 ID
   * @param {string} player2Id - Player 2 ID
   */
  async startChessGame(chatId, player1Id, player2Id) {
    try {
      const gameId = `chess_${chatId}_${Date.now()}`;

      const gameData = {
        id: gameId,
        chatId,
        player1: player1Id,
        player2: player2Id,
        game: new Chess(),
        turn: player1Id,
        startTime: Date.now(),
        botMode: false,
      };

      this.activeGames.set(gameId, gameData);

      // Set timeout for 30 minutes
      const timeout = setTimeout(() => {
        this.endGame(gameId, 'timeout');
      }, 1800000);

      this.gameTimeouts.set(gameId, timeout);

      return {
        success: true,
        message: `♟️CHESS GAME\n\n@${player1Id.split('@')[0]} vs @${player2Id.split('@')[0]}\n\n@${player1Id.split('@')[0]} mulai duluan!\nGiliran: @${player1Id.split('@')[0]}\n\nFormat: from to (e2 e4)`,
        gameId,
      };
    } catch (error) {
      console.error('Error starting chess game:', error);
      throw new Error('Failed to start chess game');
    }
  }

  /**
   * Process Chess move
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player making the move
   * @param {string} move - Chess move (e.g., "e2 e4")
   */
  async processChessMove(gameId, playerId, move) {
    try {
      const game = this.activeGames.get(gameId);
      if (!game || !game.game) {
        return { success: false, message: 'Game catur tidak ditemukan!' };
      }

      if (game.turn !== playerId) {
        return { success: false, message: 'Bukan giliranmu!' };
      }

      if (game.game.isGameOver()) {
        return { success: false, message: 'Game sudah selesai!' };
      }

      const [from, to] = move.toLowerCase().split(' ');
      if (!from || !to || from.length !== 2 || to.length !== 2) {
        return { success: false, message: 'Format salah! Gunakan: e2 e4' };
      }

      try {
        game.game.move({ from, to });
      } catch (error) {
        return { success: false, message: 'Langkah tidak valid!' };
      }

      // Switch turns
      game.turn = game.turn === game.player1 ? game.player2 : game.player1;

      if (game.game.isGameOver()) {
        let result;
        if (game.game.isCheckmate()) {
          const winner = game.game.turn() === 'w' ? game.player2 : game.player1;
          result = `♟️CHECKMATE!\n@${winner.split('@')[0]} menang!`;
        } else if (game.game.isDraw()) {
          result = '♟️DRAW!\nPermainan seri!';
        } else {
          result = '♟️GAME OVER!';
        }

        await this.endGame(gameId, 'finished');
        return {
          success: true,
          message: result,
          gameOver: true,
          fen: game.game.fen(),
        };
      }

      return {
        success: true,
        message: `♟️CHESS GAME\n\nLangkah: ${from} → ${to}\nGiliran: @${game.turn.split('@')[0]}\n\nReply pesan ini untuk lanjut bermain!\nExample: e2 e4`,
        fen: game.game.fen(),
      };
    } catch (error) {
      console.error('Error processing chess move:', error);
      throw new Error('Failed to process chess move');
    }
  }

  /**
   * Generate bomb positions for tebak bom game
   */
  generateBombPositions() {
    const positions = [0, 0, 0, 2, 0, 2, 0, 2, 0, 0]; // 3 bombs at positions 3, 5, 7
    return positions.sort(() => Math.random() - 0.5);
  }

  /**
   * End game and cleanup
   * @param {string} gameId - Game ID
   * @param {string} reason - Reason for ending
   */
  async endGame(gameId, reason) {
    try {
      const game = this.activeGames.get(gameId);
      if (!game) return;

      // Clear timeout
      const timeout = this.gameTimeouts.get(gameId);
      if (timeout) {
        clearTimeout(timeout);
        this.gameTimeouts.delete(gameId);
      }

      // Remove from active games
      this.activeGames.delete(gameId);

      console.log(`Game ${gameId} ended. Reason: ${reason}`);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  /**
   * Get active game by player
   * @param {string} playerId - Player ID
   * @param {string} gameType - Type of game
   */
  getActiveGame(playerId, gameType = null) {
    for (const [gameId, game] of this.activeGames.entries()) {
      if (game.playerId === playerId || game.player1 === playerId || game.player2 === playerId) {
        if (gameType && !gameId.includes(gameType)) continue;
        return { gameId, game };
      }
    }
    return null;
  }

  /**
   * Clean up inactive games
   */
  cleanupInactiveGames() {
    const now = Date.now();
    const maxGameTime = 30 * 60 * 1000; // 30 minutes

    for (const [gameId, game] of this.activeGames.entries()) {
      if (now - game.startTime > maxGameTime) {
        this.endGame(gameId, 'cleanup');
      }
    }
  }

  /**
   * Check rate limits for games
   * @param {string} playerId - Player ID
   * @param {string} gameType - Type of game
   */
  checkRateLimit(playerId, gameType) {
    const key = `${playerId}_${gameType}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now - limit.lastGame > 60000) {
      // 1 minute cooldown
      this.rateLimits.set(key, { lastGame: now, count: 1 });
      return true;
    }

    if (limit.count >= 3) {
      // Max 3 games per minute
      return false;
    }

    limit.count++;
    return true;
  }
}

module.exports = new GamesService();
