import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@store/AuthContext';
import './i18n/config';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Loading from '../components/common/Loading';

// Lazy load pages
const Home = lazy(() => import('@pages/Home/Home'));
const FlightSearch = lazy(() => import('@pages/FlightSearch/FlightSearch'));
const HotelSearch = lazy(() => import('@pages/HotelSearch/HotelSearch'));
const Profile = lazy(() => import('@pages/Profile/Profile'));
const Favorites = lazy(() => import('@pages/Favorites/Favorites'));
const Bookings = lazy(() => import('@pages/Bookings/Bookings'));
const NotFound = lazy(() => import('@pages/NotFound/NotFound'));

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1">
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <Loading size="lg" text="Loading page..." />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/flights" element={<FlightSearch />} />
                  <Route path="/hotels" element={<HotelSearch />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />

            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
