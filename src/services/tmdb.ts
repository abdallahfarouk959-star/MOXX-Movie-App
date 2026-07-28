const API_KEY = '8815f59693500b16b90df2a198c319c9';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
}

export const getImageUrl = (path: string) => 
  path ? `${IMAGE_BASE_URL}${path}` : 'https://picsum.photos/seed/movie/500/750';

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  url.searchParams.append('language', 'en-US');
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  console.log(`Fetching TMDB: ${url.toString()}`);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`TMDB API Error (${response.status}):`, errorData);
      return { results: [], genres: [] };
    }
    const data = await response.json();
    console.log(`TMDB Response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
    return { results: [], genres: [] };
  }
}

export const tmdb = {
  getTrending: (type: 'movie' | 'tv' | 'all' = 'all') => fetchTMDB(`/trending/${type}/week`),
  getPopular: (type: 'movie' | 'tv' = 'movie') => fetchTMDB(`/${type}/popular`),
  getTopRated: (type: 'movie' | 'tv' = 'movie') => fetchTMDB(`/${type}/top_rated`),
  getUpcoming: () => fetchTMDB('/movie/upcoming'),
  search: (query: string) => fetchTMDB('/search/multi', { query }),
  getDetails: (type: 'movie' | 'tv', id: number) => fetchTMDB(`/${type}/${id}`),
  getVideos: (type: 'movie' | 'tv', id: number) => fetchTMDB(`/${type}/${id}/videos`),
  getCredits: (type: 'movie' | 'tv', id: number) => fetchTMDB(`/${type}/${id}/credits`),
  getSimilar: (type: 'movie' | 'tv', id: number) => fetchTMDB(`/${type}/${id}/similar`),
  getGenres: (type: 'movie' | 'tv' = 'movie') => fetchTMDB(`/genre/${type}/list`),
  discover: (params: Record<string, string>, type: 'movie' | 'tv' = 'movie') => fetchTMDB(`/discover/${type}`, params),
  
  // دالة مخصصة إضافية لجلب المسلسلات فقط بالتصنيفات
  getTVShows: (category: 'popular' | 'top_rated' | 'on_the_air' | 'airing_today' = 'popular') => 
    fetchTMDB(`/tv/${category}`),
};