import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function FlightSearch() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container-custom py-8">
        <h1 className="text-3xl font-heading font-bold mb-6">
          Поиск авиабилетов
        </h1>
        <p>В разработке...</p>
      </main>
      <Footer />
    </div>
  );
}
