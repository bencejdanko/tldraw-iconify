/**
 * Iconify API Service
 * Service for interacting with the Iconify API to search and fetch icons
 */

import type {
  IconifySearchResponse,
  IconifyCollectionsResponse,
  IconifyCollectionResponse,
  IconifySearchParams,
  IconifyIcon,
} from '../types/iconify';

class IconifyService {
  private readonly apiBase = 'https://api.iconify.design';
  private readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(endpoint: string, params?: Record<string, string>): string {
    const paramString = params ? new URLSearchParams(params).toString() : '';
    return `${endpoint}${paramString ? '?' + paramString : ''}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  private async fetchWithCache<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data as T;
    }

    const url = new URL(endpoint, this.apiBase);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Iconify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Iconify API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for icons
   */
  async searchIcons(params: IconifySearchParams): Promise<IconifySearchResponse> {
    const searchParams: Record<string, string> = {
      query: params.query,
    };

    if (params.limit) searchParams.limit = params.limit.toString();
    if (params.start) searchParams.start = params.start.toString();
    if (params.prefix) searchParams.prefix = params.prefix;
    if (params.prefixes) searchParams.prefixes = params.prefixes;
    if (params.category) searchParams.category = params.category;

    return this.fetchWithCache<IconifySearchResponse>('/search', searchParams);
  }

  /**
   * Get all available icon collections
   */
  async getCollections(): Promise<IconifyCollectionsResponse> {
    return this.fetchWithCache<IconifyCollectionsResponse>('/collections');
  }

  /**
   * Get icons from a specific collection
   */
  async getCollection(prefix: string): Promise<IconifyCollectionResponse> {
    return this.fetchWithCache<IconifyCollectionResponse>('/collection', { prefix });
  }

  /**
   * Get SVG for an icon
   */
  getIconSvgUrl(prefix: string, name: string, options?: {
    color?: string;
    width?: number;
    height?: number;
    flip?: string;
    rotate?: number;
  }): string {
    const url = new URL(`/${prefix}/${name}.svg`, this.apiBase);
    
    if (options) {
      if (options.color) url.searchParams.set('color', options.color);
      if (options.width) url.searchParams.set('width', options.width.toString());
      if (options.height) url.searchParams.set('height', options.height.toString());
      if (options.flip) url.searchParams.set('flip', options.flip);
      if (options.rotate) url.searchParams.set('rotate', options.rotate.toString());
    }

    return url.toString();
  }

  /**
   * Get icon name for use with iconify span approach
   */
  getIconName(prefix: string, name: string): string {
    return `${prefix}:${name}`;
  }

  /**
   * Parse full icon name into prefix and name
   */
  parseIconName(fullName: string): { prefix: string; name: string } | null {
    const parts = fullName.split(':');
    if (parts.length !== 2) return null;
    return { prefix: parts[0], name: parts[1] };
  }

  /**
   * Convert search response to simpler icon format
   */
  convertSearchResults(response: IconifySearchResponse): IconifyIcon[] {
    return response.icons.map(fullName => {
      const parsed = this.parseIconName(fullName);
      if (!parsed) return null;

      const collection = response.collections[parsed.prefix];
      return {
        name: parsed.name,
        prefix: parsed.prefix,
        title: collection?.name || parsed.prefix,
        category: collection?.category,
      };
    }).filter(Boolean) as IconifyIcon[];
  }

  /**
   * Get popular icon collections (curated list)
   */
  getPopularCollections(): Array<{ prefix: string; name: string; description: string }> {
    return [
      { prefix: 'lucide', name: 'Lucide', description: 'Beautiful & consistent icons' },
      { prefix: 'mdi', name: 'Material Design Icons', description: 'Material Design system icons' },
      { prefix: 'fa6-solid', name: 'Font Awesome 6 Solid', description: 'Popular web icons' },
      { prefix: 'heroicons', name: 'Heroicons', description: 'Beautiful hand-crafted SVG icons' },
      { prefix: 'tabler', name: 'Tabler Icons', description: 'Free SVG icons' },
      { prefix: 'carbon', name: 'Carbon', description: 'IBM Design system icons' },
      { prefix: 'ri', name: 'Remix Icon', description: 'Neutral-style system symbols' },
      { prefix: 'ph', name: 'Phosphor', description: 'Flexible icon family' },
      { prefix: 'solar', name: 'Solar Icons', description: 'Linear and outline icons' },
      { prefix: 'mingcute', name: 'Mingcute', description: 'Carefully designed icon library' },
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const iconifyService = new IconifyService();
