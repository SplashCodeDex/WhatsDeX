/**
 * Enhanced Downloaders Service - Advanced media downloading features
 * Implements pixiv, pinterest, and other platform downloads with proper error handling
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');

class EnhancedDownloadersService {
    constructor() {
        this.rateLimits = new Map();
        this.sessionCookies = new Map();
    }

    /**
     * Pixiv downloader implementation
     * @param {string} query - Search query
     */
    async pixivDownloader(query) {
        try {
            if (!query) {
                throw new Error('Please provide search query');
            }

            // Use pixiv API through a proxy service
            const response = await axios.get(
                `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.pixiv.net/ajax/search/artworks/${encodeURIComponent(query)}?word=${encodeURIComponent(query)}&order=date_d&mode=all&p=1&s_mode=s_tag&type=all&lang=en`)}`
            );

            const data = JSON.parse(response.data.contents);
            const artworks = data.body.illustManga.data;

            if (!artworks || artworks.length === 0) {
                throw new Error('No artworks found');
            }

            const results = [];

            // Get up to 5 artworks
            for (let i = 0; i < Math.min(5, artworks.length); i++) {
                const artwork = artworks[i];

                try {
                    // Get artwork details
                    const detailResponse = await axios.get(
                        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.pixiv.net/ajax/illust/${artwork.id}`)}`
                    );

                    const detailData = JSON.parse(detailResponse.data.contents);
                    const artworkData = detailData.body;

                    results.push({
                        id: artwork.id,
                        title: artworkData.title || 'Untitled',
                        artist: artworkData.userName || 'Unknown Artist',
                        description: artworkData.description || '',
                        imageUrl: artworkData.urls?.original || artwork.url,
                        tags: artworkData.tags?.tags?.map(tag => tag.tag) || [],
                        viewCount: artworkData.viewCount || 0,
                        bookmarkCount: artworkData.bookmarkCount || 0
                    });

                } catch (error) {
                    console.error(`Error getting artwork ${artwork.id} details:`, error);
                    continue;
                }
            }

            if (results.length === 0) {
                throw new Error('Failed to retrieve artwork details');
            }

            return {
                success: true,
                query,
                results,
                message: `Found ${results.length} artworks for "${query}"`
            };

        } catch (error) {
            console.error('Error in pixiv downloader:', error);

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error('Failed to search Pixiv');
        }
    }

    /**
     * Pinterest downloader implementation
     * @param {string} query - Search query
     */
    async pinterestDownloader(query) {
        try {
            if (!query) {
                throw new Error('Please provide search query');
            }

            // Use Pinterest search API
            const response = await axios.get(
                `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed`)}`
            );

            const $ = cheerio.load(response.data.contents);
            const pins = [];

            // Extract pin data from HTML
            $('script[data-test-id="pin-script"]').each((index, element) => {
                try {
                    const scriptContent = $(element).html();
                    if (scriptContent) {
                        // Extract JSON data from script
                        const jsonMatch = scriptContent.match(/\{.*\}/);
                        if (jsonMatch) {
                            const pinData = JSON.parse(jsonMatch[0]);
                            pins.push({
                                id: pinData.id || `pin_${index}`,
                                title: pinData.title || 'Untitled',
                                description: pinData.description || '',
                                imageUrl: pinData.image_url || pinData.images?.orig?.url,
                                link: pinData.link || `https://pinterest.com/pin/${pinData.id}`,
                                uploader: pinData.uploader || 'Unknown'
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error parsing Pinterest script:', error);
                }
            });

            // Alternative: Use Pinterest API proxy
            if (pins.length === 0) {
                try {
                    const apiResponse = await axios.get(
                        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=/search/pins/?q=${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22article%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22price%22%3A%22---%22%2C%22customizedProductType%22%3A%22---%22%7D%2C%22context%22%3A%7B%7D%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22bookmarks%22%3A%5B%5D%7D`)}`
                    );

                    const apiData = JSON.parse(apiResponse.data.contents);
                    const resources = apiData.resource_response?.data?.results || [];

                    resources.forEach((resource, index) => {
                        if (resource.images?.orig) {
                            pins.push({
                                id: resource.id || `pin_${index}`,
                                title: resource.title || 'Untitled',
                                description: resource.description || '',
                                imageUrl: resource.images.orig.url,
                                link: `https://pinterest.com/pin/${resource.id}`,
                                uploader: resource.pinner?.full_name || 'Unknown'
                            });
                        }
                    });

                } catch (error) {
                    console.error('Error with Pinterest API:', error);
                }
            }

            if (pins.length === 0) {
                throw new Error('No pins found');
            }

            // Return up to 10 results
            const limitedResults = pins.slice(0, 10);

            return {
                success: true,
                query,
                results: limitedResults,
                message: `Found ${limitedResults.length} pins for "${query}"`
            };

        } catch (error) {
            console.error('Error in pinterest downloader:', error);

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error('Failed to search Pinterest');
        }
    }

    /**
     * Enhanced YouTube search with better metadata
     * @param {string} query - Search query
     */
    async enhancedYouTubeSearch(query) {
        try {
            if (!query) {
                throw new Error('Please provide search query');
            }

            const yts = require('yt-search');

            const searchResults = await yts.search({
                query,
                count: 10,
                category: 'music'
            });

            const enhancedResults = searchResults.videos.map(video => ({
                id: video.videoId,
                title: video.title,
                url: video.url,
                thumbnail: video.thumbnail,
                duration: video.duration?.timestamp || 'Unknown',
                views: video.views?.toLocaleString() || '0',
                uploaded: video.ago || 'Unknown',
                author: {
                    name: video.author?.name || 'Unknown',
                    channelId: video.author?.channelId || '',
                    verified: video.author?.verified || false
                },
                description: video.description?.substring(0, 200) + '...' || 'No description'
            }));

            return {
                success: true,
                query,
                results: enhancedResults,
                message: `Found ${enhancedResults.length} videos for "${query}"`
            };

        } catch (error) {
            console.error('Error in enhanced YouTube search:', error);
            throw new Error('Failed to search YouTube');
        }
    }

    /**
     * MediaFire downloader with enhanced features
     * @param {string} url - MediaFire URL
     */
    async enhancedMediaFireDownloader(url) {
        try {
            if (!url || !url.includes('mediafire.com')) {
                throw new Error('Please provide valid MediaFire URL');
            }

            // Get the download page
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 30000
            });

            const $ = cheerio.load(response.data);

            // Extract download link
            let downloadLink = '';

            // Look for download button
            $('a[aria-label="Download file"]').each((index, element) => {
                const href = $(element).attr('href');
                if (href && href.includes('mediafire.com')) {
                    downloadLink = href;
                }
            });

            // Alternative: Look for script data
            if (!downloadLink) {
                $('script').each((index, element) => {
                    const scriptContent = $(element).html();
                    if (scriptContent && scriptContent.includes('downloadUrl')) {
                        const match = scriptContent.match(/"downloadUrl":"([^"]+)"/);
                        if (match) {
                            downloadLink = match[1].replace(/\\/g, '');
                        }
                    }
                });
            }

            if (!downloadLink) {
                throw new Error('Download link not found');
            }

            // Get file info
            const fileName = $('div.dl-info div.filename').text().trim() ||
                           $('h1').text().trim() ||
                           'Unknown File';

            const fileSize = $('div.dl-info div.filesize').text().trim() ||
                           'Unknown Size';

            const uploadDate = $('div.dl-info div.uploaded').text().trim() ||
                             'Unknown Date';

            return {
                success: true,
                url: downloadLink,
                fileName,
                fileSize,
                uploadDate,
                originalUrl: url,
                message: `File: ${fileName}\nSize: ${fileSize}\nUpload: ${uploadDate}`
            };

        } catch (error) {
            console.error('Error in MediaFire downloader:', error);

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error('Failed to download from MediaFire');
        }
    }

    /**
     * Check rate limit for download operations
     * @param {string} userId - User ID
     * @param {string} platform - Platform name
     */
    checkRateLimit(userId, platform) {
        const key = `${userId}_${platform}`;
        const now = Date.now();
        const limit = this.rateLimits.get(key);

        const limits = {
            'pixiv': { cooldown: 30000, maxPerCooldown: 2 }, // 30 seconds, 2 searches
            'pinterest': { cooldown: 15000, maxPerCooldown: 3 }, // 15 seconds, 3 searches
            'youtube': { cooldown: 10000, maxPerCooldown: 5 }, // 10 seconds, 5 searches
            'mediafire': { cooldown: 20000, maxPerCooldown: 2 } // 20 seconds, 2 downloads
        };

        const config = limits[platform] || { cooldown: 30000, maxPerCooldown: 1 };

        if (!limit || now - limit.lastUsed > config.cooldown) {
            this.rateLimits.set(key, { lastUsed: now, count: 1 });
            return true;
        }

        if (limit.count >= config.maxPerCooldown) {
            return false;
        }

        limit.count++;
        return true;
    }

    /**
     * Clean up old session data
     */
    cleanupOldSessions() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [key, data] of this.sessionCookies.entries()) {
            if (now - data.timestamp > maxAge) {
                this.sessionCookies.delete(key);
            }
        }
    }
}

module.exports = new EnhancedDownloadersService();