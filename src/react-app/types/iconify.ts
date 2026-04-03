/**
 * Iconify API Types
 * Type definitions for Iconify API responses and data structures
 */

interface IconifyCollectionInfo {
  name: string;
  author?: {
    name: string;
    url?: string;
  };
  license?: {
    title: string;
    spdx?: string;
    url?: string;
  };
  url?: string;
  total: number;
  version?: string;
  category?: string;
  palette?: boolean;
  height?: number;
  width?: number;
  samples?: string[];
}

export interface IconifySearchResponse {
  icons: string[];
  total: number;
  limit: number;
  start: number;
  collections: Record<string, IconifyCollectionInfo>;
  request: Record<string, string>;
}

export interface IconifyCollectionResponse {
  prefix: string;
  total: number;
  title?: string;
  info?: IconifyCollectionInfo;
  icons: string[];
  aliases?: Record<string, unknown>;
  characters?: Record<string, string>;
  categories?: Record<string, string[]>;
  themes?: Record<string, string[]>;
  prefixes?: Record<string, string>;
  suffixes?: Record<string, string>;
}

export interface IconifyCollectionsResponse {
  [prefix: string]: IconifyCollectionInfo;
}

export interface IconifyIcon {
  name: string;
  prefix: string;
  title?: string;
  tags?: string[];
  category?: string;
}

export interface IconifySearchParams {
  query: string;
  limit?: number;
  start?: number;
  prefix?: string;
  prefixes?: string;
  category?: string;
}
