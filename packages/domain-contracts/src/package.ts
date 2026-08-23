export interface PackageEntity {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  basePrice: number;
}
