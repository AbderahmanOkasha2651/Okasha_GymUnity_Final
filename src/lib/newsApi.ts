import { BASE_URL } from './api';

export interface NewsSource {
  id: number;
  name: string;
  rss_url: string;
  category?: string | null;
  tags: string[];
  enabled: boolean;
  created_at?: string;
  last_fetched_at?: string | null;
}

export interface NewsArticle {
  id: number;
  title: string;
  link: string;
  guid?: string | null;
  published_at?: string | null;
  author?: string | null;
  summary: string;
  content?: string | null;
  image_url?: string | null;
  tags: string[];
  source: NewsSource;
  saved: boolean;
}

export interface NewsFeedResponse {
  items: NewsArticle[];
  page: number;
  page_size: number;
  total: number;
}

export interface NewsPreferences {
  topics: string[];
  level: string;
  equipment: string;
  blocked_keywords: string[];
}

export interface NewsStatus {
  last_run?: string | null;
  sources_checked: number;
  sources_success: number;
  sources_failed: number;
  items_ingested: number;
  last_error?: string | null;
}

export interface FetchNowResponse {
  fetched_at: string;
  sources_checked: number;
  sources_success: number;
  sources_failed: number;
  items_ingested: number;
  last_error?: string | null;
}

export interface NewsSourcePayload {
  name: string;
  rss_url: string;
  category?: string | null;
  tags: string[];
  enabled: boolean;
}

export interface NewsChatResponse {
  reply: string;
  follow_up: string;
}

export interface NewsFilters {
  [key: string]: string | number | undefined;
  topic?: string;
  source?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

const getAuthHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }
  const token = localStorage.getItem('access_token');
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const handleUnauthorized = () => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const getNewsSources = () => request<NewsSource[]>('/news/sources');

export const getNewsFeed = (filters: NewsFilters = {}) =>
  request<NewsFeedResponse>(`/news/feed${buildQuery(filters)}`);

export const getExploreNews = (filters: NewsFilters = {}) =>
  request<NewsFeedResponse>(`/news/explore${buildQuery(filters)}`);

export const getSavedNews = (page = 1, pageSize = 12) =>
  request<NewsFeedResponse>(`/news/saved${buildQuery({ page, page_size: pageSize })}`);

export const getArticle = (id: number) => request<NewsArticle>(`/news/articles/${id}`);

export const getPreferences = () => request<NewsPreferences>('/news/preferences');

export const updatePreferences = (payload: NewsPreferences) =>
  request<NewsPreferences>('/news/preferences', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const saveArticle = (id: number) =>
  request<{ status: string }>(`/news/articles/${id}/save`, { method: 'POST' });

export const unsaveArticle = (id: number) =>
  request<{ status: string }>(`/news/articles/${id}/save`, { method: 'DELETE' });

export const hideArticle = (id: number) =>
  request<{ status: string }>(`/news/articles/${id}/hide`, { method: 'POST' });

export const chatAboutNews = (message: string) =>
  request<NewsChatResponse>('/news/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

export const adminGetSources = () => request<NewsSource[]>('/admin/news/sources');

export const adminCreateSource = (payload: NewsSourcePayload) =>
  request<NewsSource>('/admin/news/sources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const adminUpdateSource = (id: number, payload: Partial<NewsSourcePayload>) =>
  request<NewsSource>(`/admin/news/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const adminToggleSource = (id: number) =>
  request<NewsSource>(`/admin/news/sources/${id}/toggle`, { method: 'PATCH' });

export const adminDeleteSource = (id: number) =>
  request<void>(`/admin/news/sources/${id}`, { method: 'DELETE' });

export const adminGetStatus = () => request<NewsStatus>('/admin/news/status');

export const adminFetchNow = () => request<FetchNowResponse>('/admin/news/fetch-now', { method: 'POST' });
