import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Candidates from './Candidates';

// Mock fetch
global.fetch = vi.fn();

describe('Candidates Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders candidates board', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [] }),
    });

    render(
      <BrowserRouter>
        <Candidates />
      </BrowserRouter>
    );

    expect(screen.getByText(/Candidates/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [] }),
    });

    render(
      <BrowserRouter>
        <Candidates />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading candidates/i)).toBeInTheDocument();
  });

  it('shows stage filter dropdown', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [] }),
    });

    render(
      <BrowserRouter>
        <Candidates />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('displays all stage columns', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [] }),
    });

    render(
      <BrowserRouter>
        <Candidates />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Applied/i)).toBeInTheDocument();
      expect(screen.getByText(/Screen/i)).toBeInTheDocument();
      expect(screen.getByText(/Tech/i)).toBeInTheDocument();
      expect(screen.getByText(/Offer/i)).toBeInTheDocument();
    });
  });
});
