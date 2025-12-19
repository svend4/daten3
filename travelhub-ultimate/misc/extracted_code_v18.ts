// ... existing imports
const AffiliateDashboard = lazy(() => import('@pages/AffiliateDashboard/AffiliateDashboard'));
const AffiliateReferrals = lazy(() => import('@pages/AffiliateReferrals/AffiliateReferrals'));
const AffiliatePayouts = lazy(() => import('@pages/AffiliatePayouts/AffiliatePayouts'));
const AdminAffiliateDashboard = lazy(() => import('@pages/AdminAffiliateDashboard/AdminAffiliateDashboard'));

// ... in Routes
<Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
<Route path="/affiliate/referrals" element={<AffiliateReferrals />} />
<Route path="/affiliate/payouts" element={<AffiliatePayouts />} />
<Route path="/admin/affiliate" element={<AdminAffiliateDashboard />} />
