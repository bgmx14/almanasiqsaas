import { Router } from 'express';
import { prisma } from '@omraflow/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;

    // Get counts for all entities
    const [
      leadsCount,
      customersCount,
      bookingsCount,
      paymentsCount,
      leadsData,
      bookingsData,
      paymentsData,
    ] = await Promise.all([
      // Total counts
      prisma.lead.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.booking.count({ where: { tenantId } }),
      prisma.payment.count({ where: { tenantId, status: 'COMPLETED' } }),

      // Leads breakdown
      prisma.lead.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),

      // Bookings breakdown
      prisma.booking.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
        _sum: { totalAmount: true },
      }),

      // Payment totals
      prisma.payment.aggregate({
        where: { tenantId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Calculate conversion rate
    const convertedLeads = await prisma.lead.count({
      where: { tenantId, status: 'WON' },
    });
    const conversionRate = leadsCount > 0 ? (convertedLeads / leadsCount) * 100 : 0;

    // Get upcoming departures (next 30 days)
    const upcomingDepartures = await prisma.booking.findMany({
      where: {
        tenantId,
        departureDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        status: { in: ['CONFIRMED', 'PAID', 'PAYMENT_PENDING'] },
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true },
        },
        package: {
          select: { name: true },
        },
      },
      orderBy: { departureDate: 'asc' },
      take: 10,
    });

    // Get recent activity (last 10 items)
    const recentLeads = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
      },
    });

    const recentBookings = await prisma.booking.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Format bookings breakdown
    const bookingsBreakdown: Record<string, any> = {};
    bookingsData.forEach((item) => {
      bookingsBreakdown[item.status] = {
        count: item._count,
        totalValue: item._sum.totalAmount || 0,
      };
    });

    // Format leads breakdown
    const leadsBreakdown: Record<string, number> = {};
    leadsData.forEach((item) => {
      leadsBreakdown[item.status] = item._count;
    });

    res.json({
      success: true,
      data: {
        overview: {
          leads: leadsCount,
          customers: customersCount,
          bookings: bookingsCount,
          payments: paymentsCount,
          totalRevenue: paymentsData._sum.amount || 0,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
        leadsBreakdown,
        bookingsBreakdown,
        upcomingDepartures: upcomingDepartures.map((booking) => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          customer: `${booking.customer.firstName} ${booking.customer.lastName}`,
          package: booking.package.name,
          departureDate: booking.departureDate,
          status: booking.status,
          daysUntil: Math.ceil(
            (new Date(booking.departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        })),
        recentActivity: {
          leads: recentLeads,
          bookings: recentBookings.map((booking) => ({
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            customer: `${booking.customer.firstName} ${booking.customer.lastName}`,
            totalAmount: booking.totalAmount,
            status: booking.status,
            createdAt: booking.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get revenue chart data
router.get('/revenue', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { period = '30d' } = req.query;

    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month';

    // Determine date range and grouping based on period
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupBy = 'week';
        break;
      case '12m':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    // Get payments in the date range
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        paidAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    // Group payments by date
    const revenueByDate: Record<string, number> = {};
    payments.forEach((payment) => {
      const date = payment.paidAt || payment.createdAt;
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (groupBy === 'week') {
        // Get Monday of the week
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        key = d.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }

      revenueByDate[key] = (revenueByDate[key] || 0) + payment.amount;
    });

    // Convert to array format
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        chartData,
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        averageRevenue: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get bookings/leads chart data
router.get('/leads', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { period = '30d' } = req.query;

    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month';

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupBy = 'week';
        break;
      case '12m':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    // Get leads and bookings in the date range
    const [leads, bookings] = await Promise.all([
      prisma.lead.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Group by date
    const leadsByDate: Record<string, number> = {};
    const bookingsByDate: Record<string, number> = {};

    const formatDate = (date: Date): string => {
      if (groupBy === 'day') {
        return date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d.toISOString().split('T')[0];
      } else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    };

    leads.forEach((lead) => {
      const key = formatDate(lead.createdAt);
      leadsByDate[key] = (leadsByDate[key] || 0) + 1;
    });

    bookings.forEach((booking) => {
      const key = formatDate(booking.createdAt);
      bookingsByDate[key] = (bookingsByDate[key] || 0) + 1;
    });

    // Merge data
    const allDates = new Set([...Object.keys(leadsByDate), ...Object.keys(bookingsByDate)]);
    const chartData = Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        leads: leadsByDate[date] || 0,
        bookings: bookingsByDate[date] || 0,
      }));

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        chartData,
        totals: {
          leads: leads.length,
          bookings: bookings.length,
          conversionRate: leads.length > 0 ? (bookings.length / leads.length) * 100 : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
