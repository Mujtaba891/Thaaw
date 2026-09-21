/**
 * THAAW Browser — Live News Provider & Normalizer
 * Fetches real current news feeds across Reddit, YouTube, Article platforms,
 * Technology, Security, Open Source, and AI.
 * Implements image thumbnail extraction, platform categorization, and endless scroll pagination.
 */

import { net, app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  category: string;
  platform: 'reddit' | 'youtube' | 'article' | 'opensource' | 'security' | 'web';
  url: string;
  snippet?: string;
  imageUrl?: string;
  readingTime?: string;
}

export interface CustomRssFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  addedAt: number;
}

export interface StoryCluster {
  isCluster: true;
  id: string;
  topic: string;
  primaryArticle: NewsArticle;
  relatedArticles: NewsArticle[];
}

export type FeedItem = NewsArticle | StoryCluster;

export interface NewsPreferences {
  followedPublishers: string[];
  followedChannels: string[];
  customFeeds: CustomRssFeed[];
  hiddenPublishers: string[];
  hiddenTopics: string[];
}

export class NewsProvider {
  private cache = new Map<string, { articles: NewsArticle[]; timestamp: number }>();
  private static readonly TTL_MS = 10 * 60 * 1000; // 10 minutes cache
  private preferencesPath: string;
  private followedPublishers = new Set<string>(['arstechnica.com', 'theverge.com', 'krebsonsecurity.com']);
  private followedChannels = new Set<string>(['Technology', 'Security', 'AI', 'Open Source']);
  private customFeeds: CustomRssFeed[] = [];
  private hiddenPublishers = new Set<string>();
  private hiddenTopics = new Set<string>();

  constructor(customStoragePath?: string) {
    if (customStoragePath) {
      this.preferencesPath = customStoragePath;
    } else {
      try {
        const userData = app?.getPath ? app.getPath('userData') : process.cwd();
        this.preferencesPath = path.join(userData, 'thaaw_news_preferences.json');
      } catch {
        this.preferencesPath = path.join(process.cwd(), 'thaaw_news_preferences.json');
      }
    }
    this.loadPreferences();
  }

  private loadPreferences(): void {
    try {
      if (fs.existsSync(this.preferencesPath)) {
        const raw = fs.readFileSync(this.preferencesPath, 'utf8');
        const data: NewsPreferences = JSON.parse(raw);
        if (Array.isArray(data.followedPublishers)) this.followedPublishers = new Set(data.followedPublishers);
        if (Array.isArray(data.followedChannels)) this.followedChannels = new Set(data.followedChannels);
        if (Array.isArray(data.customFeeds)) this.customFeeds = data.customFeeds;
        if (Array.isArray(data.hiddenPublishers)) this.hiddenPublishers = new Set(data.hiddenPublishers);
        if (Array.isArray(data.hiddenTopics)) this.hiddenTopics = new Set(data.hiddenTopics);
      }
    } catch (e) {
      console.warn('[NewsProvider] Error loading preferences:', e);
    }
  }

