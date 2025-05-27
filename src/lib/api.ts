import { Episode, Character, ApiResponse } from '@/types/api';

import config from './config';

// API configuration with environment variables
const API_CONFIG = {
    baseUrl: config.api.baseUrl,
    timeout: config.api.timeout,
    cacheRevalidate: config.api.cacheRevalidate,
};

const fetchWithConfig = async (url: string, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            next: { revalidate: API_CONFIG.cacheRevalidate },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
};
  
// Fetch all episodes
export const fetchEpisodes = async (): Promise<Episode[]> => {
    let allEpisodes: Episode[] = [];
    let nextUrl: string | null = `${API_CONFIG.baseUrl}/episode`;
    let pageCount = 0;
    const MAX_PAGES = 100; // Safety limit to prevent infinite loops

    while (nextUrl && pageCount < MAX_PAGES) {
        try {
            const response = await fetchWithConfig(nextUrl);
            const data: ApiResponse<Episode> = await response.json();
      
            // Validate the response structure
            if (!data.results || !Array.isArray(data.results)) {
                throw new Error('Invalid API response structure');
            }
      
            allEpisodes = [...allEpisodes, ...data.results];
            nextUrl = data.info?.next || null; // Safe access with fallback
            pageCount++;
      
        } catch (error) {
            console.error(`Error fetching page ${pageCount + 1}:`, error);
            // Decide whether to break or continue
            break; // Stop on error
        }
    }

    if (pageCount >= MAX_PAGES) {
        console.warn('Reached maximum page limit, some episodes might be missing');
    }

    return allEpisodes;
};
  
// Fetch characters with pagination
export const fetchCharacters = async (page: number = 1): Promise<Character[]> => {
    const url = `${API_CONFIG.baseUrl}/character?page=${page}`;
    const response = await fetchWithConfig(url);
    const data: ApiResponse<Character> = await response.json();
    return data.results;
};
  
// Fetch characters for a specific episode
export const fetchEpisodeCharacters = async (characterUrls: string[]): Promise<Character[]> => {
    const characterIds = characterUrls.map(url => {
        const matches = url.match(/\/(\d+)$/);
        return matches ? parseInt(matches[1]) : 0;
    }).filter(id => id > 0);
  
    if (characterIds.length === 0) return [];
  
    const idsString = characterIds.join(',');
    const url = `${API_CONFIG.baseUrl}/character/${idsString}`;
    const response = await fetchWithConfig(url);
    const data = await response.json();
    
    return Array.isArray(data) ? data : [data];
};
  
// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
    try {
      const response = await fetchWithConfig(API_CONFIG.baseUrl);
      return response.ok;
    } catch {
      return false;
    }
};
  
// Export API configuration for debugging
export const getApiConfig = () => API_CONFIG;