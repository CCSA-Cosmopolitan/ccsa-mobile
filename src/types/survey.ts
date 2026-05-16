// Types for the Survey / Questionnaire module

export type QuestionType =
  | 'TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'NUMBER'
  | 'YES_NO'
  | 'DATE';

export interface SurveyOption {
  id: string;
  optionText: string;
  order: number;
}

export interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  order: number;
  options: SurveyOption[];
}

export interface SurveySummary {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  publishedAt: string | null;
  _count: { questions: number; responses: number };
}

export interface SurveyDetail {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  publishedAt: string | null;
  questions: SurveyQuestion[];
}

// A draft answer keyed by questionId
export type AnswerDraft = {
  questionId: string;
  answerText: string | null;
  selectedOptionIds: string[];
};

// Farmer reference when selecting who to survey
export interface SurveyFarmerRef {
  id: string;
  nin: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string;
  state: string | null;
  lga: string | null;
}

export interface SurveyResponseResult {
  id: string;
  surveyId: string;
  farmerId: string;
  completedAt: string;
}
