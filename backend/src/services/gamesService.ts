/**
 * Games Service - Interactive games for WhatsApp Bot
 */

import axios from 'axios';
// Using any for now for external libs with complex ESM/CJS interop
import akiApiPkg from 'aki-api';
const { AkinatorAPI } = akiApiPkg as any;
import { Chess } from 'chess.js';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

interface GameBase {
  id: string;
  startTime: number;
}

interface TebakBomGame extends GameBase {
  chatId: string;
  playerId: string;
  petak: number[];
  board: string[];
  bomb: number;
  lolos: number;
  pick: number;
  nyawa: string[];
}

interface AkinatorGame extends GameBase {
  playerId: string;
  akinator: any;
}

interface ChessGame extends GameBase {
  chatId: string;
  player1: string;
  player2: string;
  game: any;
  turn: string;
}

export class GamesService {
  private static instance: GamesService;
  private activeGames: Map<string, any>;
  private gameTimeouts: Map<string, NodeJS.Timeout>;
  private rateLimits: Map<string, { lastGame: number; count: number }>;

  private constructor() {
    this.activeGames = new Map();
    this.gameTimeouts = new Map();
    this.rateLimits = new Map();
  }

  public static getInstance(): GamesService {
    if (!GamesService.instance) {
      GamesService.instance = new GamesService();
    }
    return GamesService.instance;
  }

  /**
   * Start Tebak Bom
   */
  async startTebakBom(chatId: string, playerId: string): Promise<Result<{ message: string; gameId: string }>> {
    try {
      const gameId = `bom_${chatId}_${playerId}_${Date.now()}`;
      const game: TebakBomGame = {
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

      this.activeGames.set(gameId, game);
      this.gameTimeouts.set(gameId, setTimeout(() => this.endGame(gameId, 'timeout'), 120000));

      return {
        success: true,
        data: {
          gameId,
          message: `*TEBAK BOM*\n\n${game.board.join('')}\n\nBomb: ${game.bomb}\nNyawa: ${game.nyawa.join('')}`
        }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  async processTebakBomGuess(gameId: string, guess: number): Promise<Result<{ message: string; gameOver?: boolean }>> {
    const game = this.activeGames.get(gameId) as TebakBomGame;
    if (!game) return { success: false, error: new Error('Game tidak ditemukan!') };

    const pos = guess - 1;
    if (game.petak[pos] === 1) return { success: false, error: new Error('Sudah dipilih!') };

    if (game.petak[pos] === 2) {
      game.board[pos] = '💣';
      game.nyawa.pop();
      if (game.nyawa.length === 0) {
        await this.endGame(gameId, 'lose');
        return { success: true, data: { message: 'BOM! Kamu kalah!', gameOver: true } };
      }
    } else {
      game.petak[pos] = 1;
      game.board[pos] = '🌀';
      game.lolos--;
      if (game.lolos === 0) {
        await this.endGame(gameId, 'win');
        return { success: true, data: { message: 'Selamat! Kamu menang!', gameOver: true } };
      }
    }

    return { success: true, data: { message: `${game.board.join('')}\nNyawa: ${game.nyawa.join('')}` } };
  }

  /**
   * Start Akinator
   */
  async startAkinator(playerId: string): Promise<Result<{ message: string; gameId: string }>> {
    try {
      const gameId = `aki_${playerId}_${Date.now()}`;
      const akinator = new AkinatorAPI({ region: 'id', childMode: false });
      await akinator.start();

      const game: AkinatorGame = { id: gameId, playerId, akinator, startTime: Date.now() };
      this.activeGames.set(gameId, game);
      this.gameTimeouts.set(gameId, setTimeout(() => this.endGame(gameId, 'timeout'), 600000));

      return {
        success: true,
        data: { gameId, message: `🎮 Akinator:\n${akinator.question}` }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private generateBombPositions(): number[] {
    return [0, 0, 0, 2, 0, 2, 0, 2, 0, 0].sort(() => Math.random() - 0.5);
  }

  async endGame(gameId: string, reason: string): Promise<void> {
    const timeout = this.gameTimeouts.get(gameId);
    if (timeout) {
      clearTimeout(timeout);
      this.gameTimeouts.delete(gameId);
    }
    this.activeGames.delete(gameId);
    logger.debug(`Game ${gameId} ended: ${reason}`);
  }

  public getActiveGame(playerId: string, gameType: string | null = null) {
    for (const [id, game] of this.activeGames.entries()) {
      if (game.playerId === playerId || game.player1 === playerId || game.player2 === playerId) {
        if (gameType && !id.includes(gameType)) continue;
        return { gameId: id, game };
      }
    }
    return null;
  }

  public checkRateLimit(playerId: string, gameType: string): boolean {
    const key = `${playerId}_${gameType}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now - limit.lastGame > 60000) {
      this.rateLimits.set(key, { lastGame: now, count: 1 });
      return true;
    }

    if (limit.count >= 3) return false;
    limit.count++;
    return true;
  }
}

export const gamesService = GamesService.getInstance();
export default gamesService;
