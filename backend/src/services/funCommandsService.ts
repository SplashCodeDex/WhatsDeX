/**
 * Fun Commands Service - Entertainment features for WhatsApp Bot
 */

import axios from 'axios';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

interface Khodam {
  nama: string;
  deskripsi: string;
}

interface QuotesData {
  motivasi: string[];
  bijak: string[];
  bucin: string[];
  [key: string]: string[];
}

export class FunCommandsService {
  private static instance: FunCommandsService;
  private rateLimits: Map<string, { lastUsed: number; count: number }>;
  private khodamData: Khodam[] | null;
  private quotesData: QuotesData | null;

  private constructor() {
    this.rateLimits = new Map();
    this.khodamData = null;
    this.quotesData = null;
  }

  public static getInstance(): FunCommandsService {
    if (!FunCommandsService.instance) {
      FunCommandsService.instance = new FunCommandsService();
    }
    return FunCommandsService.instance;
  }

  /**
   * Initialize service data
   */
  async initialize(): Promise<void> {
    try {
      await Promise.all([this.loadKhodamData(), this.loadQuotesData()]);
    } catch (error: unknown) {
      logger.error('Error initializing fun commands service:', error);
    }
  }

  async loadKhodamData(): Promise<void> {
    try {
      const response = await axios.get(
        'https://raw.githubusercontent.com/nazedev/database/refs/heads/master/random/cekkhodam.json'
      );
      this.khodamData = response.data;
    } catch (error: unknown) {
      logger.warn('Failed to load khodam data, using fallbacks');
      this.khodamData = [
        { nama: 'Dokter Indosiar', deskripsi: 'Khodam yang selalu memberikan resep obat' },
        { nama: 'Sigit Rendang', deskripsi: 'Khodam yang ahli dalam kuliner' },
      ];
    }
  }

  async loadQuotesData(): Promise<void> {
    try {
      const baseUrl = 'https://raw.githubusercontent.com/nazedev/database/refs/heads/master/kata-kata';
      const [motivasi, bijak, bucin] = await Promise.all([
        axios.get(`${baseUrl}/motivasi.json`),
        axios.get(`${baseUrl}/bijak.json`),
        axios.get(`${baseUrl}/bucin.json`),
      ]);

      this.quotesData = {
        motivasi: motivasi.data,
        bijak: bijak.data,
        bucin: bucin.data,
      };
    } catch (error: unknown) {
      this.quotesData = {
        motivasi: ['Tetap semangat!'],
        bijak: ['Hidup adalah pilihan'],
        bucin: ['Aku sayang kamu'],
      };
    }
  }

  async cekSifat(name: string): Promise<Result<{ result: string }>> {
    try {
      const sifatBaik = ['Bijak', 'Sabar', 'Kreatif', 'Humoris'];
      const sifatBuruk = ['Sombong', 'Minder', 'Pendendam'];

      const randomSifatBaik = sifatBaik[Math.floor(Math.random() * sifatBaik.length)];
      const randomSifatBuruk = sifatBuruk[Math.floor(Math.random() * sifatBuruk.length)];

      const result = `╭──❍「 *Cek Sifat* 」❍\n│• Sifat ${name}\n│• Orang yang : *${randomSifatBaik}*\n│• Kekurangan : *${randomSifatBuruk}*\n╰──────❍`;
      return { success: true, data: { result } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  async cekKhodam(name: string): Promise<Result<{ result: string }>> {
    try {
      if (!this.khodamData) await this.loadKhodamData();
      const randomKhodam = this.khodamData![Math.floor(Math.random() * this.khodamData!.length)];
      return { 
        success: true, 
        data: { result: `Khodam dari *${name}* adalah *${randomKhodam.nama}*\n_${randomKhodam.deskripsi}_` } 
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  async getRandomQuote(category: keyof QuotesData): Promise<Result<{ result: string }>> {
    try {
      if (!this.quotesData) await this.loadQuotesData();
      const quotes = this.quotesData![category];
      if (!quotes) throw new Error('Category not found');
      
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return { success: true, data: { result: randomQuote } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  public checkRateLimit(userId: string, command: string): boolean {
    const key = `${userId}_${command}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now - limit.lastUsed > 30000) {
      this.rateLimits.set(key, { lastUsed: now, count: 1 });
      return true;
    }

    if (limit.count >= 5) return false;
    limit.count++;
    return true;
  }
}

export const funCommandsService = FunCommandsService.getInstance();
export default funCommandsService;