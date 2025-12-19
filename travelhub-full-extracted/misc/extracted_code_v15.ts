// src/pages/Home/Home.tsx (snippet)
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-cyan-500 text-white py-20 md:py-32">
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              {t('home.hero.title')}
              <br />
              <span className="text-secondary-400">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-2xl mx-auto">
              {t('home.hero.description')}
            </p>
          </motion.div>

          <SearchWidget onSearch={handleSearch} />
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          {/* ... rest of features */}
        </Container>
      </section>
    </div>
  );
};
