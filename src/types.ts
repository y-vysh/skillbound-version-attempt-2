export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'admin';
  bio: string;
  location: string;
  major: string;
  year: string;
  experience_level: string;
  availability: string;
  avatar_url: string;
  points: number;
  total_sessions: number;
  rating_avg: number;
  rating_count: number;
  is_active: number;
  is_reported: number;
  report_reason: string;
  created_at: string;
}

export interface UserLevelInfo {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number;
  progressPercent: number;
}

export interface Skill {
  id: number;
  user_id: number;
  name: string;
  category: string;
  direction: 'teach' | 'learn';
  proficiency: string;
  description: string;
  peers_taught: number;
  created_at: string;
}

export interface PeerMatch {
  peer: User;
  teachSkills: Skill[];
  learnSkills: Skill[];
  matchPercentage: number;
  isMutualMatch: boolean;
  theyTeachYouCanLearn: string[];
  youTeachTheyWant: string[];
  compatibilityExplanation: string;
}

export interface LearningRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  teach_skill_name: string;
  learn_skill_name: string;
  proposed_slot: string;
  proposed_location: string;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';
  created_at: string;
  peer_name: string;
  peer_major: string;
  peer_year: string;
  peer_location: string;
  peer_avatar: string;
  peer_rating: number;
}

export interface LearningSession {
  id: number;
  request_id: number | null;
  teacher_id: number;
  learner_id: number;
  title: string;
  teach_skill_name: string;
  learn_skill_name: string;
  date_str: string;
  time_str: string;
  location: string;
  description: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  teacher_name: string;
  teacher_major: string;
  teacher_year: string;
  teacher_avatar: string;
  learner_name: string;
  learner_major: string;
  learner_year: string;
  learner_avatar: string;
  has_reviewed: number;
  created_at: string;
}

export interface AcceptedConnection {
  request_id: number;
  peer_id: number;
  peer_name: string;
  peer_major: string;
  teach_skill_name: string;
  learn_skill_name: string;
  proposed_slot: string;
  proposed_location: string;
}

export interface Conversation {
  id: number;
  participant1_id: number;
  participant2_id: number;
  last_message_at: string;
  peer_id: number;
  peer_name: string;
  peer_major: string;
  peer_year: string;
  peer_avatar: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: number;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

export interface ReviewItem {
  id: number;
  session_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  tags_json: string;
  comment: string;
  created_at: string;
  reviewer_name: string;
  reviewer_major: string;
  reviewer_avatar: string;
  session_title?: string;
}

export interface PointsTransaction {
  id: number;
  user_id: number;
  action_type: string;
  reference_id: string;
  points: number;
  description: string;
  created_at: string;
}

export interface BadgeItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: number;
  created_at: string;
}

export interface DashboardPayload {
  user: User;
  profileCompletion: number;
  levelInfo: UserLevelInfo;
  teachSkills: Skill[];
  learnSkills: Skill[];
  pendingReceivedCount: number;
  pendingSentCount: number;
  upcomingSessions: LearningSession[];
  recommendedMatches: PeerMatch[];
  recentActivities: PointsTransaction[];
  unreadMessagesCount: number;
  notifications: NotificationItem[];
}

export const SKILL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Graphic Design',
  'Photography',
  'Communication',
  'Marketing',
  'Business',
  'Music',
  'Languages',
  'Personal Development',
];
