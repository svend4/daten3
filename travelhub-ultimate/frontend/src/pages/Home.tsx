import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SearchWidget from '../components/features/SearchWidget';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">
              Найдите идеальное путешествие
            </h1>
            <p className="text-xl mb-8">
              Сравните тысячи предложений и сэкономьте до 50%
            </p>
            <SearchWidget />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Почему выбирают TravelHub
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">Лучшие цены</h3>
                <p className="text-gray-600">
                  Сравниваем предложения от сотен провайдеров
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold mb-2">Быстрый поиск</h3>
                <p className="text-gray-600">
                  Результаты за несколько секунд
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-2">Безопасность</h3>
                <p className="text-gray-600">
                  Защищенные платежи и конфиденциальность
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Популярные направления
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {['Париж', 'Токио', 'Нью-Йорк', 'Бали'].map((city) => (
                <div key={city} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{city}</h3>
                    <p className="text-gray-600 text-sm">От $299</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
