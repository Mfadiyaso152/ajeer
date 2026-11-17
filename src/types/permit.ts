export interface PermitData {
  permitNumber: string;
  permitType: string;
  startDate: string;
  endDate: string;
  verificationStatus: string;
  workerName: string;
  workerIdNumber: string;
  nationality: string;
  occupation: string;
  gender: string;
  birthDate: string;
  firstEstablishmentName: string;
  firstEstablishmentNumber: string;
  secondEstablishmentName: string;
  secondEstablishmentNumber: string;
  customLogoDataUrl: string;
  platformTitle: string;
  platformSubtitle: string;
}

export const PERMIT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const PERMIT_SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function isValidPermitSlug(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed.length >= 1 &&
    trimmed.length <= 80 &&
    PERMIT_SLUG_PATTERN.test(trimmed) &&
    trimmed.toLowerCase() !== 'admin'
  );
}

export const PERMIT_FIELD_LIMITS = {
  permitNumber: 80,
  permitType: 80,
  startDate: 10,
  endDate: 10,
  verificationStatus: 120,
  workerName: 120,
  workerIdNumber: 40,
  nationality: 60,
  occupation: 100,
  gender: 30,
  birthDate: 10,
  firstEstablishmentName: 150,
  firstEstablishmentNumber: 60,
  secondEstablishmentName: 150,
  secondEstablishmentNumber: 60,
  customLogoDataUrl: 180000,
  platformTitle: 120,
  platformSubtitle: 180,
} as const;

export const PAGE_FIELD_LIMITS = {
  title: 150,
  subtitle: 250,
  content: 8000,
} as const;

export function sanitizePermitPayload(raw: PermitData): PermitData {
  const trimClamp = (value: string, max: number, fallback: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return trimmed.slice(0, max);
  };

  const validDateOrFallback = (value: string, fallback: string): string => {
    const trimmed = value.trim();
    return PERMIT_DATE_PATTERN.test(trimmed) ? trimmed : fallback;
  };

  return {
    permitNumber: trimClamp(raw.permitNumber, PERMIT_FIELD_LIMITS.permitNumber, 'غير مقدم'),
    permitType: trimClamp(raw.permitType, PERMIT_FIELD_LIMITS.permitType, 'عقد أجير'),
    startDate: validDateOrFallback(raw.startDate, '2026-09-11'),
    endDate: validDateOrFallback(raw.endDate, '2027-05-16'),
    verificationStatus: trimClamp(
      raw.verificationStatus,
      PERMIT_FIELD_LIMITS.verificationStatus,
      'ساري / فعال',
    ),
    workerName: trimClamp(raw.workerName, PERMIT_FIELD_LIMITS.workerName, 'فادي بلبل'),
    workerIdNumber: trimClamp(raw.workerIdNumber, PERMIT_FIELD_LIMITS.workerIdNumber, '2174090627'),
    nationality: trimClamp(raw.nationality, PERMIT_FIELD_LIMITS.nationality, 'سوريا'),
    occupation: trimClamp(raw.occupation, PERMIT_FIELD_LIMITS.occupation, 'مندوب مبيعات'),
    gender: trimClamp(raw.gender, PERMIT_FIELD_LIMITS.gender, 'ذكر'),
    birthDate: validDateOrFallback(raw.birthDate, '1992-05-15'),
    firstEstablishmentName: trimClamp(
      raw.firstEstablishmentName,
      PERMIT_FIELD_LIMITS.firstEstablishmentName,
      'شركة واترماستر المحدودة',
    ),
    firstEstablishmentNumber: trimClamp(
      raw.firstEstablishmentNumber,
      PERMIT_FIELD_LIMITS.firstEstablishmentNumber,
      '1-2902058',
    ),
    secondEstablishmentName: trimClamp(
      raw.secondEstablishmentName,
      PERMIT_FIELD_LIMITS.secondEstablishmentName,
      'مؤسسة نماذج التميز للمقاولات',
    ),
    secondEstablishmentNumber: trimClamp(
      raw.secondEstablishmentNumber,
      PERMIT_FIELD_LIMITS.secondEstablishmentNumber,
      '1-1496479',
    ),
    customLogoDataUrl:
      raw.customLogoDataUrl && raw.customLogoDataUrl.length <= PERMIT_FIELD_LIMITS.customLogoDataUrl
        ? raw.customLogoDataUrl
        : '',
    platformTitle: trimClamp(
      raw.platformTitle,
      PERMIT_FIELD_LIMITS.platformTitle,
      'التحقق من تصريح',
    ),
    platformSubtitle: trimClamp(
      raw.platformSubtitle,
      PERMIT_FIELD_LIMITS.platformSubtitle,
      'تم التحقق من التصريح بنجاح.',
    ),
  };
}
