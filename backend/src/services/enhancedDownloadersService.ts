/**
 * Enhanced Downloaders Service - Advanced media downloading features
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import yts from 'yt-search';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

interface PixivArtwork {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
}

interface PinterestPin {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
}

interface MediaFireFile {
  url: string;
  fileName: string;
  fileSize: string;
}

export class EnhancedDownloadersService {
  private static instance: EnhancedDownloadersService;
  private sessionCookies: Map<string, any>;

  private constructor() {
    this.sessionCookies = new Map();
  }

  public static getInstance(): EnhancedDownloadersService {
    if (!EnhancedDownloadersService.instance) {
      EnhancedDownloadersService.instance = new EnhancedDownloadersService();
    }
    return EnhancedDownloadersService.instance;
  }

  /**
   * Pixiv Search
   */
  async pixivDownloader(query: string): Promise<Result<PixivArtwork[]>> {
    try {
      const response = await axios.get(
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.pixiv.net/ajax/search/artworks/${encodeURIComponent(query)}?mode=all`)}`
      );
      const data = JSON.parse(response.data.contents);
      const artworks = data.body.illustManga.data.slice(0, 5).map((a: any) => ({
        id: a.id,
        title: a.title,
        artist: a.userName,
        imageUrl: a.url
      }));
      return { success: true, data: artworks };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Pinterest Search
   */
  async pinterestDownloader(query: string): Promise<Result<PinterestPin[]>> {
    try {
      const response = await axios.get(
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`)}`
      );
      const $ = cheerio.load(response.data.contents);
      const pins: PinterestPin[] = [];
      
      // Basic extraction
      $('img').each((i: number, el: any) => {
        const url = $(el).attr('src');
        if (url?.includes('736x')) {
          pins.push({
            id: `pin_${i}`,
            title: $(el).attr('alt') || 'Pinterest Image',
            imageUrl: url,
            link: '#'
          });
        }
      });

      return { success: true, data: pins.slice(0, 10) };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * YouTube Search
   */
  async enhancedYouTubeSearch(query: string): Promise<Result<YouTubeVideo[]>> {
    try {
      const r = await yts(query);
      const videos = r.videos.slice(0, 10).map((v: any) => ({
        id: v.videoId,
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnail,
        duration: v.duration.timestamp
      }));
      return { success: true, data: videos };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * MediaFire
   */
  async enhancedMediaFireDownloader(url: string): Promise<Result<MediaFireFile>> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const downloadLink = $('a[aria-label="Download file"]').attr('href') || '';
      
      if (!downloadLink) throw new Error('Download link not found');

      return {
        success: true,
        data: {
          url: downloadLink,
          fileName: $('div.filename').text().trim() || 'File',
          fileSize: $('div.filesize').text().trim() || 'Unknown'
        }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

export const enhancedDownloadersService = EnhancedDownloadersService.getInstance();
export default enhancedDownloadersService;