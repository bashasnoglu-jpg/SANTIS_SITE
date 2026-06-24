import React, { useState, useEffect, useMemo } from 'react';
import { airtableReceptionAdapter } from '../services/airtableReceptionAdapter';
import { validateTimelineMove } from '../services/receptionConflictGuard';

const START_HOUR = 8;
const END_HOUR = 18;
const PIXELS_PER_MINUTE = 2; // 1 dk = 2px -> 60 dk = 120px

export default function ReceptionTimeline() {
  const [state, setState] = useState({
    bookings: [],
    therapists: [],
    rooms: [],
    services: [],
    selectedDate: new Date().toISOString().split('T')[0],
    selectedBooking: null,
    isLoading: true,
    error: null,
    dataSource: 'loading',
    isMutating: false,
    mutationStatus: '',
    shiftError: null
  });

  const loadReceptionDay = async (date) => {
    setState(s => ({ ...s, isLoading: true, error: null, selectedDate: date, dataSource: 'loading' }));
    try {
      const data = await airtableReceptionAdapter.fetchDailyOperations(date);
      setState(s => ({
        ...s,
        bookings: data.bookings,
        therapists: data.therapists,
        rooms: data.rooms,
        services: data.services,
        dataSource: data.dataSource,
        shiftError: data.shiftError || null,
        isLoading: false
      }));
    } catch (err) {
      console.error("[ReceptionTimeline] Failed to load day:", err);
      setState(s => ({ ...s, error: err.message, isLoading: false, dataSource: 'error', shiftError: null }));
    }
  };

  const selectBooking = (bookingId) => {
    setState(s => {
      if (!bookingId) return { ...s, selectedBooking: null };
      const booking = s.bookings.find(b => b.id === bookingId) || null;
      return { ...s, selectedBooking: booking };
    });
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    // Boardroom: "Do not add Airtable write/update behavior. UI must be read-only for this phase."
    setState(s => ({ ...s, isMutating: true, mutationStatus: 'Read-only mode (Simulated)' }));
    setTimeout(() => {
       setState(s => ({ ...s, isMutating: false, mutationStatus: '' }));
    }, 1500);
  };

  useEffect(() => {
    loadReceptionDay(state.selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    bookings,
    therapists,
    selectedDate,
    selectedBooking,
    isLoading,
    error,
    shiftError,
    isMutating,
    mutationStatus,
    dataSource
  } = state;

  // Saat sütunu (08:00, 09:00...)
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // Saati yukarıdan ne kadar piksellik boşluk bırakacağına çevirir (Örn: 10:30)
  const getTopOffset = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return ((h - START_HOUR) * 60 + m) * PIXELS_PER_MINUTE;
  };

  const displayTherapists = therapists.map(t => t.name);
  if (therapists.length > 0 && !displayTherapists.includes('UNASSIGNED')) {
    displayTherapists.push('UNASSIGNED');
  } else if (therapists.length === 0) {
    // Fallback if no therapists loaded yet
    displayTherapists.push('UNASSIGNED');
  }

  // Handle Action Buttons
  const handleCheckIn = () => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking.id, 'Checked In');
      // don't close drawer immediately so user sees feedback
    }
  };

  const handleComplete = () => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking.id, 'Completed');
    }
  };

  const handleCancel = () => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking.id, 'Cancelled');
    }
  };

  const handleNoShow = () => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking.id, 'No Show');
    }
  };

  const safetyCheck = useMemo(() => {
    if (!selectedBooking || !bookings) return null;
    const candidate = {
      bookingRecordId: selectedBooking.id,
      date: selectedBooking.date,
      startTime: selectedBooking.startTime,
      endTime: selectedBooking.endTime,
      durationMinutes: selectedBooking.durationMinutes,
      therapistName: selectedBooking.therapistName,
      roomName: selectedBooking.roomName
    };
    return validateTimelineMove(bookings, candidate);
  }, [selectedBooking, bookings]);

  return (
    <div className="flex h-full w-full bg-white font-sans text-slate-800 overflow-hidden">
      
      {/* SOL SIDEBAR */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50 flex-col hidden md:flex z-20">
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold leading-none">Santis OS</h1>
              <p className="text-xs text-slate-400">Resepsiyon Canlı Ekranı</p>
            </div>
            {dataSource === 'airtable' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistem Canlı (Airtable)"></div>}
            {dataSource === 'mock' && <div className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded ml-2" title="Mock Veri">MOCK</div>}
          </div>
          {error && <div className="text-[10px] text-red-400 truncate">{error}</div>}
          {shiftError && <div className="text-[10px] text-red-500 font-bold bg-red-50 p-1 rounded mt-1 border border-red-200">{shiftError}</div>}
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center mb-4 shadow-sm font-semibold text-sm text-indigo-700 cursor-pointer hover:bg-slate-50">
            {isLoading ? 'Yükleniyor...' : `📅 ${selectedDate}`}
          </div>
          <input 
            type="text" 
            placeholder="Müşteri veya Randevu Ara..." 
            className="w-full p-2 mb-6 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Günlük Özet</h3>
          <div className="space-y-2 text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center"><span>Toplam:</span><span className="font-bold">{bookings.length}</span></div>
            <div className="flex justify-between items-center"><span>Onaylı:</span><span className="font-bold text-emerald-600">{bookings.filter(b => b.status === 'confirmed').length}</span></div>
            <div className="flex justify-between items-center"><span>Bekleyen:</span><span className="font-bold text-amber-500">{bookings.filter(b => b.status === 'pending').length}</span></div>
            <div className="flex justify-between items-center"><span>İçeride:</span><span className="font-bold text-blue-600">{bookings.filter(b => b.status === 'checkedIn').length}</span></div>
          </div>
        </div>
      </aside>

      {/* ANA TIMELINE EKRANI */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        
        {/* Terapist Sütun Başlıkları (Yatay Scrollable - Sticky Top) */}
        <header className="flex border-b border-slate-200 bg-white shadow-sm z-10 sticky top-0">
          <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400">SAAT</span>
          </div>
          <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {displayTherapists.map((res) => (
              <div key={res} className="min-w-[140px] flex-1 text-center py-3 border-r border-slate-200 font-bold text-slate-600 text-xs truncate px-1 uppercase bg-white">
                {res}
              </div>
            ))}
          </div>
        </header>

        {/* Timeline Grid Gövdesi (Scroll edilebilir alan) */}
        <div className="flex-1 flex overflow-auto relative no-scrollbar">
          
          {/* Sol Dikey Saat Ekseni (Sticky Left) */}
          <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white sticky left-0 z-10">
            {hours.slice(0, -1).map((hour) => (
              <div 
                key={hour} 
                className="text-xs text-slate-400 font-bold text-right pr-2 border-b border-slate-200 bg-white relative"
                style={{ height: `${60 * PIXELS_PER_MINUTE}px`, paddingTop: '4px' }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Kaynak (Terapist) Kolonları ve Randevu Kartları */}
          <div className="flex-1 flex relative">
            
            {/* Arka Plan Grid Çizgileri (10'ar Dakikalık) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {hours.slice(0, -1).map(h => (
                <div key={h} className="w-full relative" style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}>
                  <div className="absolute top-0 w-full border-t border-slate-200" />
                  <div className="absolute top-[16.66%] w-full border-t border-slate-100 border-dotted" />
                  <div className="absolute top-[33.33%] w-full border-t border-slate-100 border-dotted" />
                  <div className="absolute top-[50%] w-full border-t border-slate-200 border-dashed" />
                  <div className="absolute top-[66.66%] w-full border-t border-slate-100 border-dotted" />
                  <div className="absolute top-[83.33%] w-full border-t border-slate-100 border-dotted" />
                </div>
              ))}
            </div>

            {/* Sütunlar ve Absolute Kartlar */}
            {displayTherapists.map((res) => {
              const colBookings = bookings.filter(b => b.therapistName === res || (res === 'UNASSIGNED' && !b.therapistName));
              
              return (
                <div key={res} className="min-w-[140px] flex-1 border-r border-slate-100 relative hover:bg-slate-50/50 transition-colors" style={{ height: `${(END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE}px` }}>
                  
                  {colBookings.map((booking) => {
                    const top = getTopOffset(booking.startTime);
                    const height = booking.durationMinutes * PIXELS_PER_MINUTE;
                    
                    // Statü renkleri
                    let bgClass = "bg-emerald-100 text-emerald-900"; 
                    if (booking.status === 'pending' || booking.status === 'Confirmed') bgClass = "bg-amber-100 text-amber-900";
                    if (booking.status === 'checkedIn' || booking.status === 'Checked In') bgClass = "bg-blue-100 text-blue-900";
                    if (booking.status === 'Cancelled' || booking.status === 'No Show') bgClass = "bg-slate-200 text-slate-500 opacity-60";
                    
                    // Zümrüt yeşili paket border'ı
                    let borderStyle = booking.packageBooking ? "border-2 border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]" : "border-l-4 border-slate-400";
                    if (!booking.packageBooking) {
                      if (booking.status === 'confirmed' || booking.status === 'Confirmed') borderStyle = "border-l-4 border-emerald-500";
                      if (booking.status === 'pending') borderStyle = "border-l-4 border-amber-500";
                      if (booking.status === 'checkedIn' || booking.status === 'Checked In') borderStyle = "border-l-4 border-blue-500";
                    }

                    return (
                      <div
                        key={booking.id}
                        onClick={() => selectBooking(booking.id)}
                        className={`absolute left-1 right-1 rounded shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all p-1.5 flex flex-col z-10 overflow-hidden ${bgClass} ${borderStyle}`}
                        style={{ top: `${top}px`, height: `${height - 2}px` }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[11px] font-bold leading-tight truncate pr-1">{booking.clientName}</span>
                          <div className="flex gap-1 flex-shrink-0">
                            {booking.paymentAttention && <span className="bg-red-500 text-white text-[9px] px-1 rounded font-bold shadow-sm animate-pulse" title="Ödeme Bekliyor / Attention">€!</span>}
                            {booking.priority === 'High' && <span className="bg-orange-500 text-white text-[9px] px-1 rounded font-bold shadow-sm">HIGH</span>}
                            {booking.priority === 'VIP' && <span className="bg-amber-400 text-amber-900 text-[9px] px-1 rounded font-bold shadow-sm">VIP</span>}
                          </div>
                        </div>
                        <div className="text-[10px] leading-tight truncate opacity-90">{booking.serviceName}</div>
                        <div className="mt-auto flex justify-between items-end text-[9px] font-semibold opacity-80">
                          <span>{booking.startTime} - {booking.endTime}</span>
                          <div className="flex flex-col items-end">
                            <span className="truncate ml-1">{booking.roomName}</span>
                            {booking.paymentCoverageSource && <span className="text-[8px] opacity-70 truncate">{booking.paymentCoverageSource}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* SAĞ ÇEKMECE MASKESİ */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity" onClick={() => selectBooking(null)}></div>
      )}
      
      {/* SAĞ ÇEKMECE (Drawer) */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col ${selectedBooking ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedBooking && (
          <>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative">
              <h3 className="font-bold text-slate-800 text-lg">Randevu Detayı</h3>
              {mutationStatus && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm
                  ${mutationStatus === 'Saving...' ? 'bg-amber-100 text-amber-700 animate-pulse' : 
                    mutationStatus === 'Saved' ? 'bg-emerald-100 text-emerald-700' : 
                    'bg-red-100 text-red-700'}
                `}>
                  {mutationStatus}
                </div>
              )}
              <button onClick={() => selectBooking(null)} className="text-slate-400 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Müşteri</p>
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {selectedBooking.clientName}
                  {selectedBooking.vip && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase shadow-sm">VIP</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">Sistem ID: {selectedBooking.bookingId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Saat</p>
                  <p className="font-semibold text-sm mt-1">{selectedBooking.startTime} ({selectedBooking.durationMinutes} dk)</p>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100 relative">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Terapist</p>
                  <p className="font-semibold text-sm mt-1">{selectedBooking.therapistName}</p>
                  <div className="mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                      selectedBooking.computedShiftGate?.startsWith('READY') ? 'bg-emerald-100 text-emerald-800' :
                      selectedBooking.computedShiftGate?.startsWith('REVIEW') ? 'bg-amber-100 text-amber-800' :
                      selectedBooking.computedShiftGate?.startsWith('HIDDEN') ? 'bg-slate-200 text-slate-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedBooking.computedShiftGate || 'Bilinmiyor'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Hizmet & Oda</p>
                <p className="font-semibold text-slate-800">{selectedBooking.serviceName}</p>
                <p className="text-sm text-slate-600">{selectedBooking.roomName}</p>
              </div>

              {selectedBooking.packageBooking && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                  <p className="text-xs text-emerald-700 uppercase font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Paket Kullanımı
                  </p>
                  <p className="text-xs text-emerald-800 mt-1">Bu işlem müşterinin aktif paketinden düşülecektir.</p>
                </div>
              )}

              {selectedBooking.internalNotes && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Notlar</p>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                    {selectedBooking.internalNotes}
                  </div>
                </div>
              )}

              {/* Safety Check Block - Sadece hata varsa göster */}
              {safetyCheck && (safetyCheck.therapistCheck.hasConflict || safetyCheck.roomCheck.hasConflict || (!safetyCheck.businessHours.valid && !selectedBooking.isShiftReady)) && (
                <div className="bg-red-50 border border-red-200 shadow-sm rounded p-3 text-xs space-y-2 mt-4">
                  <p className="text-[10px] text-red-500 uppercase font-bold mb-2">⚠️ Çakışma / Vardiya Uyarısı</p>
                  
                  {/* Therapist */}
                  {safetyCheck.therapistCheck.hasConflict && (
                    <div className="flex items-center justify-between border-b border-red-100 pb-1">
                      <span className="text-red-800">Terapist:</span>
                      <span className="text-red-600 font-bold flex items-center gap-1">Çakışma ({safetyCheck.therapistCheck.conflictWith?.startTime})</span>
                    </div>
                  )}

                  {/* Room */}
                  {safetyCheck.roomCheck.hasConflict && (
                    <div className="flex items-center justify-between border-b border-red-100 pb-1">
                      <span className="text-red-800">Oda:</span>
                      <span className="text-red-600 font-bold flex items-center gap-1">Çakışma ({safetyCheck.roomCheck.conflictWith?.startTime})</span>
                    </div>
                  )}

                  {/* Business Hours */}
                  {!safetyCheck.businessHours.valid && !selectedBooking.isShiftReady && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-800">Mesai Saatleri:</span>
                      <span className="text-red-600 font-bold">Geçersiz (08-18 dışı)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
              <button disabled={isMutating} onClick={handleCheckIn} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded transition-colors shadow-sm">
                Check-in Yap
              </button>
              <button disabled={isMutating} onClick={handleComplete} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded transition-colors shadow-sm">
                {selectedBooking.packageBooking ? 'Paketten Düş & Tamamla' : 'Tamamla'}
              </button>
              <div className="flex gap-2 pt-2">
                <button disabled={isMutating} onClick={handleCancel} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-1 text-xs rounded transition-colors border border-red-100">
                  İptal
                </button>
                <button disabled={isMutating} onClick={handleNoShow} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-1 text-xs rounded transition-colors border border-slate-200">
                  No-show
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Kaydırma Çubuklarını Gizleyen CSS Sınıfı */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
