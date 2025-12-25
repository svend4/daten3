import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useHotelSearch } from '../hooks/useHotelSearch';
import Loading from '../components/common/Loading';
import SEOHead from '../components/SEO/SEOHead';

export default function HotelSearch() {
  const location = useLocation();
  const { hotels, loading, error, searchHotels } = useHotelSearch();
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = location.state?.searchParams;
    if (params && !searched) {
      searchHotels(params);
      setSearched(true);
    }
  }, [location.state, searched, searchHotels]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Hotel Search - Find Best Hotel Deals | TravelHub"
        description="Search and compare hotels worldwide. Find the best hotel deals from 500+ providers with TravelHub. Save up to 40% on your bookings."
        keywords={['hotel search', 'cheap hotels', 'hotel deals', 'accommodation', 'book hotels']}
        type="website"
      />
      <Header />
      <main className="flex-grow container-custom py-8">
        <h1 className="text-3xl font-heading font-bold mb-6">
          Поиск отелей
        </h1>

        {loading && <Loading />}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Ошибка: {error}
          </div>
        )}

        {!loading && !error && hotels.length === 0 && searched && (
          <p className="text-gray-600">
            По вашему запросу ничего не найдено. Backend вернул пустой массив отелей.
          </p>
        )}

        {!loading && !error && hotels.length > 0 && (
          <div className="grid gap-4">
            {hotels.map((hotel: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 shadow">
                <h3 className="font-bold">{hotel.name}</h3>
                <p>{hotel.location}</p>
                <p className="text-primary-600 font-bold">{hotel.price}</p>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <p className="text-gray-600">
            Используйте форму поиска на главной странице для поиска отелей.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
