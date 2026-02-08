import type { Report } from '@/types';

// Filter history entry type
export interface FilterHistoryEntry {
  timestamp: number;
  filteredReports: Report[];
  monthIndex?: number;
  comparisonMode?: boolean;
  showAllMonths?: boolean;
}

// Filter history manager
export class FilterHistory {
  private history: FilterHistoryEntry[] = [];
  private currentIndex: number = -1;

  // Add a new filter state to history
  addState(filteredReports: Report[], monthIndex?: number, comparisonMode?: boolean, showAllMonths?: boolean): void {
    const entry: FilterHistoryEntry = {
      timestamp: Date.now(),
      filteredReports: [...filteredReports],
      monthIndex,
      comparisonMode,
      showAllMonths
    };

    // Remove any forward history when adding new state
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(entry);
    this.currentIndex++;
  }

  // Get the current filter state
  getCurrentState(): FilterHistoryEntry | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return this.history[this.currentIndex];
  }

  // Undo the last filter action
  undo(): FilterHistoryEntry | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Redo the last undone filter action
  redo(): FilterHistoryEntry | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Clear the filter history
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // Get the size of the history
  getSize(): number {
    return this.history.length;
  }
}

// Custom hook for filter history management
export const useFilterHistory = () => {
  const history = new FilterHistory();

  const addFilterState = (filteredReports: Report[], monthIndex?: number, comparisonMode?: boolean, showAllMonths?: boolean) => {
    history.addState(filteredReports, monthIndex, comparisonMode, showAllMonths);
  };

  const undoFilter = () => {
    const previousState = history.undo();
    return previousState?.filteredReports || [];
  };

  const redoFilter = () => {
    const nextState = history.redo();
    return nextState?.filteredReports || [];
  };

  const canUndo = () => history.canUndo();
  const canRedo = () => history.canRedo();

  return {
    addFilterState,
    undoFilter,
    redoFilter,
    canUndo,
    canRedo,
    getCurrentState: () => history.getCurrentState(),
    clearHistory: () => history.clear(),
    historySize: history.getSize()
  };
};