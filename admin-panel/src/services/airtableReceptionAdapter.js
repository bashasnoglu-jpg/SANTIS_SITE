import api from '../api/axios';

const MOCK_THERAPISTS = [
  { id: 'th-1', name: 'SABAN', active: true },
  { id: 'th-2', name: 'ARZU', active: true },
  { id: 'th-3', name: 'TAMARA', active: true },
  { id: 'th-4', name: 'BELA', active: true },
  { id: 'th-5', name: 'SHORENA', active: true },
  { id: 'th-6', name: 'ZAHIDE', active: true },
  { id: 'th-7', name: 'VULA', active: true },
  { id: 'th-8', name: 'DEVRIM', active: true },
  { id: 'th-9', name: 'ARZU KOZMET', active: true },
  { id: 'th-10', name: 'DESTEK KUVVET', active: true },
  { id: 'th-11', name: 'SAUNA', active: true }
];

const MOCK_SHIFTS = [
  {
    id: 'shift-1',
    fields: {
      Staff_Link: [{ name: 'ARZU' }],
      Location_Link: [{ name: 'Budva' }],
      Date: '2026-06-10',
      Shift_Status: 'Active',
      Shift_Start: '2026-06-10T09:00:00.000Z',
      Shift_End: '2026-06-10T21:00:00.000Z',
      Scheduler_Visibility: 'VISIBLE - Scheduler'
    }
  }
];

const MOCK_RAW_BOOKINGS = [
  {
    id: 'rec123',
    fields: {
      fldtlqLi9JpNxpnwh: 'BKG-001', 
      fldq07SPCXfwQ39Tc: [{ id: 'client1', name: 'Ali Işık' }], 
      fldLVMNj1biBuRMGJ: [{ id: 'srv1', name: 'Klasik Masaj' }], 
      flddXRKNIeh72ROX5: [{ id: 'th-3', name: 'TAMARA' }], 
      fld5xL3ciOBQRBt24: [{ id: 'rm1', name: 'Masaj Odası 1' }], 
      fld3NVQVraJKaK6H8: '2026-06-10', 
      fldWbz4kZzqerUxhn: '2026-06-10T08:00:00.000Z', 
      fld2AW9Mmj7mvF7Dn: '2026-06-10T09:00:00.000Z',
      fld2copXIWZXeaAKj: 60, 
      fldecPedQfpnjc83O: { name: 'confirmed' }, 
      fldRQzeLC9ncdHIk6: { name: 'Covered by Package' }, 
      fldLN7pjuUPxJvEFz: 'Bel fıtığı var, dikkatli olunmalı. (Kalan Paket: 4)' 
    }
  },
  {
    id: 'rec456',
    fields: {
      fldtlqLi9JpNxpnwh: 'BKG-002', 
      fldq07SPCXfwQ39Tc: [{ id: 'client2', name: 'Mehmet Öz' }], 
      fldLVMNj1biBuRMGJ: [{ id: 'srv2', name: 'Deep Tissue' }], 
      flddXRKNIeh72ROX5: [{ id: 'th-1', name: 'SABAN' }], 
      fld5xL3ciOBQRBt24: [{ id: 'rm2', name: 'Medical Hamam' }], 
      fld3NVQVraJKaK6H8: '2026-06-10', 
      fldWbz4kZzqerUxhn: '2026-06-10T11:30:00.000Z', 
      fld2AW9Mmj7mvF7Dn: '2026-06-10T13:00:00.000Z',
      fld2copXIWZXeaAKj: 90, 
      fldecPedQfpnjc83O: { name: 'checkedIn' }, 
    }
  },
  {
    id: 'rec789',
    fields: {
      fldtlqLi9JpNxpnwh: 'BKG-130', 
      fldq07SPCXfwQ39Tc: [{ id: 'client3', name: 'Ayşe Kaya' }], 
      fldLVMNj1biBuRMGJ: [{ id: 'srv3', name: 'Aromaterapi' }], 
      flddXRKNIeh72ROX5: [{ id: 'th-2', name: 'ARZU' }], 
      fld5xL3ciOBQRBt24: [{ id: 'rm3', name: 'Masaj Odası 2' }], 
      fld3NVQVraJKaK6H8: '2026-06-10', 
      fldWbz4kZzqerUxhn: '2026-06-10T18:30:00.000Z', 
      fld2AW9Mmj7mvF7Dn: '2026-06-10T19:30:00.000Z',
      fld2copXIWZXeaAKj: 60, 
      fldecPedQfpnjc83O: { name: 'pending' },
      Therapist_Shift_Gate: 'READY - Therapist On Shift',
      Payment_Status_New: 'Unpaid',
      Balance_Due_EUR: 80,
      fldLkesTF4z1iiQp9: [{ name: 'Budva' }]
    }
  }
];

