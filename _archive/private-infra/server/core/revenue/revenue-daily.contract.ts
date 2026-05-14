export type DailyRevenuePoint = {
  date: string;
  revenue: number;
  bookings: number;
};

export type TopTherapist = {
  id: string;
  name: string;
  revenue: number;
  bookings: number;
};

export type TopService = {
  id: string;
  title: string;
  revenue: number;
  bookings: number;
};

export type RevenueDailyResponse = {
  ok: true;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    avgBasket: number;
    currency: 'EUR';
  };
  daily: DailyRevenuePoint[];
  topTherapists: TopTherapist[];
  topServices: TopService[];
};
