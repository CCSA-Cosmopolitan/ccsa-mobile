// Types for the Data Correction module

export interface CorrectionFarmerSummary {
  id: string;
  nin: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string;
  state: string | null;
  lga: string | null;
  ward: string | null;
  pollingUnit: string | null;
  status: string;
  registrationDate: string;
}

export interface CorrectionReferee {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string;
}

export interface CorrectionFarmerDetail extends CorrectionFarmerSummary {
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  employmentStatus: string | null;
  email: string | null;
  whatsAppNumber: string | null;
  address: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bvn: string | null;
  latitude: number | null;
  longitude: number | null;
  referees: CorrectionReferee[];
}

export interface CorrectionFilter {
  search: string;
  state: string;
  lga: string;
  ward: string;
  pollingUnit: string;
  nin: string;
  bvn: string;
}

export interface CorrectionPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Only the fields a correction agent is allowed to edit */
export type EditableFields = Pick<
  CorrectionFarmerDetail,
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'dateOfBirth'
  | 'gender'
  | 'maritalStatus'
  | 'employmentStatus'
  | 'phone'
  | 'email'
  | 'whatsAppNumber'
  | 'address'
  | 'state'
  | 'lga'
  | 'ward'
  | 'pollingUnit'
  | 'bankName'
  | 'accountNumber'
  | 'accountName'
  | 'bvn'
  | 'latitude'
  | 'longitude'
>;

// ─── Farm correction types ────────────────────────────────────────────────────

export interface FarmCorrectionDetail {
  id: string;
  farmerId: string;
  farmSize: number | null;
  primaryCrop: string | null;
  secondaryCrop: string[];
  produceCategory: string | null;
  farmOwnership: string | null;
  farmState: string | null;
  farmLocalGovernment: string | null;
  farmingSeason: string | null;
  farmWard: string | null;
  farmPollingUnit: string | null;
  farmingExperience: number | null;
  farmLatitude: number | null;
  farmLongitude: number | null;
  farmPolygon: any | null;
  soilType: string | null;
  soilPH: number | null;
  soilFertility: string | null;
  farmArea: number | null;
  farmElevation: number | null;
  year: number | null;
  yieldSeason: string | null;
  crop: string | null;
  quantity: number | null;
  cropVariety: string | null;
  landforms: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FarmEditableFields = Omit<FarmCorrectionDetail, 'id' | 'farmerId' | 'createdAt' | 'updatedAt'>;

// ─── Referee correction types ─────────────────────────────────────────────────

export type RefereeOp =
  | { type: 'add'; firstName: string; lastName: string; phone: string; relationship: string }
  | { type: 'update'; refereeId: string; firstName?: string; lastName?: string; phone?: string; relationship?: string }
  | { type: 'delete'; refereeId: string };

