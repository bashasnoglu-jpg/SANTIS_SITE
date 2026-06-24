import { create } from 'zustand';
import { airtableReceptionAdapter } from '../services/airtableReceptionAdapter';

export const useCoreState = create((set, get) => ({
  bookings: [],
  therapists: [],
  rooms: [],
  services: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedBooking: null,
  isLoading: false,
  error: null,
  dataSource: 'loading',
  isMutating: false,
  mutationStatus: '',
  shiftError: null,

  loadReceptionDay: async (date) => {
    set({ isLoading: true, error: null, selectedDate: date, dataSource: 'loading' });
    try {
      const data = await airtableReceptionAdapter.fetchDailyOperations(date);
      set({ 
        bookings: data.bookings,
        therapists: data.therapists,
        rooms: data.rooms,
        services: data.services,
        dataSource: data.dataSource,
        shiftError: data.shiftError || null,
        isLoading: false
      });
    } catch (err) {
      console.error("[CoreState] Failed to load reception day:", err);
      set({ error: err.message, isLoading: false, dataSource: 'error', shiftError: null });
    }
  },

  selectBooking: (bookingId) => {
    if (!bookingId) {
      set({ selectedBooking: null });
      return;
    }
    const booking = get().bookings.find(b => b.id === bookingId) || null;
    set({ selectedBooking: booking });
  },

  updateBookingStatus: async (bookingId, newStatus) => {
    const { bookings, selectedBooking, dataSource } = get();
    const originalBooking = bookings.find(b => b.id === bookingId);
    if (!originalBooking) return;
    
    const previousStatus = originalBooking.status;

    // 1. Optimistic Update
    set(state => ({
      isMutating: true,
      mutationStatus: 'Saving...',
      bookings: state.bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ),
      selectedBooking: state.selectedBooking?.id === bookingId 
        ? { ...state.selectedBooking, status: newStatus } 
        : state.selectedBooking
    }));

    // 2. Mock Fallback check
    if (dataSource === 'mock') {
      setTimeout(() => {
        set({ isMutating: false, mutationStatus: 'Saved' });
        setTimeout(() => set({ mutationStatus: '' }), 2000);
      }, 500);
      return;
    }

    // 3. Backend Call
    try {
      await airtableReceptionAdapter.updateBookingStatus(originalBooking.airtableRecordId, newStatus);
      set({ isMutating: false, mutationStatus: 'Saved' });
      setTimeout(() => set({ mutationStatus: '' }), 2000);
    } catch (err) {
      console.error("[CoreState] Failed to update booking status:", err);
      // Revert Optimistic Update
      set(state => ({
        isMutating: false,
        mutationStatus: 'Failed, reverted',
        bookings: state.bookings.map(b => 
          b.id === bookingId ? { ...b, status: previousStatus } : b
        ),
        selectedBooking: state.selectedBooking?.id === bookingId 
          ? { ...state.selectedBooking, status: previousStatus } 
          : state.selectedBooking
      }));
      setTimeout(() => set({ mutationStatus: '' }), 4000);
    }
  }
}));
