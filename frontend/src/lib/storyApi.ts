import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontStyle = 'normal' | 'italic' | 'bold' | 'bolditalic';
export type FontSize  = 'small' | 'medium' | 'large' | 'xlarge';

export interface StoryAuthor {
  id:     string;
  name:   string;
  handle?: string;
  avatar: string | null;
  isAdmin?: boolean;
}

export interface Story {
  id:          string;
  authorId:    string;
  textContent: string;
  bgColor:     string;
  textColor:   string;
  fontStyle:   FontStyle;
  fontSize:    FontSize;
  imageUrl:    string | null;
  expiresAt:   string;
  createdAt:   string;
  author:      StoryAuthor;
  viewed:      boolean;
  viewCount:   number;
}

export interface StoryGroup {
  author:  StoryAuthor;
  stories: Story[];
}

export interface CreateStoryPayload {
  textContent: string;
  bgColor?:    string;
  textColor?:  string;
  fontStyle?:  FontStyle;
  fontSize?:   FontSize;
  imageUrl?:   string; // admin only
}

// ─── API functions ────────────────────────────────────────────────────────────

export const storyApi = {
  getFeed: async (): Promise<StoryGroup[]> => {
    const { data } = await api.get<StoryGroup[]>('/stories/feed');
    return data;
  },
  getMyStories: async (): Promise<Story[]> => {
    const { data } = await api.get<Story[]>('/stories/me');
    return data;
  },
  create: async (payload: CreateStoryPayload): Promise<Story> => {
    const { data } = await api.post<Story>('/stories', payload);
    return data;
  },
  markViewed: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>(`/stories/${id}/view`);
    return data;
  },
  delete: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete<{ ok: boolean }>(`/stories/${id}`);
    return data;
  },
  adminGetAll: async (): Promise<Story[]> => {
    const { data } = await api.get<Story[]>('/stories/admin/all');
    return data;
  },
};

