import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AIInstantAnswer } from '../../services/webSearchService';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  relevance: number;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  aiAnswer: AIInstantAnswer | null;
  isLoading: boolean;
  isGeneratingAnswer: boolean;
  error: string | null;
  searchHistory: string[];
}

const initialState: SearchState = {
  query: '',
  results: [],
  aiAnswer: null,
  isLoading: false,
  isGeneratingAnswer: false,
  error: null,
  searchHistory: [],
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setResults: (state, action: PayloadAction<SearchResult[]>) => {
      state.results = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setAIAnswer: (state, action: PayloadAction<AIInstantAnswer | null>) => {
      state.aiAnswer = action.payload;
      state.isGeneratingAnswer = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setGeneratingAnswer: (state, action: PayloadAction<boolean>) => {
      state.isGeneratingAnswer = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    addToHistory: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim();
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory = [query, ...state.searchHistory.slice(0, 9)];
      }
    },
    clearResults: (state) => {
      state.results = [];
      state.aiAnswer = null;
      state.error = null;
    },
  },
});

export const { setQuery, setResults, setAIAnswer, setLoading, setGeneratingAnswer, setError, addToHistory, clearResults } = searchSlice.actions;
export default searchSlice.reducer;