import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // ============================================
  // USERS
  // ============================================
  console.log('\n📝 Creating users...');

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@travelhub.com' },
    update: {},
    create: {
      email: 'user@travelhub.com',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+79991234567',
      role: 'user',
      status: 'active',
    },
  });
  console.log('✅ Created regular user:', regularUser.email);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@travelhub.com' },
    update: {},
    create: {
      email: 'admin@travelhub.com',
      password: hashedPassword,
      firstName: 'Админ',
      lastName: 'Администраторов',
      role: 'admin',
      status: 'active',
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  const affiliateUser = await prisma.user.upsert({
    where: { email: 'affiliate@travelhub.com' },
    update: {},
    create: {
      email: 'affiliate@travelhub.com',
      password: hashedPassword,
      firstName: 'Партнер',
      lastName: 'Партнеров',
      role: 'affiliate',
      status: 'active',
    },
  });
  console.log('✅ Created affiliate user:', affiliateUser.email);

  // ============================================
  // BOOKINGS
  // ============================================
  console.log('\n📅 Creating bookings...');

  const booking1 = await prisma.booking.create({
    data: {
      userId: regularUser.id,
      type: 'hotel',
      status: 'confirmed',
      itemId: 'hotel_paris_001',
      itemName: 'Grand Hotel Paris',
      itemImage: 'https://example.com/hotel-paris.jpg',
      checkIn: new Date('2025-06-01'),
      checkOut: new Date('2025-06-05'),
      guests: 2,
      rooms: 1,
      totalPrice: 25000,
      currency: 'RUB',
    },
  });
  console.log('✅ Created hotel booking:', booking1.itemName);

  const booking2 = await prisma.booking.create({
    data: {
      userId: regularUser.id,
      type: 'flight',
      status: 'pending',
      itemId: 'flight_mow_par_001',
      itemName: 'Moscow → Paris (Aeroflot)',
      departDate: new Date('2025-06-01'),
      returnDate: new Date('2025-06-08'),
      guests: 2,
      totalPrice: 45000,
      currency: 'RUB',
    },
  });
  console.log('✅ Created flight booking:', booking2.itemName);

  // ============================================
  // FAVORITES
  // ============================================
  console.log('\n⭐ Creating favorites...');

  await prisma.favorite.create({
    data: {
      userId: regularUser.id,
      type: 'hotel',
      itemId: 'hotel_rome_001',
      name: 'Hotel Colosseum Rome',
      location: 'Rome, Italy',
      price: 18000,
      currency: 'RUB',
      rating: 4.8,
    },
  });

  await prisma.favorite.create({
    data: {
      userId: regularUser.id,
      type: 'destination',
      itemId: 'dest_barcelona',
      name: 'Barcelona',
      location: 'Spain',
      rating: 5.0,
    },
  });

  console.log('✅ Created 2 favorites');

  // ============================================
  // PRICE ALERTS
  // ============================================
  console.log('\n🔔 Creating price alerts...');

  await prisma.priceAlert.create({
    data: {
      userId: regularUser.id,
      type: 'hotel',
      destination: 'Paris',
      checkIn: new Date('2025-07-01'),
      checkOut: new Date('2025-07-05'),
      targetPrice: 20000,
      currency: 'RUB',
      currentPrice: 25000,
      status: 'active',
      isActive: true,
    },
  });

  await prisma.priceAlert.create({
    data: {
      userId: regularUser.id,
      type: 'flight',
      destination: 'London',
      departDate: new Date('2025-08-01'),
      returnDate: new Date('2025-08-10'),
      targetPrice: 30000,
      currency: 'RUB',
      status: 'active',
      isActive: true,
    },
  });

  console.log('✅ Created 2 price alerts');

  // ============================================
  // AFFILIATE PROGRAM
  // ============================================
  console.log('\n💰 Creating affiliate data...');

  const affiliate = await prisma.affiliate.create({
    data: {
      userId: affiliateUser.id,
      referralCode: 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      level: 1,
      status: 'active',
      verified: true,
      totalClicks: 342,
      totalReferrals: 15,
      totalEarnings: 125000,
      paymentMethod: 'bank_transfer',
      paymentDetails: {
        bankName: 'Сбербанк',
        accountNumber: '****1234',
      },
      emailNotifications: true,
      newReferralNotify: true,
      payoutNotify: true,
      verifiedAt: new Date(),
    },
  });
  console.log('✅ Created affiliate:', affiliate.referralCode);

  // Create referrals
  const referral1 = await prisma.referral.create({
    data: {
      affiliateId: affiliate.id,
      level: 1,
      status: 'active',
      userName: 'Мария Сидорова',
      userEmail: 'maria@example.com',
      totalEarnings: 45000,
    },
  });

  await prisma.referral.create({
    data: {
      affiliateId: affiliate.id,
      level: 1,
      status: 'active',
      userName: 'Алексей Иванов',
      userEmail: 'alexey@example.com',
      totalEarnings: 80000,
    },
  });

  console.log('✅ Created 2 referrals');

  // Create commissions
  await prisma.commission.create({
    data: {
      affiliateId: affiliate.id,
      type: 'booking',
      status: 'approved',
      amount: 2500,
      currency: 'RUB',
      bookingId: booking1.id,
      description: 'Commission from hotel booking',
      approvedAt: new Date(),
    },
  });

  await prisma.commission.create({
    data: {
      affiliateId: affiliate.id,
      type: 'referral',
      status: 'pending',
      amount: 1500,
      currency: 'RUB',
      referralId: referral1.id,
      description: 'Commission from referral signup',
    },
  });

  console.log('✅ Created 2 commissions');

  // Create payout
  await prisma.payout.create({
    data: {
      affiliateId: affiliate.id,
      amount: 50000,
      currency: 'RUB',
      method: 'bank_transfer',
      status: 'completed',
      transactionId: 'TXN' + Date.now(),
      accountDetails: {
        bankName: 'Сбербанк',
        accountNumber: '****1234',
      },
      completedAt: new Date('2024-12-01'),
    },
  });

  console.log('✅ Created payout');

  // Create affiliate clicks
  for (let i = 0; i < 10; i++) {
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        referralCode: affiliate.referralCode,
        source: i % 3 === 0 ? 'email' : i % 3 === 1 ? 'social' : 'direct',
        ipAddress: `192.168.1.${i + 1}`,
        userAgent: 'Mozilla/5.0...',
        country: 'RU',
        converted: i % 5 === 0,
        conversionId: i % 5 === 0 ? booking1.id : null,
      },
    });
  }

  console.log('✅ Created 10 affiliate clicks');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Database seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Created:');
  console.log('  • 3 users (user, admin, affiliate)');
  console.log('  • 2 bookings (hotel, flight)');
  console.log('  • 2 favorites');
  console.log('  • 2 price alerts');
  console.log('  • 1 affiliate');
  console.log('  • 2 referrals');
  console.log('  • 2 commissions');
  console.log('  • 1 payout');
  console.log('  • 10 affiliate clicks');
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('  Regular user:  user@travelhub.com / Test123!');
  console.log('  Admin user:    admin@travelhub.com / Test123!');
  console.log('  Affiliate:     affiliate@travelhub.com / Test123!');
  console.log('');
  console.log('💡 View data: npx prisma studio');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
