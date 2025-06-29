import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryPage } from './HistoryPage';

// Mock child components
vi.mock('@components/HistoryList', () => ({
  HistoryList: () => <div data-testid="history-list">History List</div>
}));

vi.mock('@components/GenerateMoreButton', () => ({
  GenerateMoreButton: () => <button data-testid="generate-more">Generate More</button>
}));

vi.mock('@components/ClearHistoryButton', () => ({
  ClearHistoryButton: () => <button data-testid="clear-history">Clear History</button>
}));

vi.mock('@components/HistoryModal', () => ({
  HistoryModal: () => <div data-testid="history-modal">History Modal</div>
}));

describe('HistoryPage', () => {
  it('renders all child components correctly', () => {
    render(<HistoryPage />);
    
    expect(screen.getByTestId('history-list')).toBeInTheDocument();
    expect(screen.getByTestId('generate-more')).toBeInTheDocument();
    expect(screen.getByTestId('clear-history')).toBeInTheDocument();
    expect(screen.getByTestId('history-modal')).toBeInTheDocument();
  });

  it('renders action buttons container', () => {
  render(<HistoryPage />);
  const actionsContainer = screen.getByTestId('actions-container');
  expect(actionsContainer).toBeInTheDocument();
  expect(actionsContainer.children).toHaveLength(2);
});
});