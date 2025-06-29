import { useCsvAnalysis } from '@hooks/use-csv-analysis';
import { useAnalysisStore } from '@store/analysisStore';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HomePage } from './HomePage';

vi.mock('@store/analysisStore', () => ({
  useAnalysisStore: vi.fn()
}));

vi.mock('@hooks/use-csv-analysis', () => ({
  useCsvAnalysis: vi.fn()
}));

// Mock child components
vi.mock('@components/FileUploadSection', () => ({
  FileUploadSection: ({ onFileSelect, onSend, onClear }: { 
    onFileSelect: (file: File) => void; 
    onSend: () => void; 
    onClear: () => void; 
  }) => (
    <div>
      <button onClick={() => onFileSelect(new File(['content'], 'test.csv'))}>Select File</button>
      <button onClick={onSend}>Send</button>
      <button onClick={onClear}>Clear</button>
    </div>
  )
}));

vi.mock('@components/HighlightsSection', () => ({
  HighlightsSection: () => <div>Highlights Section</div>
}));

describe('HomePage', () => {
  const mockSetFile = vi.fn();
  const mockSetStatus = vi.fn();
  const mockSetHighlights = vi.fn();
  const mockSetError = vi.fn();
  const mockReset = vi.fn();
  
  // Simplified callback types
  let onDataCallback: (data: any) => void = () => {};
  let onCompleteCallback: (highlights?: any) => void = () => {};
  let onErrorCallback: (error: Error) => void = () => {};

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default store state
    vi.mocked(useAnalysisStore).mockImplementation(() => ({
      file: null,
      status: 'idle',
      highlights: null,
      error: null,
      setFile: mockSetFile,
      setStatus: mockSetStatus,
      setHighlights: mockSetHighlights,
      reset: mockReset,
      setError: mockSetError
    }));

    // Hook implementation that captures callbacks
    vi.mocked(useCsvAnalysis).mockImplementation((params) => {
      onDataCallback = params.onData;
      onCompleteCallback = params.onComplete;
      onErrorCallback = params.onError;
      
      return {
        analyzeCsv: vi.fn()
      };
    });
  });

  it('renders correctly in initial state', () => {
    render(<HomePage />);
    
    // Custom text matcher that ignores HTML tags
    const headingText = screen.getByRole('heading');
    
    expect(headingText).toBeInTheDocument();
    expect(screen.getByText('Highlights Section')).toBeInTheDocument();
    expect(screen.getByText('Select File')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('handles file selection', () => {
    render(<HomePage />);
    
    fireEvent.click(screen.getByText('Select File'));
    expect(mockSetFile).toHaveBeenCalledWith(expect.any(File));
    expect(mockSetFile.mock.calls[0][0].name).toBe('test.csv');
  });

  it('initiates analysis when file is selected and send is clicked', async () => {
    // Set state with a file
    vi.mocked(useAnalysisStore).mockImplementation(() => ({
      file: new File(['content'], 'test.csv'),
      status: 'idle',
      highlights: null,
      error: null,
      setFile: mockSetFile,
      setStatus: mockSetStatus,
      setHighlights: mockSetHighlights,
      reset: mockReset,
      setError: mockSetError
    }));

    render(<HomePage />);
    
    fireEvent.click(screen.getByText('Send'));
    
    expect(mockSetStatus).toHaveBeenCalledWith('processing');
  });

  it('does not initiate analysis when no file is selected', () => {
    render(<HomePage />);
    
    fireEvent.click(screen.getByText('Send'));
    
    expect(mockSetStatus).not.toHaveBeenCalled();
  });

  it('handles successful analysis completion', async () => {
    render(<HomePage />);
    
    // Simulate file selection and send
    fireEvent.click(screen.getByText('Select File'));
    fireEvent.click(screen.getByText('Send'));
    
    // Trigger hook callbacks
    onDataCallback([{ id: 1 }]);
    onCompleteCallback([{ id: 1 }]);
    
    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('completed');
      expect(mockSetHighlights).toHaveBeenCalledWith([{ id: 1 }]);
    });
  });

  it('handles analysis errors', async () => {
    render(<HomePage />);
    
    // Simulate file selection and send
    fireEvent.click(screen.getByText('Select File'));
    fireEvent.click(screen.getByText('Send'));
    
    // Trigger error callback
    onErrorCallback(new Error('Test error'));
    
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Test error');
    });
  });

  it('resets state when clear is clicked', () => {
    // Set state with values
    vi.mocked(useAnalysisStore).mockImplementation(() => ({
      file: new File(['content'], 'test.csv'),
      status: 'completed',
      highlights: [{ id: 1 }],
      error: null,
      setFile: mockSetFile,
      setStatus: mockSetStatus,
      setHighlights: mockSetHighlights,
      reset: mockReset,
      setError: mockSetError
    }));

    render(<HomePage />);
    
    fireEvent.click(screen.getByText('Clear'));
    expect(mockReset).toHaveBeenCalled();
  });
});