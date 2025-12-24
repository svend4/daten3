import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useEffect } from 'react';

// Loading component for Suspense fallback
import Loading from './components/common/Loading';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary';

// Contexts
import { AuthProvider } from './store/AuthContext';

// API
import { api } from './utils/api';
import { logger } from './utils/logger';

// Lazy load all pages for better performance
// Main pages
const Home = lazy(() => import('./pages/Home'));
const FlightSearch = lazy(() => import('./pages/FlightSearch'));
const HotelSearch = lazy(() => import('./pages/HotelSearch'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const HotelDetails = lazy(() => import('./pages/HotelDetails'));

// Auth pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));

// User pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const BookingDetails = lazy(() => import('./pages/BookingDetails'));
const Favorites = lazy(() => import('./pages/Favorites'));
const PriceAlerts = lazy(() => import('./pages/PriceAlerts'));
const Settings = lazy(() => import('./pages/Settings'));
const Reviews = lazy(() => import('./pages/Reviews'));

// Booking pages
const BookingPage = lazy(() => import('./pages/BookingPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

// Affiliate pages
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard'));
const AffiliateReferrals = lazy(() => import('./pages/AffiliateReferrals'));
const AffiliatePortal = lazy(() => import('./pages/AffiliatePortal'));
const AffiliatePayouts = lazy(() => import('./pages/AffiliatePayouts'));
const AffiliateSettings = lazy(() => import('./pages/AffiliateSettings'));

// Admin pages
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Support pages
const Support = lazy(() => import('./pages/Support'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

// Error pages
const NotFound = lazy(() => import('./pages/NotFound'));

// Test pages
const TestPage = lazy(() => import('./pages/TestPage'));
const AutomatedTestsPage = lazy(() => import('./pages/AutomatedTestsPage'));
const CORSTestPage = lazy(() => import('./pages/CORSTestPage'));

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Page loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading size="lg" text="Загрузка..." />
    </div>
  );
}

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
