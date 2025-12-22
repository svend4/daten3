// ... existing code

// Affiliate routes
const affiliateRoutes = require('./routes/affiliate.routes');
const adminAffiliateRoutes = require('./routes/admin.routes');

// ... existing middleware

// Routes
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/admin/affiliate', adminAffiliateRoutes);

// ... rest of the app
