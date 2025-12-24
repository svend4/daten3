import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHotelSearch } from '../useHotelSearch';
import { api } from '../../utils/api';
import type { HotelSearchParams } from '../../types/api.types';

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

describe('useHotelSearch', () => {
  const mockSearchParams: HotelSearchParams = {
    location: 'Москва',
    checkIn: '2024-06-15',
    checkOut: '2024-06-18',
    guests: 2,
    rooms: 1,
  };

  const mockHotels = [
    {
      id: 'hotel-1',
      name: 'Гранд Отель Москва',
      location: 'Москва, центр',
      rating: 4.8,
      stars: 5,
      pricePerNight: 15000,
      currency: 'RUB',
      imageUrl: 'https://example.com/hotel1.jpg',
      amenities: ['WiFi', 'Бассейн', 'Спа'],
      availableRooms: 5,
    },
    {
      id: 'hotel-2',
      name: 'Бизнес Отель Центр',
      location: 'Москва, Арбат',
      rating: 4.5,
      stars: 4,
      pricePerNight: 8000,
      currency: 'RUB',
      imageUrl: 'https://example.com/hotel2.jpg',
      amenities: ['WiFi', 'Фитнес'],
      availableRooms: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useHotelSearch());

    expect(result.current.hotels).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.searchHotels).toBe('function');
    expect(typeof result.current.clearResults).toBe('function');
  });

  it('should set loading to true while searching', async () => {
    mockedApi.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: { hotels: [] } }), 100)
        )
    );

    const { result } = renderHook(() => useHotelSearch());

    act(() => {
      result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fetch hotels successfully', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { hotels: mockHotels, total: 2 },
    });

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.hotels).toEqual(mockHotels);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockedApi.post).toHaveBeenCalledWith('/hotels/search', mockSearchParams);
  });

  it('should handle API error response', async () => {
    mockedApi.post.mockResolvedValue({
      success: false,
      message: 'Отели не найдены',
    });

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.hotels).toEqual([]);
    expect(result.current.error).toBe('Отели не найдены');
    expect(result.current.loading).toBe(false);
  });

  it('should handle network error', async () => {
    mockedApi.post.mockRejectedValue({
      message: 'Network Error',
    });

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.hotels).toEqual([]);
    expect(result.current.error).toBe('Network Error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle error without message', async () => {
    mockedApi.post.mockRejectedValue({});

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.error).toBe('Ошибка при поиске отелей');
  });

  it('should clear results', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { hotels: mockHotels, total: 2 },
    });

    const { result } = renderHook(() => useHotelSearch());

    // First, search for hotels
    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.hotels).toHaveLength(2);

    // Then clear results
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.hotels).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should clear previous error when searching again', async () => {
    // First call fails
    mockedApi.post.mockRejectedValueOnce({ message: 'Error' });

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.error).toBe('Error');

    // Second call succeeds
    mockedApi.post.mockResolvedValueOnce({
      success: true,
      data: { hotels: mockHotels, total: 2 },
    });

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hotels).toEqual(mockHotels);
  });

  it('should handle empty hotels array', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { hotels: [], total: 0 },
    });

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      await result.current.searchHotels(mockSearchParams);
    });

    expect(result.current.hotels).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle search with different parameters', async () => {
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { hotels: mockHotels, total: 2 },
    });

    const { result } = renderHook(() => useHotelSearch());

    const luxuryParams: HotelSearchParams = {
      location: 'Санкт-Петербург',
      checkIn: '2024-07-01',
      checkOut: '2024-07-05',
      guests: 4,
      rooms: 2,
      minStars: 5,
      maxPrice: 50000,
    };

    await act(async () => {
      await result.current.searchHotels(luxuryParams);
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/hotels/search', luxuryParams);
  });
});
