
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Trend {
  id: string;
  title: string;
  story: string;
  visualPrompt: string;
  imageUrl?: string;
  loading: boolean;
  error?: string;
}

export interface ResearchResult {
  trends: Trend[];
  sources: GroundingSource[];
}

export enum AppState {
  IDLE = 'IDLE',
  RESEARCHING = 'RESEARCHING',
  VISUALIZING = 'VISUALIZING',
  COMPLETED = 'COMPLETED'
}

// Added missing interface required by constants.tsx
export interface MarketingMedium {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}