export const airtableReceptionAdapter = {
  async fetchDailyOperations(date) {
    let rawBookings = [];
    let rawTherapists = [];
    let rawShifts = [];
    let dataSource = 'loading';
    let rooms = [];
    let services = [];
    let shiftError = null;
    const isDev = import.meta.env?.DEV || false;

    try {
      // Try fetching from Backend Proxy
      const [dayRes, shiftsRes] = await Promise.all([
        api.get(`/reception/day?date=${date}`),
        api.get(`/reception/shifts?date=${date}`).catch(e => ({ error: true, data: { shifts: [] } }))
      ]);
      
      const response = dayRes;
      
      if (response.data && Array.isArray(response.data.bookings)) {
        rawBookings = response.data.bookings;
        
        // Transform backend therapists structure if present
        if (Array.isArray(response.data.therapists) && response.data.therapists.length > 0) {
           rawTherapists = response.data.therapists.map(t => ({
             id: t.id,
             name: t.fields?.fldZ7Y21cayKlEEjt || 'Unknown',
             active: t.fields?.fldIEZrpm3TxglDTL !== false
           }));
        }
        
        rooms = response.data.rooms || [];
        services = response.data.services || [];
        dataSource = 'airtable';

        if (shiftsRes.error) {
           shiftError = 'Staff shift verisi alınamadı — vardiya kontrolü yapılamıyor.';
           rawShifts = [];
        } else {
           rawShifts = shiftsRes.data.shifts || [];
        }
      } else {
        throw new Error("Geçersiz veri formatı");
      }
    } catch (err) {
      if (isDev) {
        console.warn("[Airtable Adapter] Backend failed or unavailable, using Mock Fallback in DEV mode:", err.message);
        rawBookings = MOCK_RAW_BOOKINGS;
        rawTherapists = MOCK_THERAPISTS;
        rawShifts = MOCK_SHIFTS;
        dataSource = 'mock';
        await new Promise(resolve => setTimeout(resolve, 600));
      } else {
        console.error("[Airtable Adapter] Fatal: Backend failed in Production.", err.message);
        throw new Error("Airtable bağlantısı yok / veri alınamadı");
      }
    }

    // Transformer logic
    const transformedBookings = rawBookings.map(record => {
      const f = record.fields || {};
      
      const clientName = f.fldq07SPCXfwQ39Tc?.[0]?.name || 'Unknown Client';
      const serviceName = f.fldLVMNj1biBuRMGJ?.[0]?.name || 'Unknown Service';
      const therapistId = f.flddXRKNIeh72ROX5?.[0]?.name || 'UNASSIGNED'; 
      const therapistName = f.flddXRKNIeh72ROX5?.[0]?.name || 'Unassigned';
      const roomName = f.fld5xL3ciOBQRBt24?.[0]?.name || 'Unassigned Room';
      
      const status = f.fldecPedQfpnjc83O?.name || 'pending';
      const paymentCoverageSource = f.fldRQzeLC9ncdHIk6?.name || '';
      
      const linkedPackage = f.fldQZ0dfcxDY9haGp;
      const packageBooking = paymentCoverageSource === 'Covered by Package' || !!linkedPackage;
      
      const startDateTime = f.fldWbz4kZzqerUxhn;
      const endDateTime = f.fld2AW9Mmj7mvF7Dn;
      
      let startTime = '00:00';
      let endTime = '00:00';
      let durationMinutes = f.fld2copXIWZXeaAKj || 0;
      
      if (startDateTime) {
        const d = new Date(startDateTime);
        startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } else if (record.id === 'rec123') { startTime = '10:00'; } // fallback mock
      else if (record.id === 'rec456') { startTime = '13:30'; } // fallback mock
      else if (record.id === 'rec789') { startTime = '18:30'; } // fallback mock

      if (endDateTime) {
        const d = new Date(endDateTime);
        endTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } else if (record.id === 'rec123') { endTime = '11:00'; }
      else if (record.id === 'rec456') { endTime = '15:00'; }
      else if (record.id === 'rec789') { endTime = '19:30'; }
      
      const paymentStatusNew = f.Payment_Status_New || '';
      const balanceDueEur = parseFloat(f.Balance_Due_EUR) || 0;
      let paymentAttention = f.fldbreHZlE3U7547w?.name === 'Attention Required' || false;
      if (paymentStatusNew === 'Unpaid' && balanceDueEur > 0) {
        paymentAttention = true;
      }
      
      const locationName = f.fldLkesTF4z1iiQp9?.[0]?.name || '';

      let computedShiftGate = 'REVIEW - No Shift Found';
      const existingShiftGate = String(f.Therapist_Shift_Gate || '').trim();

      if (!therapistName || therapistName === 'Unassigned' || !locationName || !startDateTime || !endDateTime) {
         computedShiftGate = 'REVIEW - Missing Booking Data';
      } else if (shiftError && !isDev) {
         // UI should show the global error, but individual bookings fallback to existing gate or missing
         computedShiftGate = existingShiftGate || 'REVIEW - Missing Data';
      } else {
         const staffShifts = rawShifts.filter(s => {
            const sf = s.fields || {};
            
            const sStaffIds = sf.Staff_Link || sf.Staff || [];
            // Handle old mock data (Array of objects with name)
            const isMockMatch = Array.isArray(sStaffIds) && sStaffIds.some(i => typeof i === 'object' && i.name === therapistName);
            
            // Handle real Airtable data (Array of string IDs). Find if any ID belongs to the therapist.
            // therapistId from booking f.flddXRKNIeh72ROX5?.[0]?.id 
            const bookingTherapistId = f.flddXRKNIeh72ROX5?.[0]?.id || '';
            const hasIdMatch = sStaffIds.includes(bookingTherapistId);
            
            // Fallback to name lookups
            const sStaffName = sf.Staff_Name || (Array.isArray(sf.Staff_Name) ? sf.Staff_Name[0] : '');
            
            const sDate = sf.Date || sf.Shift_Date || '';
            
            return (isMockMatch || hasIdMatch || sStaffName === therapistName || sStaffIds.includes(therapistId)) && sDate === date;
         });

         if (staffShifts.length === 0) {
            computedShiftGate = 'REVIEW - No Shift Found';
         } else {
            const validShifts = staffShifts.filter(s => {
               const sf = s.fields || {};
               
               const sLocs = sf.Location_Link || sf.Location || [];
               const isMockLocMatch = Array.isArray(sLocs) && sLocs.some(i => typeof i === 'object' && i.name === locationName);
               const sLocName = sf.Location_Name || (Array.isArray(sf.Location_Name) ? sf.Location_Name[0] : '');
               const bookingLocationId = f.fldLkesTF4z1iiQp9?.[0]?.id || '';
               const hasLocIdMatch = sLocs.includes(bookingLocationId);
               
               const isLocMatch = isMockLocMatch || hasLocIdMatch || sLocName === locationName || sLocs.includes(locationName);
               
               const sStatus = sf.Shift_Status || '';
               const sStart = sf.Shift_Start || '';
               const sEnd = sf.Shift_End || '';
               const sVis = sf.Scheduler_Visibility || sf.Scheduler_Visibility?.[0] || '';

               return (
                  isLocMatch &&
                  (sStatus === 'Active' || sStatus === 'Scheduled') &&
                  new Date(sStart) <= new Date(startDateTime) &&
                  new Date(sEnd) >= new Date(endDateTime) &&
                  String(sVis).startsWith('VISIBLE - Scheduler')
               );
            });

            if (validShifts.length === 1) {
               computedShiftGate = 'READY - Therapist On Shift';
            } else if (validShifts.length > 1) {
               computedShiftGate = 'REVIEW - Multiple Matching Shifts';
            } else {
               const hasOutsideHours = staffShifts.some(s => {
                  const sf = s.fields || {};
                  const sStart = sf.Shift_Start || '';
                  const sEnd = sf.Shift_End || '';
                  return new Date(sStart) > new Date(startDateTime) || new Date(sEnd) < new Date(endDateTime);
               });
               if (hasOutsideHours) {
                  computedShiftGate = 'REVIEW - Outside Shift Hours';
               } else {
                  computedShiftGate = 'HIDDEN - Staff Not Working'; 
               }
            }
         }
      }

      // If we couldn't match dynamically, fallback to the Airtable one if it's READY.
      if (computedShiftGate !== 'READY - Therapist On Shift' && existingShiftGate.startsWith('READY')) {
          computedShiftGate = existingShiftGate;
      }

      const isShiftReady = computedShiftGate.startsWith('READY');
      const priority = record.id === 'rec789' ? 'High' : (record.id === 'rec123' ? 'VIP' : 'Normal');
      
      if (!durationMinutes && startDateTime && endDateTime) {
        const diffMs = new Date(endDateTime) - new Date(startDateTime);
        durationMinutes = Math.floor(diffMs / 60000);
      }

      return {
        id: record.id,
        airtableRecordId: record.id,
        bookingId: f.fldtlqLi9JpNxpnwh || record.id,
        date: f.fld3NVQVraJKaK6H8,
        startTime,
        endTime,
        startDateTime,
        endDateTime,
        durationMinutes,
        clientName,
        serviceName,
        therapistId,
        therapistName,
        roomName,
        locationName,
        status,
        paymentMethod: f.fldbreHZlE3U7547w?.name || '',
        paymentCoverageSource,
        linkedPackageName: linkedPackage?.[0]?.name || '',
        ledgerCreated: f.fldWZRRjdlRZdDpVw || false,
        internalNotes: f.fldLN7pjuUPxJvEFz || '',
        vip: priority === 'VIP',
        priority,
        paymentAttention,
        isShiftReady,
        computedShiftGate,
        packageBooking
      };
    });

    return {
      dataSource,
      shiftError,
      bookings: transformedBookings,
      therapists: rawTherapists,
      rooms,
      services
    };
  },

  async updateBookingStatus(recordId, status) {
    // This calls the backend to strictly update the status.
    const response = await api.patch(`/reception/bookings/${recordId}/status`, { status });
    return response.data;
  }
};