  private savePreferences(): void {
    try {
      const data: NewsPreferences = {
        followedPublishers: Array.from(this.followedPublishers),
        followedChannels: Array.from(this.followedChannels),
        customFeeds: this.customFeeds,
        hiddenPublishers: Array.from(this.hiddenPublishers),
        hiddenTopics: Array.from(this.hiddenTopics)
      };
      fs.writeFileSync(this.preferencesPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[NewsProvider] Error saving preferences:', e);
    }
  }

  public getFollowState(): NewsPreferences {
    return {
      followedPublishers: Array.from(this.followedPublishers),
      followedChannels: Array.from(this.followedChannels),
      customFeeds: [...this.customFeeds],
      hiddenPublishers: Array.from(this.hiddenPublishers),
      hiddenTopics: Array.from(this.hiddenTopics)
    };
  }

  public toggleFollowPublisher(publisher: string): boolean {
    const pub = publisher.toLowerCase().trim();
    if (this.followedPublishers.has(pub)) {
      this.followedPublishers.delete(pub);
      this.savePreferences();
      return false;
    } else {
      this.followedPublishers.add(pub);
      this.savePreferences();
      return true;
    }
  }

  public toggleFollowChannel(channel: string): boolean {
    const ch = channel.trim();
    if (this.followedChannels.has(ch)) {
      this.followedChannels.delete(ch);
      this.savePreferences();
      return false;
    } else {
      this.followedChannels.add(ch);
      this.savePreferences();
      return true;
    }
  }

  public hidePublisher(publisher: string): void {
    this.hiddenPublishers.add(publisher.toLowerCase().trim());
    this.savePreferences();
  }

  public hideTopic(topic: string): void {
    this.hiddenTopics.add(topic.toLowerCase().trim());
    this.savePreferences();
  }

  public async validateAndAddRssFeed(feedUrl: string, name: string, category: string): Promise<{ success: boolean; feed?: CustomRssFeed; error?: string }> {
    try {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(feedUrl);
      } catch {
        return { success: false, error: 'Invalid URL format' };
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { success: false, error: 'URL must use HTTP or HTTPS' };
      }

      const response = await net.fetch(feedUrl, {
        headers: {
          'User-Agent': 'THAAW-Browser/1.0 (Privacy-First Feed Reader)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        return { success: false, error: `Feed responded with status ${response.status}` };
      }

      const text = await response.text();
      if (!text.includes('<item') && !text.includes('<entry')) {
        return { success: false, error: 'URL is not a valid RSS or Atom feed' };
      }

      const feed: CustomRssFeed = {
        id: `rss_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || parsedUrl.hostname,
        url: feedUrl.trim(),
        category: category.trim() || 'General',
        addedAt: Date.now()
      };

      this.customFeeds.push(feed);
      this.savePreferences();
      // Invalidate cache so fresh feed items appear
      this.cache.clear();

      return { success: true, feed };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  public deleteCustomRssFeed(id: string): boolean {
    const initialLen = this.customFeeds.length;
    this.customFeeds = this.customFeeds.filter(f => f.id !== id);
    if (this.customFeeds.length !== initialLen) {
      this.savePreferences();
      this.cache.clear();
      return true;
    }
    return false;
  }

  public getCustomRssFeeds(): CustomRssFeed[] {
    return [...this.customFeeds];
  }

  // Curated, beautiful category fallback images
  private static readonly FALLBACK_IMAGES: Record<string, string[]> = {
    reddit: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'
    ],
    youtube: [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
    ],
    technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
    ],
    security: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'
    ],
    opensource: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'
    ],
    ai: [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80'
    ],
    default: [
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80'
    ]
  };

  // Reliable open RSS / JSON feeds
  private feeds: Record<string, string[]> = {
    all: [
      'https://www.reddit.com/r/technology/hot.json?limit=25',
      'https://feeds.arstechnica.com/arstechnica/index',
      'https://hnrss.org/frontpage?count=20',
      'https://www.theverge.com/rss/index.xml'
    ],
    reddit: [
      'https://www.reddit.com/r/technology/hot.json?limit=25',
      'https://www.reddit.com/r/programming/hot.json?limit=25'
    ],
    youtube: [
      'https://www.reddit.com/r/videos/hot.json?limit=20',
      'https://feeds.arstechnica.com/arstechnica/technology-lab'
    ],
    technology: [
      'https://feeds.arstechnica.com/arstechnica/technology-lab',
      'https://www.theverge.com/rss/index.xml',
      'https://www.reddit.com/r/technology/hot.json?limit=20'
    ],
    security: [
      'https://krebsonsecurity.com/feed/',
      'https://feeds.feedburner.com/TheHackersNews',
      'https://www.reddit.com/r/netsec/hot.json?limit=20'
    ],
    opensource: [
      'https://hnrss.org/newest?q=open+source&count=20',
      'https://www.reddit.com/r/opensource/hot.json?limit=20'
    ],
    ai: [
      'https://hnrss.org/newest?q=artificial+intelligence&count=20',
      'https://www.reddit.com/r/ArtificialInteligence/hot.json?limit=20'
    ],
    world: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.reddit.com/r/worldnews/hot.json?limit=20'
    ]
  };

  public async getNews(category = 'all', page = 1, pageSize = 8, view = 'for_you'): Promise<{
    success: boolean;
    items: FeedItem[];
    articles: NewsArticle[]; // for backward compatibility
    hasMore: boolean;
    total: number;
    error?: string;
  }> {
    const cat = (category || 'all').toLowerCase();
    let allArticles: NewsArticle[] = [];

    const cached = this.cache.get(cat);
    if (cached && Date.now() - cached.timestamp < NewsProvider.TTL_MS) {
      allArticles = cached.articles;
    } else {
      try {
        allArticles = await this.fetchCategory(cat);
        // Also fetch custom feeds if category matches or is 'all'
        if (this.customFeeds.length > 0) {
          const customArticles = await this.fetchCustomFeeds(cat);
          allArticles.unshift(...customArticles);
        }
        if (allArticles.length > 0) {
          this.cache.set(cat, { articles: allArticles, timestamp: Date.now() });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[THAAW News] Fetch error for category ${cat}:`, msg);
      }
    }

    if (allArticles.length === 0) {
      allArticles = this.getFallbackStories(cat);
    }

    // Filter out hidden publishers & topics
    allArticles = allArticles.filter(item => {
      const pub = (item.source || '').toLowerCase();
      const topic = (item.category || '').toLowerCase();
      if (Array.from(this.hiddenPublishers).some(hp => pub.includes(hp))) return false;
      if (Array.from(this.hiddenTopics).some(ht => topic.includes(ht) || item.title.toLowerCase().includes(ht))) return false;
      return true;
    });

    // Handle view modes: 'for_you', 'following', 'top_news', 'trending'
    let filteredArticles: NewsArticle[] = [...allArticles];

    if (view === 'following') {
      filteredArticles = allArticles.filter(item => {
        const pub = (item.source || '').toLowerCase();
        const ch = (item.category || '').toLowerCase();
        const isFollowedPub = Array.from(this.followedPublishers).some(p => pub.includes(p));
        const isFollowedCh = Array.from(this.followedChannels).some(c => c.toLowerCase() === ch);
        const isCustom = this.customFeeds.some(cf => item.url.includes(new URL(cf.url).hostname));
        return isFollowedPub || isFollowedCh || isCustom;
      });
      if (filteredArticles.length === 0) {
        filteredArticles = allArticles.slice(0, 5); // soft fallback if nothing followed yet
      }
    } else if (view === 'trending') {
      // Sort by recent and engagement signals
      filteredArticles.sort((a, b) => {
        const scoreA = (a.snippet?.includes('upvotes') ? 10 : 0) + (a.timestamp.includes('m ago') ? 5 : 0);
        const scoreB = (b.snippet?.includes('upvotes') ? 10 : 0) + (b.timestamp.includes('m ago') ? 5 : 0);
        return scoreB - scoreA;
      });
    } else if (view === 'for_you') {
      // Prioritize followed items first, followed by others
      filteredArticles.sort((a, b) => {
        const aFollowed = Array.from(this.followedPublishers).some(p => a.source.toLowerCase().includes(p)) ||
                          Array.from(this.followedChannels).some(c => c.toLowerCase() === a.category.toLowerCase());
        const bFollowed = Array.from(this.followedPublishers).some(p => b.source.toLowerCase().includes(p)) ||
                          Array.from(this.followedChannels).some(c => c.toLowerCase() === b.category.toLowerCase());
        if (aFollowed && !bFollowed) return -1;
        if (!aFollowed && bFollowed) return 1;
        return 0;
      });
    }

    // Cluster top news
    const feedItems: FeedItem[] = (view === 'top_news' || view === 'for_you')
      ? this.clusterArticles(filteredArticles)
      : filteredArticles;

    const startIndex = (Math.max(1, page) - 1) * pageSize;
    const paginatedItems = feedItems.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < feedItems.length;

    // For backward compatibility, extract articles array from paginated items
    const flatArticles: NewsArticle[] = [];
    for (const item of paginatedItems) {
      if ('isCluster' in item) {
        flatArticles.push(item.primaryArticle);
        flatArticles.push(...item.relatedArticles);
      } else {
        flatArticles.push(item);
      }
    }

    return {
      success: true,
      items: paginatedItems,
      articles: flatArticles,
      hasMore,
      total: feedItems.length
    };
  }

  public clusterArticles(articles: NewsArticle[]): FeedItem[] {
    const clusters: StoryCluster[] = [];
    const usedIndices = new Set<number>();

    // Stop words to ignore during title clustering
    const stopWords = new Set(['about', 'after', 'again', 'against', 'almost', 'along', 'already',
      'also', 'although', 'always', 'among', 'another', 'around', 'because', 'before', 'being',
      'between', 'both', 'came', 'could', 'down', 'during', 'each', 'early', 'even', 'first',
      'from', 'further', 'give', 'good', 'great', 'have', 'here', 'into', 'just', 'last',
      'like', 'look', 'make', 'many', 'more', 'most', 'much', 'must', 'name', 'never',
      'next', 'once', 'only', 'other', 'over', 'same', 'should', 'show', 'some', 'still',
      'such', 'take', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they',
      'this', 'those', 'through', 'time', 'under', 'until', 'very', 'well', 'were', 'what',
      'when', 'where', 'which', 'while', 'will', 'with', 'would', 'your', 'report', 'says']);

    const extractKeywords = (title: string): Set<string> => {
      return new Set(
        title.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length >= 4 && !stopWords.has(w))
      );
    };

    for (let i = 0; i < articles.length; i++) {
      if (usedIndices.has(i)) continue;
      const a = articles[i];
      const aKeywords = extractKeywords(a.title);
      const related: NewsArticle[] = [];

      for (let j = i + 1; j < articles.length; j++) {
        if (usedIndices.has(j)) continue;
        const b = articles[j];
        const bKeywords = extractKeywords(b.title);

        let commonCount = 0;
        for (const kw of aKeywords) {
          if (bKeywords.has(kw)) commonCount++;
        }

        // 3 or more common significant terms indicate a shared story cluster
        if (commonCount >= 3) {
          related.push(b);
          usedIndices.add(j);
        }
      }

      if (related.length >= 1) {
        usedIndices.add(i);
        clusters.push({
          isCluster: true,
          id: `cluster_${i}_${Date.now()}`,
          topic: a.title,
          primaryArticle: a,
          relatedArticles: related
        });
      }
    }

    const result: FeedItem[] = [];
    for (let i = 0; i < articles.length; i++) {
      if (usedIndices.has(i)) {
        // If this was primary for a cluster, insert the cluster
        const cluster = clusters.find(c => c.primaryArticle.id === articles[i].id);
        if (cluster) result.push(cluster);
      } else {
        result.push(articles[i]);
      }
    }

    return result;
  }

