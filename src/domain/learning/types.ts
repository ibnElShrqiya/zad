export type AgeTrackId = 'track_3_5' | 'track_6_8' | 'track_9_12' | 'track_13_plus';

export interface AgeTrack {
  id: AgeTrackId;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  ageRange: string;
  iconName: string;
  accentColor: string;
  descriptionAr: string;
  descriptionEn: string;
}

export type LessonType = 'story' | 'alphabet' | 'manners' | 'worship' | 'quran' | 'quiz_challenge';

export interface QuizQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
}

export interface MatchingPair {
  id: string;
  leftAr: string;
  rightAr: string;
  leftEn?: string;
  rightEn?: string;
}

export interface Lesson {
  id: string;
  trackId: AgeTrackId;
  type: LessonType;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  keyTakeawaysAr: string[];
  ayahOrHadithProof?: {
    arabic: string;
    translation: string;
    reference: string;
  };
  audioPrompt?: string;
  quiz?: QuizQuestion[];
  matchingPairs?: MatchingPair[];
  points: number;
  durationMinutes: number;
}

export interface Badge {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  icon: string;
  unlockedAt?: string;
}

export interface ChildLearningProfile {
  childName: string;
  selectedTrack: AgeTrackId;
  completedLessonIds: string[];
  totalStars: number;
  earnedBadges: Badge[];
  quizScores: Record<string, number>; // lessonId -> percentage
  lastActiveDate: string;
}
