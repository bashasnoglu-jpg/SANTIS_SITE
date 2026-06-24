// Santis OS - V2-E: Reception Conflict Guard

/**
 * Converts "HH:MM" to minutes from 00:00.
 */
export function timeToMinutes(timeString) {
  if (!timeString) return 0;
  const [h, m] = timeString.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Checks if two time intervals overlap.
 * Assumes start and end are in minutes.
 * Overlap occurs if one interval starts before the other ends, AND ends after the other starts.
 * Touch at boundary (e.g. 09:00-10:00 and 10:00-11:00) is NOT an overlap.
 */
export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Validates a candidate against business rules.
 * Business Hours: 08:00 - 18:00
 * Candidate must be within this window and align to 10 min slots.
 */
export function validateBusinessHours(candidate) {
  const startMin = timeToMinutes(candidate.startTime);
  const endMin = timeToMinutes(candidate.endTime);
  const bizStart = 8 * 60; // 08:00 -> 480
  const bizEnd = 18 * 60;  // 18:00 -> 1080

  const isWithinHours = startMin >= bizStart && endMin <= bizEnd;
  const isAlignStart = startMin % 10 === 0;
  const isAlignEnd = endMin % 10 === 0;

  return {
    valid: isWithinHours && isAlignStart && isAlignEnd,
    isWithinHours,
    isAlignStart,
    isAlignEnd
  };
}

/**
 * Helper to get active bookings (ignoring Cancelled, No Show)
 * and ignoring the candidate's own record ID.
 */
function getActiveBookingsForValidation(bookings, candidateId) {
  return bookings.filter(b => {
    // Ignore self
    if (b.id === candidateId) return false;
    // Ignore inactive statuses
    if (b.status === 'Cancelled' || b.status === 'cancelled' || 
        b.status === 'No Show' || b.status === 'noShow') {
      return false;
    }
    return true;
  });
}

/**
 * Detects if a candidate overlaps with any existing booking for the given therapist.
 */
export function detectTherapistConflict(bookings, candidate) {
  if (!candidate.therapistName || candidate.therapistName === 'UNASSIGNED' || candidate.therapistName === 'Unassigned') {
    return { hasConflict: false, conflictWith: null, missing: true };
  }

  const activeBookings = getActiveBookingsForValidation(bookings, candidate.bookingRecordId);
  const candStart = timeToMinutes(candidate.startTime);
  const candEnd = timeToMinutes(candidate.endTime);

  for (const b of activeBookings) {
    if (b.therapistName === candidate.therapistName) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (intervalsOverlap(candStart, candEnd, bStart, bEnd)) {
        return { hasConflict: true, conflictWith: b, missing: false };
      }
    }
  }

  return { hasConflict: false, conflictWith: null, missing: false };
}

/**
 * Detects if a candidate overlaps with any existing booking for the given room.
 */
export function detectRoomConflict(bookings, candidate) {
  if (!candidate.roomName || candidate.roomName === 'Unassigned Room' || candidate.roomName === '') {
    return { hasConflict: false, conflictWith: null, missing: true };
  }

  const activeBookings = getActiveBookingsForValidation(bookings, candidate.bookingRecordId);
  const candStart = timeToMinutes(candidate.startTime);
  const candEnd = timeToMinutes(candidate.endTime);

  for (const b of activeBookings) {
    // Exact roomName match
    if (b.roomName === candidate.roomName) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (intervalsOverlap(candStart, candEnd, bStart, bEnd)) {
        return { hasConflict: true, conflictWith: b, missing: false };
      }
    }
  }

  return { hasConflict: false, conflictWith: null, missing: false };
}

/**
 * Master validation function for a move/update.
 * Candidate shape:
 * {
 *   bookingRecordId,
 *   date,
 *   startTime,
 *   endTime,
 *   durationMinutes,
 *   therapistName,
 *   roomName
 * }
 */
export function validateTimelineMove(bookings, candidate) {
  const businessHours = validateBusinessHours(candidate);
  const therapistCheck = detectTherapistConflict(bookings, candidate);
  const roomCheck = detectRoomConflict(bookings, candidate);

  const isValid = businessHours.valid && !therapistCheck.hasConflict && !roomCheck.hasConflict;

  return {
    isValid,
    businessHours,
    therapistCheck,
    roomCheck
  };
}
