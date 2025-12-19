import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SearchWidget from '../components/features/SearchWidget';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="hero-gradient py-20 text-white">
          <div className="container-custom text-center">
            <h1 className="text-5xl font-heading font-bold mb-6">
              Найдите идеальное путешествие
            </h1>
            <p className="text-xl mb-8">
              Сравните тысячи предложений и сэкономьте до 50%
            </p>
            <SearchWidget />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
