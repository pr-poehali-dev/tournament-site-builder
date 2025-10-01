import { UIState } from '@/types';

export const saveUIStateToLocalStorage = (uiState: UIState) => {
  try {
    localStorage.setItem('tournamentUIState', JSON.stringify(uiState));
  } catch {
    // Silent fail - localStorage not available
  }
};

export const loadUIStateFromLocalStorage = (): UIState | null => {
  try {
    const savedState = localStorage.getItem('tournamentUIState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch {
    // Silent fail - localStorage not available or invalid data
  }
  return null;
};

export const clearOldLocalStorage = () => {
  try {
    localStorage.removeItem('tournamentAppState');
  } catch {
    // Silent fail - localStorage not available
  }
};