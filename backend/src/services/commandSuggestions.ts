import prisma from '../lib/prisma';
import { levenshteinDistance } from '../utils/levenshtein';

export default class CommandSuggestionsService {
  async getUserCommandHistory(userId, limit = 20) {
    if (!userId) return [];
    try {
      const rows = await prisma.commandUsage.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
        take: limit,
        select: { command: true, category: true, usedAt: true }
      });
      return rows.map(r => ({ command: r.command, category: r.category, usedAt: r.usedAt }));
    } catch (e) {
      return [];
    }
  }

  async suggestCommands(input, recentCommands = [], options = {}) {
    const text = (input || '').toLowerCase().trim();
    if (!text) return [];

    // Fetch popular commands from DB to build a catalog
    let popular = [];
    try {
      const rows = await prisma.commandUsage.groupBy({
        by: ['command', 'category'],
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 50,
      });
      popular = rows.map(r => ({ command: r.command, category: r.category, count: r._count._all }));
    } catch (_) {}

    // Build candidate set from popular + recent
    const recentSet = new Map();
    for (const rc of recentCommands || []) {
      recentSet.set(rc.command, (recentSet.get(rc.command) || 0) + 1);
    }

    const candidates = new Map();
    for (const p of popular) candidates.set(p.command, { command: p.command, category: p.category, baseScore: (p.count || 0) });
    for (const [cmd, freq] of recentSet.entries()) {
      const existing = candidates.get(cmd) || { command: cmd, category: 'general', baseScore: 0 };
      existing.baseScore += 5 * freq; // boost recency
      candidates.set(cmd, existing);
    }

    // Heuristic keyword mapping for common intents
    const keywordMap = [
      { keywords: ['youtube', 'yt', 'video'], command: 'youtubevideo', category: 'downloader', description: 'Download a YouTube video' },
      { keywords: ['youtube', 'yt', 'audio', 'mp3', 'song', 'music'], command: 'youtubeaudio', category: 'downloader', description: 'Download YouTube audio as MP3' },
      { keywords: ['download', 'link', 'save'], command: 'play', category: 'downloader', description: 'Find or download media from a link' },
      { keywords: ['image', 'generate', 'ai', 'art', 'picture'], command: 'text2image', category: 'ai-image', description: 'Generate an image from text' },
      { keywords: ['translate', 'language', 'terjemah'], command: 'translate', category: 'tool', description: 'Translate text' },
      { keywords: ['sticker', 'stiker'], command: 'sticker', category: 'sticker', description: 'Create a sticker from media' },
      { keywords: ['ocr', 'text', 'image'], command: 'ocr', category: 'tool', description: 'Extract text from an image' },
      { keywords: ['tts', 'speak', 'voice'], command: 'tts', category: 'tools', description: 'Convert text to speech' },
      { keywords: ['menu', 'help', 'commands'], command: 'menu', category: 'main', description: 'Show available commands' },
      { keywords: ['gemini', 'chat', 'ask', 'ai'], command: 'gemini', category: 'ai-chat', description: 'Chat with the AI' },
    ];

    for (const m of keywordMap) {
      const match = m.keywords.some(k => text.includes(k));
      if (match && !candidates.has(m.command)) {
        candidates.set(m.command, { command: m.command, category: m.category, baseScore: 3, description: m.description });
      }
    }

    // Score candidates using fuzzy match against command name
    const scored = [];
    for (const c of candidates.values()) {
      const distance = levenshteinDistance(text.split(' ')[0] || '', c.command);
      const fuzzyScore = distance === 0 ? 10 : Math.max(0, 5 - distance);
      const keywordBonus = keywordMap.find(k => k.command === c.command && k.keywords.some(kw => text.includes(kw))) ? 2 : 0;
      const score = c.baseScore + fuzzyScore + keywordBonus;
      const description = c.description || this.describe(c.command, c.category);
      scored.push({ command: c.command, category: c.category || 'general', score, description });
    }

    scored.sort((a, b) => b.score - a.score);

    // Normalize to expected output: include confidence 0..1
    const maxScore = scored[0]?.score || 1;
    return scored.slice(0, options.limit || 5).map(s => ({
      command: s.command,
      category: s.category,
      description: s.description,
      confidence: Math.max(0.1, Math.min(1, s.score / (maxScore || 1)))
    }));
  }

  describe(command, category) {
    const dictionary = {
      youtubevideo: 'Download a YouTube video',
      youtubeaudio: 'Download audio from YouTube',
      text2image: 'Generate an image from your prompt',
      translate: 'Translate text into another language',
      sticker: 'Create a sticker from an image or video',
      ocr: 'Extract text from an image',
      tts: 'Convert text to speech',
      menu: 'Show available commands',
      gemini: 'Chat with the AI assistant'
    };
    return dictionary[command] || `Run ${command} (${category || 'general'})`;
  }
}
