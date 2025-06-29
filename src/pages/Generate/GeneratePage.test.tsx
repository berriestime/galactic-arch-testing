import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GeneratePage } from './GeneratePage';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('GeneratePage', () => {
  // Mock URL and DOM methods
  const mockCreateObjectURL = vi.fn();
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL methods
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly in initial state', () => {
    render(<GeneratePage />);
    
    expect(screen.getByText(/Сгенерируйте готовый csv-файл/i)).toBeInTheDocument();
    expect(screen.getByText('Начать генерацию')).toBeInTheDocument();
  });

  it('initiates generation when button is clicked', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'filename="report.csv"' },
      blob: () => Promise.resolve(new Blob())
    });

    render(<GeneratePage />);
    
    fireEvent.click(screen.getByText('Начать генерацию'));
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('handles successful report generation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'filename="report.csv"' },
      blob: () => Promise.resolve(new Blob())
    });

    render(<GeneratePage />);
    fireEvent.click(screen.getByText('Начать генерацию'));
    
    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledTimes(1));
    
    expect(screen.queryByText('Отчёт успешно сгенерирован!')).toBeInTheDocument();
  });

  it('handles generation errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Test error' })
    });

    render(<GeneratePage />);
    fireEvent.click(screen.getByText('Начать генерацию'));
    
    await waitFor(() => {
      expect(screen.getByText('Произошла ошибка: Test error')).toBeInTheDocument();
    });
  });

  it('handles unknown errors', async () => {
    mockFetch.mockRejectedValueOnce('Network error');

    render(<GeneratePage />);
    fireEvent.click(screen.getByText('Начать генерацию'));
    
    await waitFor(() => {
      expect(screen.getByText('Неизвестная ошибка при попытке сгенерировать отчёт')).toBeInTheDocument();
    });
  });
});