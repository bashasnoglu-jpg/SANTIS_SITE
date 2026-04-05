export interface TelemetryFrame {
  clearance: number;
  x: number;
  y: number;
  flags: number;
}

export const TELEMETRY_FRAME_SIZE = 12;

export function encodeTelemetryFrame(
  clearance: number,
  x: number,
  y: number,
  flags = 0,
): ArrayBuffer {
  const buf = new ArrayBuffer(TELEMETRY_FRAME_SIZE);
  const view = new DataView(buf);

  view.setUint16(0, clearance, true);
  view.setFloat32(2, x, true);
  view.setFloat32(6, y, true);
  view.setUint8(10, flags & 0xff);

  let checksum = 0;
  for (let i = 0; i < 11; i++) {
    checksum ^= view.getUint8(i);
  }

  view.setUint8(11, checksum);
  return buf;
}

export function decodeTelemetryFrame(
  input: ArrayBuffer | ArrayBufferView,
): TelemetryFrame {
  const buf =
    input instanceof ArrayBuffer
      ? input
      : input.buffer.slice(
          input.byteOffset,
          input.byteOffset + input.byteLength,
        );

  if (buf.byteLength !== TELEMETRY_FRAME_SIZE) {
    throw new Error(
      `Invalid telemetry frame size: expected ${TELEMETRY_FRAME_SIZE}, got ${buf.byteLength}`,
    );
  }

  const view = new DataView(buf);

  let checksum = 0;
  for (let i = 0; i < 11; i++) {
    checksum ^= view.getUint8(i);
  }

  const expectedChecksum = view.getUint8(11);
  if (checksum !== expectedChecksum) {
    throw new Error(
      `Telemetry checksum mismatch: expected ${expectedChecksum}, computed ${checksum}`,
    );
  }

  return {
    clearance: view.getUint16(0, true),
    x: view.getFloat32(2, true),
    y: view.getFloat32(6, true),
    flags: view.getUint8(10),
  };
}
