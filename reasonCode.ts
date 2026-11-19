import type { CheckResult } from '../types';
import type { ReasonCode } from './explanation';
/** This classifies a completed deterministic result; it does not decide availability. */
export function reasonCodeFromResult(result: CheckResult): ReasonCode {
  if (result.status === 'available') return 'AVAILABLE';
  if (result.reason.startsWith('Overlaps with')) return 'OVERLAP';
  if (result.reason.includes('currently blocked')) return 'BLOCKED';
  if (result.reason.includes('longer than 120 minutes')) return 'TOO_LONG';
  if (result.reason.includes('later than the current time')) return 'PAST_START';
  if (result.reason.includes('Invalid interval')) return 'INVALID_INTERVAL';
  return 'OTHER';
}
