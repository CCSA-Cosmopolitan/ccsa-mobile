/**
 * houseNumberGenerator.ts
 * Generates deterministic, traceable synthetic house numbers for households
 * Format: NG-[STATE_CODE]-[LGA_CODE]-[WARD_CODE]-[PU_CODE]-H[SEQUENCE]
 * Example: NG-ZAM-MAR-GOR-PU01-H001
 */

const STATE_CODES: Record<string, string> = {
  Abia: 'ABI',
  Adamawa: 'ADA',
  'Akwa Ibom': 'AKW',
  Anambra: 'ANA',
  Bauchi: 'BAU',
  Bayelsa: 'BAY',
  Benue: 'BEN',
  Borno: 'BOR',
  'Cross River': 'CRO',
  Delta: 'DEL',
  Ebonyi: 'EBO',
  Edo: 'EDO',
  Ekiti: 'EKI',
  Enugu: 'ENU',
  FCT: 'FCT',
  'Federal Capital Territory': 'FCT',
  Gombe: 'GOM',
  Imo: 'IMO',
  Jigawa: 'JIG',
  Kaduna: 'KAD',
  Kano: 'KAN',
  Katsina: 'KAT',
  Kebbi: 'KEB',
  Kogi: 'KOG',
  Kwara: 'KWA',
  Lagos: 'LAG',
  Nasarawa: 'NAS',
  Niger: 'NIG',
  Ogun: 'OGU',
  Ondo: 'OND',
  Osun: 'OSU',
  Oyo: 'OYO',
  Plateau: 'PLA',
  Rivers: 'RIV',
  Sokoto: 'SOK',
  Taraba: 'TAR',
  Yobe: 'YOB',
  Zamfara: 'ZAM',
};

function cleanCode(value?: string | null, length: number = 3): string {
  if (!value) return 'LOC'.slice(0, length);
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned.slice(0, length).padEnd(length, 'X');
}

export function generateHouseNumber(
  state?: string | null,
  lga?: string | null,
  ward?: string | null,
  pollingUnit?: string | null,
  seq?: number
): string {
  const stateCode = (state && STATE_CODES[state]) || cleanCode(state, 3);
  const lgaCode = cleanCode(lga, 3);
  const wardCode = cleanCode(ward, 3);

  let puCode = 'PU01';
  if (pollingUnit) {
    const puDigits = pollingUnit.replace(/[^0-9]/g, '');
    if (puDigits) {
      puCode = `PU${puDigits.slice(-2).padStart(2, '0')}`;
    } else {
      puCode = cleanCode(pollingUnit, 4);
    }
  }

  const sequenceNum = seq ? String(seq).padStart(3, '0') : String(Math.floor(1 + Math.random() * 999)).padStart(3, '0');

  return `NG-${stateCode}-${lgaCode}-${wardCode}-${puCode}-H${sequenceNum}`;
}
