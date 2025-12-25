import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';

// Main pages
import Home from './pages/Home';
import FlightSearch from './pages/FlightSearch';
import HotelSearch from './pages/HotelSearch';
import SearchResults from './pages/SearchResults';
import HotelDetails from './pages/HotelDetails';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';

// User pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Favorites from './pages/Favorites';
import PriceAlerts from './pages/PriceAlerts';
import Settings from './pages/Settings';
import Reviews from './pages/Reviews';

// Booking pages
import BookingPage from './pages/BookingPage';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';

// Affiliate pages
import AffiliateDashboard from './pages/AffiliateDashboard';
import AffiliateReferrals from './pages/AffiliateReferrals';
import AffiliatePortal from './pages/AffiliatePortal';
import AffiliatePayouts from './pages/AffiliatePayouts';
import AffiliateSettings from './pages/AffiliateSettings';

// Admin pages
import AdminPanel from './pages/AdminPanel';

// Support pages
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Error pages
import NotFound from './pages/NotFound';

// Test pages
import TestPage from './pages/TestPage';
import AutomatedTestsPage from './pages/AutomatedTestsPage';
import CORSTestPage from './pages/CORSTestPage';

// Contexts
import { AuthProvider } from './store/AuthContext';

// API
import { api } from './utils/api';
import { logger } from './utils/logger';

// SEO
import StructuredData from './components/SEO/StructuredData';

const queryClient = new QueryClient();

function App() {
  // Initialize API client on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await api.initialize();
        logger.info('Application initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize application', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StructuredData
            type="Organization"
            data={{}}
          />
          <StructuredData
            type="WebSite"
            data={{}}
          />
          <BrowserRouter>
            <Routes>
          {/* Main routes */}
          <Route path="/" element={<Home />} />
          <Route path="/flights" element={<FlightSearch />} />
          <Route path="/hotels" element={<HotelSearch />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/hotel/:id" element={<HotelDetails />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />

          {/* User routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/price-alerts" element={<PriceAlerts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reviews" element={<Reviews />} />

          {/* Booking routes */}
          <Route path="/booking/:hotelId" element={<BookingPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

          {/* Affiliate routes */}
          <Route path="/affiliate" element={<AffiliateDashboard />} />
          <Route path="/affiliate/referrals" element={<AffiliateReferrals />} />
          <Route path="/affiliate/portal" element={<AffiliatePortal />} />
          <Route path="/affiliate/payouts" element={<AffiliatePayouts />} />
          <Route path="/affiliate/settings" element={<AffiliateSettings />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Support routes */}
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Test routes */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/automated-tests" element={<AutomatedTestsPage />} />
          <Route path="/cors-test" element={<CORSTestPage />} />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
// Build trigger
