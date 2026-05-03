export function validateSSEPacket(packet: any, lastSeq: number) {
  const { seq, ts } = packet;

  if (typeof seq !== 'number' || typeof ts !== 'number') {
    return { valid: false, reason: 'INVALID_PACKET_SHAPE' };
  }

  if (seq !== lastSeq + 1) {
    return { valid: false, reason: 'SEQUENCE_GAP', expected: lastSeq + 1, got: seq };
  }

  if (ts < Date.now() - 5000) {
    return { valid: false, reason: 'STALE_TIMESTAMP' };
  }

  return { valid: true };
}
