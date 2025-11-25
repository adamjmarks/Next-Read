export interface Book {
  id: string;
  title: string;
  author: string;
  rating: number; // 1 to 5
  review?: string;
  dateAdded: number;
}

export interface PredictionResult {
  matchPercentage: number;
  reasoning: string;
  likelyRating: number;
  genre: string;
  similarBooksFromHistory: string[];
}

export interface ImportResult {
  books: Book[];
  sources?: string[];
}

export enum AppView {
  LIBRARY = 'LIBRARY',
  PREDICT = 'PREDICT',
  ADD_BOOK = 'ADD_BOOK',
  IMPORT = 'IMPORT'
}