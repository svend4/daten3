#!/bin/bash

# Create all necessary files for TravelHub project

# Frontend pages
cat > frontend/src/pages/Home.tsx << 'EOF'
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
EOF

cat > frontend/src/pages/FlightSearch.tsx << 'EOF'
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
EOF

cat > frontend/src/pages/HotelSearch.tsx << 'EOF'
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function HotelSearch() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container-custom py-8">
        <h1 className="text-3xl font-heading font-bold mb-6">
          Поиск отелей
        </h1>
        <p>В разработке...</p>
      </main>
      <Footer />
    </div>
  );
}
EOF

cat > frontend/src/pages/NotFound.tsx << 'EOF'
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container-custom flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Страница не найдена</p>
          <Link
            to="/"
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
          >
            На главную
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
EOF

# Layout components
cat > frontend/src/components/layout/Header.tsx << 'EOF'
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container-custom py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-heading font-bold text-primary-600">
            TravelHub
          </Link>
          <div className="flex gap-6">
            <Link to="/flights" className="hover:text-primary-600">Авиабилеты</Link>
            <Link to="/hotels" className="hover:text-primary-600">Отели</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
EOF

cat > frontend/src/components/layout/Footer.tsx << 'EOF'
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container-custom text-center">
        <p>&copy; 2025 TravelHub. Все права защищены.</p>
      </div>
    </footer>
  );
}
EOF

cat > frontend/src/components/features/SearchWidget.tsx << 'EOF'
import { useState } from 'react';

export default function SearchWidget() {
  const [activeTab, setActiveTab] = useState('hotels');
  
  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('hotels')}
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'hotels'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100'
          }`}
        >
          Отели
        </button>
        <button
          onClick={() => setActiveTab('flights')}
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'flights'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100'
          }`}
        >
          Авиабилеты
        </button>
      </div>
      <div className="text-gray-800">
        {activeTab === 'hotels' ? (
          <div>Форма поиска отелей</div>
        ) : (
          <div>Форма поиска авиабилетов</div>
        )}
      </div>
    </div>
  );
}
EOF

# Backend files
cat > backend/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/hotels/search', (req, res) => {
  res.json({ message: 'Hotels search endpoint' });
});

app.get('/api/flights/search', (req, res) => {
  res.json({ message: 'Flights search endpoint' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

cat > backend/.env.example << 'EOF'
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/travelhub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here

# API Keys
BOOKING_API_KEY=your_booking_key
SKYSCANNER_API_KEY=your_skyscanner_key
AMADEUS_API_KEY=your_amadeus_key
EOF

echo "All files created successfully!"
