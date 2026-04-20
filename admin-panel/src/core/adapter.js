import { resolveSovereignError } from './error-dictionary';

const DEFAULT_VIOLATION_MESSAGE = 'Sovereign OS: Kritik yukleme ihlali!';

const isRecord = (value) => typeof value === 'object' && value !== null;

const pickMessage = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
};

const extractPayload = (rawInput) => {
  if (!isRecord(rawInput)) {
    return rawInput;
  }

  if (isRecord(rawInput.response)) {
    return rawInput.response.data ?? rawInput;
  }

  return rawInput;
};

const extractEnvelopePayload = (payload) => {
  if (!isRecord(payload) || !isRecord(payload.payload)) {
    return null;
  }

  return payload.payload;
};

const extractCode = (payload, envelopePayload) =>
  pickMessage(
    payload?.code,
    payload?.reason,
    payload?.error,
    envelopePayload?.reason,
    envelopePayload?.action,
  );

export class ConstitutionalGuard {
  static sanitize(rawInput, fallbackMessage = DEFAULT_VIOLATION_MESSAGE) {
    const payload = extractPayload(rawInput);
    const envelopePayload = extractEnvelopePayload(payload);
    const code = extractCode(payload, envelopePayload);
    const rawMessage = pickMessage(
      payload?.message,
      payload?.detail,
      envelopePayload?.message,
      rawInput instanceof Error ? rawInput.message : null,
    );
    const mappedError = code
      ? resolveSovereignError(code, rawMessage ?? fallbackMessage)
      : null;

    const message =
      mappedError?.message ??
      rawMessage ??
      (typeof envelopePayload?.action === 'string'
        ? `Sovereign ${envelopePayload.action} ihlali.`
        : fallbackMessage);

    const status =
      (isRecord(rawInput?.response) && typeof rawInput.response.status === 'number'
        ? rawInput.response.status
        : null) ??
      (typeof payload?.status === 'number' ? payload.status : null);

    return {
      code: mappedError?.code ?? code ?? null,
      rawCode: mappedError?.rawCode ?? code ?? null,
      message,
      payload: payload ?? null,
      severity:
        mappedError?.severity ??
        pickMessage(payload?.severity, envelopePayload?.severity) ??
        'MEDIUM',
      status,
    };
  }
}