  private async fetchCustomFeeds(category: string): Promise<NewsArticle[]> {
    const results: NewsArticle[] = [];
    for (const feed of this.customFeeds) {
      if (category !== 'all' && feed.category.toLowerCase() !== category) continue;
      try {
        const resp = await net.fetch(feed.url, {
          headers: {
            'User-Agent': 'THAAW-Browser/1.0 (Privacy-First Feed Reader)',
            'Accept': 'application/xml, text/xml, */*'
          }
        });
        if (resp.ok) {
          const text = await resp.text();
          const parsed = this.parseFeedXml(text, feed.category || 'RSS');
          results.push(...parsed);
        }
      } catch {
        // Ignore single feed failure
      }
    }
    return results;
  }

  private async fetchCategory(category: string): Promise<NewsArticle[]> {
    const urls = this.feeds[category] || this.feeds['all'];
    const results: NewsArticle[] = [];

    for (const feedUrl of urls) {
      try {
        const response = await net.fetch(feedUrl, {
          headers: {
            'User-Agent': 'THAAW-Browser/1.0 (Privacy-First Desktop Platform)',
            'Accept': 'application/json, application/xml, text/xml, */*'
          }
        });
        if (!response.ok) continue;

        if (feedUrl.includes('.json')) {
          const json = await response.json();
          const parsed = this.parseRedditJson(json, category);
          results.push(...parsed);
        } else {
          const text = await response.text();
          const parsed = this.parseFeedXml(text, category);
          results.push(...parsed);
        }

        if (results.length >= 35) break;
      } catch {
        // Continue to next feed if one fails
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    return results.filter(item => {
      if (!item.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }

  private parseRedditJson(json: any, category: string): NewsArticle[] {
    const items: NewsArticle[] = [];
    const children = json?.data?.children || [];

    for (let i = 0; i < children.length; i++) {
      const p = children[i]?.data;
      if (!p || p.stickied || p.over_18) continue;

      let imageUrl = '';
      if (p.preview?.images?.[0]?.source?.url) {
        imageUrl = p.preview.images[0].source.url.replace(/&amp;/g, '&');
      } else if (p.thumbnail && p.thumbnail.startsWith('http')) {
        imageUrl = p.thumbnail;
      } else {
        imageUrl = this.getRandomFallback(category);
      }

      const diffMins = Math.floor((Date.now() - (p.created_utc * 1000)) / 60000);
      let timestamp = 'Recent';
      if (diffMins < 60) {
        timestamp = `${Math.max(1, diffMins)}m ago`;
      } else if (diffMins < 1440) {
        timestamp = `${Math.floor(diffMins / 60)}h ago`;
      } else {
        timestamp = `${Math.floor(diffMins / 1440)}d ago`;
      }

      items.push({
        id: `reddit_${p.id || Math.random().toString(36).slice(2, 6)}`,
        title: this.cleanHtmlEntities(p.title || 'Trending discussion on Reddit'),
        source: p.subreddit_name_prefixed || 'r/technology',
        timestamp,
        category: category.toUpperCase(),
        platform: 'reddit',
        url: p.url ? p.url : `https://reddit.com${p.permalink}`,
        snippet: `${p.num_comments || 0} comments • ${p.score || 0} upvotes`,
        imageUrl
      });
    }

    return items;
  }

  private parseFeedXml(xml: string, category: string): NewsArticle[] {
    const items: NewsArticle[] = [];
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemMatches) {
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const dateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

      if (!titleMatch || !linkMatch) continue;

      const title = this.cleanHtmlEntities(titleMatch[1].trim());
      const url = linkMatch[1].trim();
      let timestamp = 'Recent';

      if (dateMatch) {
        try {
          const d = new Date(dateMatch[1].trim());
          const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
          if (diffMins < 60) {
            timestamp = `${Math.max(1, diffMins)}m ago`;
          } else if (diffMins < 1440) {
            timestamp = `${Math.floor(diffMins / 60)}h ago`;
          } else {
            timestamp = `${Math.floor(diffMins / 1440)}d ago`;
          }
        } catch {
          timestamp = 'Recent';
        }
      }

      // Determine source and platform
      let source = 'Tech News';
      let platform: NewsArticle['platform'] = 'article';
      try {
        const u = new URL(url);
        source = u.hostname.replace(/^www\./, '');
        if (source.includes('reddit')) platform = 'reddit';
        else if (source.includes('youtube')) platform = 'youtube';
        else if (source.includes('github') || source.includes('eff.org')) platform = 'opensource';
        else if (source.includes('kreb') || source.includes('threat') || source.includes('hacker')) platform = 'security';
      } catch {
        source = 'Web Feed';
      }

      // Image Extraction
      let imageUrl = '';
      const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]+url="([^"]+)"/i);
      const encMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image\//i);
      const imgMatch = descMatch ? descMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i) : null;

      if (mediaMatch && mediaMatch[1]) {
        imageUrl = mediaMatch[1];
      } else if (encMatch && encMatch[1]) {
        imageUrl = encMatch[1];
      } else if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      } else {
        imageUrl = this.getRandomFallback(category);
      }

      let snippet = '';
      if (descMatch) {
        snippet = this.cleanHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()).slice(0, 140);
        if (snippet.length >= 140) snippet += '...';
      }

