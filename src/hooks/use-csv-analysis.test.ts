import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';

import { useCsvAnalysis } from './use-csv-analysis';

// Mock API responses
const mockSuccessResponse = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('{"highlights": [{"id":1}]}'));
    controller.close();
  }
});

// Mock utils
vi.mock('@utils/analysis', () => ({
  transformAnalysisData: vi.fn().mockReturnValue({ 
    highlights: [{ id: 1 }],
    highlightsToStore: [{ id: 1, stored: true }]
  }),
  InvalidServerResponseError: class MockError extends Error {}
}));

describe('useCsvAnalysis hook', () => {
  const mockCsvFile = new File(['content'], 'test.csv', { type: 'text/csv' });
  const onDataMock = vi.fn();
  const onErrorMock = vi.fn();
  const onCompleteMock = vi.fn();
  let fetchSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('should handle successful CSV analysis', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      body: mockSuccessResponse
    });

    const { result } = renderHook(() => 
      useCsvAnalysis({ onData: onDataMock, onError: onErrorMock, onComplete: onCompleteMock })
    );

    await result.current.analyzeCsv(mockCsvFile);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/aggregate?rows=10000'), expect.any(Object));
      expect(onDataMock).toHaveBeenCalledWith([{ id: 1, stored: true }]);
      expect(onCompleteMock).toHaveBeenCalledWith([{ id: 1 }]);
      expect(onErrorMock).not.toHaveBeenCalled();
    });
  });

  it('should handle server errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => 
      useCsvAnalysis({ onData: onDataMock, onError: onErrorMock, onComplete: onCompleteMock })
    );

    await result.current.analyzeCsv(mockCsvFile);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
      expect(onDataMock).not.toHaveBeenCalled();
      expect(onCompleteMock).not.toHaveBeenCalled();
    });
  });

  it('should handle network errors', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => 
      useCsvAnalysis({ onData: onDataMock, onError: onErrorMock, onComplete: onCompleteMock })
    );

    await result.current.analyzeCsv(mockCsvFile);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
      expect(onDataMock).not.toHaveBeenCalled();
      expect(onCompleteMock).not.toHaveBeenCalled();
    });
  });

  it('should handle empty response body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      body: null
    });

    const { result } = renderHook(() => 
      useCsvAnalysis({ onData: onDataMock, onError: onErrorMock, onComplete: onCompleteMock })
    );

    await result.current.analyzeCsv(mockCsvFile);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
      expect(onDataMock).not.toHaveBeenCalled();
      expect(onCompleteMock).not.toHaveBeenCalled();
    });
  });
});