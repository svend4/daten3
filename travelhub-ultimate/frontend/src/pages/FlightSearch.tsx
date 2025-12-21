import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useFlightSearch } from '../hooks/useFlightSearch';
import Loading from '../components/common/Loading';

export default function FlightSearch() {
  const location = useLocation();
  const { flights, loading, error, searchFlights } = useFlightSearch();
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = location.state?.searchParams;
    if (params && !searched) {
      searchFlights(params);
      setSearched(true);
    }
  }, [location.state, searched, searchFlights]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container-custom py-8">
        <h1 className="text-3xl font-heading font-bold mb-6">
          Поиск авиабилетов
        </h1>

        {loading && <Loading />}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Ошибка: {error}
          </div>
        )}

        {!loading && !error && flights.length === 0 && searched && (
          <p className="text-gray-600">
            По вашему запросу ничего не найдено. Backend вернул пустой массив авиабилетов.
          </p>
        )}

        {!loading && !error && flights.length > 0 && (
          <div className="grid gap-4">
            {flights.map((flight: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 shadow">
                <h3 className="font-bold">{flight.airline}</h3>
                <p>{flight.origin} → {flight.destination}</p>
                <p className="text-primary-600 font-bold">{flight.price}</p>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <p className="text-gray-600">
            Используйте форму поиска на главной странице для поиска авиабилетов.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