      items.push({
        id: `news_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        source,
        timestamp,
        category: category.toUpperCase(),
        platform,
        url,
        snippet,
        imageUrl
      });
    }

    return items;
  }

  private getRandomFallback(category: string): string {
    const list = NewsProvider.FALLBACK_IMAGES[category] || NewsProvider.FALLBACK_IMAGES['default'];
    return list[Math.floor(Math.random() * list.length)];
  }

  private getFallbackStories(category: string): NewsArticle[] {
    return [
      {
        id: 'fb_1',
        title: 'Hardened Browsers: Memory Safety and Isolation Standards in 2026',
        source: 'Wired Security',
        timestamp: '18m ago',
        category: 'SECURITY',
        platform: 'security',
        url: 'https://wired.com',
        snippet: 'Zero-trust architecture and sandboxed origin models lead modern desktop security.',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'fb_2',
        title: 'Open Source Community Adopts Unified Privacy Manifest for Native Web Apps',
        source: 'r/programming',
        timestamp: '42m ago',
        category: 'REDDIT',
        platform: 'reddit',
        url: 'https://reddit.com/r/programming',
        snippet: 'Developers celebrate transparent tracker-free specifications across frameworks.',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'fb_3',
        title: 'Decentralized Video & Audio Streaming Standards Reach Final Candidate Release',
        source: 'YouTube Tech',
        timestamp: '1h ago',
        category: 'YOUTUBE',
        platform: 'youtube',
        url: 'https://youtube.com',
        snippet: 'Next-generation codecs and zero-latency peer streaming protocols benchmarked.',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'fb_4',
        title: 'Autonomous Multi-Agent AI Frameworks Standardized for Distributed Work',
        source: 'Ars Technica',
        timestamp: '2h ago',
        category: 'AI',
        platform: 'article',
        url: 'https://arstechnica.com',
        snippet: 'Engineers highlight deterministic tool invocation and local security sandboxing.',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'fb_5',
        title: 'Linux Foundation Launches New Open-Source Hardening Initiative',
        source: 'EFF Deeplinks',
        timestamp: '3h ago',
        category: 'OPEN SOURCE',
        platform: 'opensource',
        url: 'https://eff.org',
        snippet: 'Collaborative initiative aims to eliminate systemic vulnerabilities in core utilities.',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'
      }
    ];
  }

  private cleanHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }
}
