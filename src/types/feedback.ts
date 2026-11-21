export type FeedbackCategory =
  | 'accessibility'
  | 'audio_quality'
  | 'feature_request'
  | 'bug_report'
  | 'languages'
  | 'general';

export interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  rating: number; // 1 to 5 stars
  title: string;
  message: string;
  userName: string;
  userHandle?: string;
  userRole?: string;
  userEmail?: string;
  activePreset?: string;
  createdAt: number;
  helpfulCount: number;
}

export interface FeedbackInput {
  category: FeedbackCategory;
  rating: number;
  title: string;
  message: string;
  userName?: string;
  userEmail?: string;
  includeSystemInfo?: boolean;
  activePreset?: string;
}
