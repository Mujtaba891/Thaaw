/**
 * THAAW Browser — Universal Favicon Resolver
 * Zero Emojis. Pure SVG / Vector & Browser-Safe Favicon Resolution.
 * Tier 1: Locally bundled high-res brand vector SVGs
 * Tier 2: DuckDuckGo / Google S2 favicon API for arbitrary domains
 * Tier 3: Clean initials badge fallback (e.g. EX for example.com)
 */

(function (window) {
  'use strict';

  const BUNDLED_MAP = {
    'github.com': 'assets/favicons/github.svg',
    'youtube.com': 'assets/favicons/youtube.svg',
    'youtu.be': 'assets/favicons/youtube.svg',
    'gmail.com': 'assets/favicons/gmail.svg',
    'mail.google.com': 'assets/favicons/gmail.svg',
    'chatgpt.com': 'assets/favicons/chatgpt.svg',
    'chat.openai.com': 'assets/favicons/chatgpt.svg',
    'openai.com': 'assets/favicons/chatgpt.svg',
    'duckduckgo.com': 'assets/favicons/duckduckgo.svg',
    'wikipedia.org': 'assets/favicons/wikipedia.svg',
    'en.wikipedia.org': 'assets/favicons/wikipedia.svg',
    'google.com': 'assets/favicons/google.svg',
    'reddit.com': 'assets/favicons/reddit.svg',
    'twitter.com': 'assets/favicons/x.svg',
    'x.com': 'assets/favicons/x.svg',
    'linkedin.com': 'assets/favicons/linkedin.svg'
  };

  function extractDomain(url) {
    if (!url) return '';
    try {
      let clean = url.trim();
      if (!clean.includes('://')) clean = 'https://' + clean;
      const parsed = new URL(clean);
      return parsed.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    }
  }

  function getDomainInitials(domain, title) {
    if (title && title.length > 0) {
      const words = title.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return title.slice(0, 2).toUpperCase();
    }
    const parts = (domain || 'th').split('.');
    const main = parts[0] || 'th';
    return main.slice(0, 2).toUpperCase();
  }

  function createFallbackBadgeSvg(initials, size = 28) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="var(--thaaw-bg-card, #0A1020)" stroke="var(--thaaw-border, rgba(255,255,255,0.12))" stroke-width="1.5"/>
      <text x="16" y="20.5" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="700" fill="var(--thaaw-cyan, #38BDF8)" text-anchor="middle">${initials}</text>
    </svg>`;
  }

  const FaviconResolver = {
    extractDomain,

    getFaviconUrl(url) {
      const domain = extractDomain(url);
      if (!domain) return '';

      // Check bundled
      if (BUNDLED_MAP[domain]) {
        return BUNDLED_MAP[domain];
      }

      // Check subdomains
      for (const [key, iconPath] of Object.entries(BUNDLED_MAP)) {
        if (domain.endsWith('.' + key)) {
          return iconPath;
        }
      }

      // Dynamic online resolution via DuckDuckGo ip3 service
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    },

    renderFaviconElement(url, title = '', size = 28) {
      const domain = extractDomain(url);
      const iconUrl = this.getFaviconUrl(url);
      const initials = getDomainInitials(domain, title);

      const wrapper = document.createElement('div');
      wrapper.className = 'thaaw-favicon-wrap';
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.width = `${size}px`;
      wrapper.style.height = `${size}px`;
      wrapper.style.flexShrink = '0';

      if (!iconUrl) {
        wrapper.innerHTML = createFallbackBadgeSvg(initials, size);
        return wrapper;
      }

      const img = document.createElement('img');
      img.src = iconUrl;
      img.alt = title || domain;
      img.width = size;
      img.height = size;
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.borderRadius = '6px';
      img.style.objectFit = 'contain';

      img.onerror = () => {
        wrapper.innerHTML = createFallbackBadgeSvg(initials, size);
      };

      wrapper.appendChild(img);
      return wrapper;
    },

    createFallbackSvg: createFallbackBadgeSvg
  };

  window.FaviconResolver = FaviconResolver;
})(typeof window !== 'undefined' ? window : this);
