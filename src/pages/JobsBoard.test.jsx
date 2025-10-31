import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobsBoard from './JobsBoard';

global.fetch = vi.fn();

describe('JobsBoard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders jobs board header', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
    });

    render(
      <BrowserRouter>
        <JobsBoard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Jobs Board/i)).toBeInTheDocument();
  });

  it('displays new job button', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
    });

    render(
      <BrowserRouter>
        <JobsBoard />
      </BrowserRouter>
    );

    expect(screen.getByText(/\+ New Job/i)).toBeInTheDocument();
  });

  it('shows search and filter inputs', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
    });

    render(
      <BrowserRouter>
        <JobsBoard />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Search title/i)).toBeInTheDocument();
  });

  it('displays tags filter', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
    });

    render(
      <BrowserRouter>
        <JobsBoard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Filter by tags:/i)).toBeInTheDocument();
    });
  });
});
