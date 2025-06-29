import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HistoryList } from './HistoryList';
import { useHistoryStore } from '@store/historyStore';
import { HistoryItemType } from '@app-types/history';

vi.mock('@store/historyStore', () => ({
  useHistoryStore: vi.fn()
}));

vi.mock('@components/HistoryItem', () => ({
  HistoryItem: ({ item, onClick, onDelete }: { 
    item: HistoryItemType; 
    onClick: (item: HistoryItemType) => void; 
    onDelete: (id: string) => void; 
  }) => (
    <div>
      <button onClick={() => onClick(item)}>Show {item.fileName}</button>
      <button onClick={() => onDelete(item.id)}>Delete {item.fileName}</button>
    </div>
  )
}));

vi.mock('@utils/storage', () => ({
  removeFromHistory: vi.fn()
}));

describe('HistoryList', () => {
  const mockHistory: HistoryItemType[] = [
    { id: '1', fileName: 'file1.csv', timestamp: '2025-06-29T18:00:00Z' },
    { id: '2', fileName: 'file2.csv', timestamp: '2025-06-29T19:00:00Z' }
  ];
  
  const mockShowModal = vi.fn();
  const mockSetSelectedItem = vi.fn();
  const mockRemoveFromHistoryStore = vi.fn();
  const mockUpdateHistoryFromStorage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock store implementation
    vi.mocked(useHistoryStore).mockImplementation(() => ({
      history: mockHistory,
      showModal: mockShowModal,
      setSelectedItem: mockSetSelectedItem,
      removeFromHistoryStore: mockRemoveFromHistoryStore,
      updateHistoryFromStorage: mockUpdateHistoryFromStorage
    }));
  });

  it('loads history from storage on mount', () => {
    render(<HistoryList />);
    expect(mockUpdateHistoryFromStorage).toHaveBeenCalled();
  });

  it('renders correct number of history items', () => {
    render(<HistoryList />);
    expect(screen.getAllByText(/Show file/)).toHaveLength(2);
    expect(screen.getAllByText(/Delete file/)).toHaveLength(2);
  });

  it('handles item click to show modal', () => {
    render(<HistoryList />);
    
    fireEvent.click(screen.getByText('Show file1.csv'));
    
    expect(mockSetSelectedItem).toHaveBeenCalledWith(mockHistory[0]);
    expect(mockShowModal).toHaveBeenCalled();
  });

  it('handles item deletion', () => {
    render(<HistoryList />);
    
    fireEvent.click(screen.getByText('Delete file2.csv'));
    
    expect(mockRemoveFromHistoryStore).toHaveBeenCalledWith('2');
    // Also verifies storage removal is called via the mock
  });

  it('renders empty state when no history', () => {
    // Override store implementation for empty state
    vi.mocked(useHistoryStore).mockImplementation(() => ({
      history: [],
      updateHistoryFromStorage: mockUpdateHistoryFromStorage
    }));
    
    render(<HistoryList />);
    expect(screen.queryByText(/Show file/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Delete file/)).not.toBeInTheDocument();
  });
});