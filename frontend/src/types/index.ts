export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD';
export type PostType = 'TEXT' | 'POLL';
export type MediaType = 'IMAGE' | 'VIDEO';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';
export type FriendStatus = 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FRIENDS';

export interface User {
  id: string;
  email?: string;
  handle: string;
  name: string;
  avatar?: string;
  bio?: string;
  coverPhoto?: string;
  location?: string;
  institution?: string;
  isPublic?: boolean;
  friends: number;
  isAdmin: boolean;
  createdAt: string;
  _count?: { posts: number };
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  order: number;
}

export interface Poll {
  id: string;
  question: string;
  correctAnswer?: number | null;
  options: PollOption[];
  votes?: { pollOptionId: string }[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'handle'>;
}

export interface Post {
  id: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  explanation?: string;
  featured: boolean;
  pinned: boolean;
  type: PostType;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'handle' | 'avatar' | 'isAdmin'>;
  _count: { reactions: number; comments: number };
  reactions?: { type: ReactionType }[];
  poll?: Poll;
  savedBy?: { userId: string }[];
}

export interface FeedResponse {
  posts: Post[];
  page: number;
  limit: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Report {
  id: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  post: { id: string; text?: string };
  user: Pick<User, 'name' | 'handle'>;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  featuredPosts: number;
  openReports: number;
  recentPosts: Post[];
}

export interface FriendUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  friends: number;
}

export interface FriendRequest {
  id: string;
  createdAt: string;
  sender?: FriendUser;
  receiver?: FriendUser;
}

export interface Message {
  id: string;
  text: string;
  read: boolean;
  createdAt: string;
  sender: Pick<User, 'id' | 'name' | 'handle' | 'avatar'>;
}

export interface Conversation {
  partner: Pick<User, 'id' | 'name' | 'handle' | 'avatar'>;
  lastMessage: { text: string; createdAt: string; isOwn: boolean };
  unreadCount: number;
}

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'GROUP_INVITE'
  | 'GROUP_POST'
  | 'ADMIN_ANNOUNCEMENT'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  targetUrl?: string;
  read: boolean;
  createdAt: string;
  actor?: Pick<User, 'id' | 'name' | 'handle' | 'avatar'>;
}

export type GroupMemberRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface GroupMemberItem {
  id: string;
  role: GroupMemberRole;
  joinedAt: string;
  user: User;
}

export interface GroupItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  coverImage?: string;
  avatar?: string;
  isPrivate: boolean;
  createdAt: string;
  creator: Pick<User, 'id' | 'name' | 'handle' | 'avatar'>;
  membersCount: number;
  postsCount: number;
  isMember: boolean;
  myRole?: GroupMemberRole | null;
}

