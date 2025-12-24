import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFlightSearch } from '../useFlightSearch';
import { api } from '../../utils/api';
import type { FlightSearchParams } from '../../types/api.types';

// Mock the api module
vi.mock('../../utils/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    initialize: vi.fn(),
    refreshCSRFToken: vi.fn(),
    clearCSRFToken: vi.fn(),
  },
}));

// Mock the logger module
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('useFlightSearch', () => {
  const mockSearchParams: FlightSearchParams = {
    origin: 'SVO',
    destination: 'LED',
    departureDate: '2024-06-15',
    passengers: 1,
    cabinClass: 'economy',
  };

  const mockFlights = [
    {
      id: 'flight-1',
      airline: 'Aeroflot',
      flightNumber: 'SU1234',
      origin: 'SVO',
      destination: 'LED',
      departureTime: '2024-06-15T10:00:00',
      arrivalTime: '2024-06-15T11:30:00',
      duration: 90,
      price: 5000,
      currency: 'RUB',
      cabinClass: 'economy',
      availableSeats: 50,
    },
    {
      id: 'flight-2',
      airline: 'S7 Airlines',
      flightNumber: 'S75678',
      origin: 'SVO',
      destination: 'LED',
      departureTime: '2024-06-15T14:00:00',
      arrivalTime: '2024-06-15T15:30:00',
      duration: 90,
      price: 4500,
      currency: 'RUB',
      cabinClass: 'economy',
      availableSeats: 30,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFlightSearch());

    expect(result.current.flights).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.searchFlights).toBe('function');
    expect(typeof result.current.clearResults).toBe('function');
  });

  it('should set loading to true while searching', async () => {
    mockedApi.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: { flights: [] } }), 100)
        )
    );

    const { result } = renderHook(() => useFlightSearch());

    act(() => {
      result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fetch flights successfully', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { flights: mockFlights, total: 2 },
    });

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.flights).toEqual(mockFlights);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockedApi.post).toHaveBeenCalledWith('/flights/search', mockSearchParams);
  });

  it('should handle API error response', async () => {
    mockedApi.post.mockResolvedValue({
      success: false,
      message: 'Рейсы не найдены',
    });

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.flights).toEqual([]);
    expect(result.current.error).toBe('Рейсы не найдены');
    expect(result.current.loading).toBe(false);
  });

  it('should handle network error', async () => {
    mockedApi.post.mockRejectedValue({
      message: 'Network Error',
    });

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.flights).toEqual([]);
    expect(result.current.error).toBe('Network Error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle error without message', async () => {
    mockedApi.post.mockRejectedValue({});

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.error).toBe('Ошибка при поиске рейсов');
  });

  it('should clear results', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { flights: mockFlights, total: 2 },
    });

    const { result } = renderHook(() => useFlightSearch());

    // First, search for flights
    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.flights).toHaveLength(2);

    // Then clear results
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.flights).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should clear previous error when searching again', async () => {
    // First call fails
    mockedApi.post.mockRejectedValueOnce({ message: 'Error' });

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.error).toBe('Error');

    // Second call succeeds
    mockedApi.post.mockResolvedValueOnce({
      success: true,
      data: { flights: mockFlights, total: 2 },
    });

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.flights).toEqual(mockFlights);
  });

  it('should handle empty flights array', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { flights: [], total: 0 },
    });

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.searchFlights(mockSearchParams);
    });

    expect(result.current.flights).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
