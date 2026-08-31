import type {
  CanonicalBooking,
  GuardResult,
  PackageEntity,
  ProgressState,
  TelemetrySignal,
} from "@santis-core/domain-contracts";

declare const booking: CanonicalBooking;
declare const guard: GuardResult;
declare const packageEntity: PackageEntity;
declare const progress: ProgressState;
declare const telemetry: TelemetrySignal;

void [booking, guard, packageEntity, progress, telemetry];
