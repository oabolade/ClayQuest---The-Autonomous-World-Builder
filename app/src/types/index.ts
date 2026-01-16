export type AppScreen = "welcome" | "capture" | "loading" | "book";

export type LoadingStep =
  | "analyzing"
  | "creating-story"
  | "generating-images"
  | "adding-voice"
  | "finalizing";

export interface StoryPage {
  id: number;
  text: string;
  imageUrl: string;
  audioUrl: string;
}

export interface Story {
  id: string;
  title: string;
  pages: StoryPage[];
  createdAt: Date;
}

export interface GenerationProgress {
  step: LoadingStep;
  message: string;
  progress: number;
}

export interface AppState {
  currentScreen: AppScreen;
  capturedImage: string | null;
  story: Story | null;
  isGenerating: boolean;
  error: string | null;
  generationProgress: GenerationProgress | null;
}

export const LOADING_MESSAGES: Record<LoadingStep, string> = {
  "analyzing": "Looking at your amazing creation...",
  "creating-story": "Imagining a magical story...",
  "generating-images": "Drawing beautiful pictures...",
  "adding-voice": "Adding a storyteller voice...",
  "finalizing": "Almost ready for the adventure!",
};
