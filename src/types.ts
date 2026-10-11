export type PropertyType = 'Ready Flat' | 'Under-Construction Project';

export type ListingStatus = 'Available' | 'Sold' | 'Rented' | 'On Hold' | 'Not Interested';

export type ContactStatus = 
  | 'Not Contacted Yet' 
  | 'Contacted' 
  | 'Follow-up Needed' 
  | 'Visited' 
  | 'Negotiating' 
  | 'Closed';

export type FacingDirection = 
  | 'North' 
  | 'South' 
  | 'East' 
  | 'West' 
  | 'North-East' 
  | 'North-West' 
  | 'South-East' 
  | 'South-West';

export type DrawingDiningArrangement = 
  | 'Separate' 
  | 'Combined' 
  | 'Partly Separate' 
  | 'Not Sure';

// Legacy type kept for backward compatibility
export type DrawingDiningType = 'Yes, separate' | 'No, combined';

export type GasLineType = 'Piped (Titas)' | 'LPG-Cylinder' | 'LPG Central' | 'None';

export type WaterSupplyType = 'WASA' | 'Deep Tube Well' | 'WASA + Reserve Tank' | 'Other';

export type RegistrationStatusType = 'Registered' | 'Not Registered' | 'In Process';

export type MutationStatusType = 'Done' | 'Pending' | 'Not Applicable';

export type BankLoanType = 'Yes' | 'No' | 'Unknown';

export type FlatPositionType = 'Corner' | 'Middle' | 'Side-Edge' | 'Not Sure';

export type RajukApprovalType = 'Approved' | 'In Process' | 'Not Approved' | 'Not Sure';

export type LandShareType = 'Individual' | 'Joint' | 'Developer Share' | 'Landowner Share' | 'Other';

export interface FlatRecord {
  id?: string;
  propertyType?: PropertyType; // 'Ready Flat' | 'Under-Construction Project'

  // Section 1 — Owner / Developer & Location
  ownerName?: string; // Owner Name or Contact Person
  contactPerson?: string; // Legacy / alternate contact name
  projectName?: string; // Building / Apartment / Project Name
  developerName?: string; // Developer / Company (Under-Construction)
  phoneNumber?: string;
  location?: string; // Society/Area, Block, Road
  area?: string; // Neighborhood / Area e.g. Mohammadpur
  plotHouseNo?: string; // Plot / House No.
  buildingHouseNo?: string; // Legacy fallback
  dateRecorded?: string; // YYYY-MM-DD
  contactStatus?: ContactStatus; // Default: 'Not Contacted Yet'
  dateContacted?: string; // YYYY-MM-DD (Empty by default)
  nextFollowUpDate?: string; // YYYY-MM-DD
  activities?: Array<{ date: string; note: string; author?: string }>;

  // Section 2 — Size & Layout
  flatSize?: number | null; // sq ft
  bedrooms?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  drawingRooms?: number | null;
  diningRooms?: number | null;
  drawingDiningArrangement?: DrawingDiningArrangement | null;
  drawingDining?: DrawingDiningType | null; // Legacy fallback
  layoutDescription?: string;

  // Section 3 — Floor & Building Facilities
  floorNo?: number | null;
  totalFloors?: number | null;
  buildingStructure?: string; // e.g. "G+8"
  floorsAvailable?: string; // e.g. "2nd floor, 4th floor" (also fallback from unsoldFloors)
  unsoldFloors?: string; // Legacy fallback
  totalFlatsInProject?: number | null; // Under-Construction
  unsoldFlatsCount?: number | null; // Under-Construction
  facingDirections?: FacingDirection[]; // Multi-select array
  facing?: FacingDirection | string | null; // Legacy single string
  flatPosition?: FlatPositionType | null; // Corner / Middle / Side-Edge / Not Sure
  facingNotes?: string; // e.g. "Road facing, open south-east corner"

  // Facilities Checkboxes
  liftAvailable?: boolean | null;
  generatorAvailable?: boolean | null;
  parkingAvailable?: boolean | null;
  intercomAvailable?: boolean | null;
  security24x7?: boolean | null;
  fireExitAvailable?: boolean | null;
  communityHallAvailable?: boolean | null;
  solarAvailable?: boolean | null;

  // Section 4 — Utilities & Documentation / Legal
  gasLine?: GasLineType | null;
  separateElectricMeter?: boolean | null;
  waterSupply?: WaterSupplyType | null;
  registrationStatus?: RegistrationStatusType | null;
  mutationStatus?: MutationStatusType | null;
  rajukApproval?: RajukApprovalType | null;
  landShareType?: LandShareType | null;
  bankLoanPossible?: BankLoanType | null;
  documentationNotes?: string;

  // Section 5 — Pricing & Payment Breakdown
  ratePerSqFt?: number | null; // Price per sq ft (BDT)
  askingPrice?: number | null; // Base Flat Price (BDT)
  utilityCharges?: number | null; // Utility cost (BDT)
  parkingCharges?: number | null; // Car parking fee (BDT)
  otherCharges?: number | null; // Other charges (BDT)
  grandTotalPrice?: number | null; // Calculated or entered Grand Total
  negotiable?: boolean | null;
  paymentTerms?: string; // e.g. "Installment Available", "Full Cash"
  downPayment?: number | null; // Booking or down payment
  handoverDate?: string; // e.g. "December 2026" or "Ready to Move"

  // Section 6 — Media, Listing Status & Follow-up Notes
  listingStatus: ListingStatus;
  mediaLink?: string; // Drive link / URL
  additionalNotes?: string;
  followUpNotes?: string;

  // Metadata
  collectedBy?: string;
  collectedByUid?: string;
  collectedByEmail?: string;
  createdBy?: string;
  createdAt?: string; // ISO string
  updatedBy?: string;
  updatedAt?: string; // ISO string
}

export type CompletenessFilter = 'all' | 'incomplete' | 'complete';
export type ViewMode = 'list' | 'add' | 'edit';

/**
 * Normalizes a phone number by keeping only digits for duplicate checking
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Formats a number using Bangladeshi / South Asian digit grouping (e.g. 1,85,00,000)
 */
export function formatBangladeshiCurrency(num?: number | null): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  try {
    return Math.round(num).toLocaleString('en-IN');
  } catch {
    return String(Math.round(num));
  }
}

/**
 * Compact Bangladeshi unit representation (e.g. "৳ 1.85 Cr", "৳ 62.5 Lakh", "৳ 50,000")
 */
export function formatBangladeshiCompact(num?: number | null): string {
  if (num === null || num === undefined || isNaN(num) || num <= 0) return '—';
  const val = Math.round(num);
  if (val >= 10000000) {
    const crore = (val / 10000000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
    return `৳ ${crore} Cr`;
  }
  if (val >= 100000) {
    const lakh = (val / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
    return `৳ ${lakh} Lakh`;
  }
  return `৳ ${val.toLocaleString('en-IN')}`;
}

/**
 * Returns helper short text in Crore or Lakh (e.g. "≈ 1.85 Crore" or "≈ 45 Lakh")
 */
export function formatBangladeshiCroreLakh(num?: number | null): string {
  if (num === null || num === undefined || isNaN(num) || num <= 0) return '';
  const val = Math.round(num);
  if (val >= 10000000) {
    const crore = (val / 10000000).toFixed(2).replace(/\.00$/, '');
    return `≈ ${crore} Crore`;
  }
  if (val >= 100000) {
    const lakh = (val / 100000).toFixed(2).replace(/\.00$/, '');
    return `≈ ${lakh} Lakh`;
  }
  return `BDT ${val.toLocaleString('en-IN')}`;
}

/**
 * Resolves drawing/dining arrangement with fallback to legacy field
 */
export function resolveDrawingDining(flat: Partial<FlatRecord>): DrawingDiningArrangement | '' {
  if (flat.drawingDiningArrangement) return flat.drawingDiningArrangement;
  if (flat.drawingDining === 'Yes, separate') return 'Separate';
  if (flat.drawingDining === 'No, combined') return 'Combined';
  return '';
}

/**
 * Resolves facing directions array with fallback to legacy single facing string
 */
export function resolveFacingDirections(flat: Partial<FlatRecord>): FacingDirection[] {
  if (Array.isArray(flat.facingDirections) && flat.facingDirections.length > 0) {
    return flat.facingDirections;
  }
  if (flat.facing && typeof flat.facing === 'string') {
    return [flat.facing as FacingDirection];
  }
  return [];
}

/**
 * Returns a human-readable title for a property card using fallback chain:
 * 1. Location
 * 2. Project Name
 * 3. Owner / Developer / Contact Person
 * 4. Phone Number
 * 5. "Untitled entry"
 */
export function getFlatDisplayTitle(flat: Partial<FlatRecord>): string {
  if (flat.location && flat.location.trim()) {
    return flat.location.trim();
  }
  if (flat.projectName && flat.projectName.trim()) {
    return flat.projectName.trim();
  }
  if (flat.ownerName && flat.ownerName.trim()) {
    return flat.ownerName.trim();
  }
  if (flat.contactPerson && flat.contactPerson.trim()) {
    return flat.contactPerson.trim();
  }
  if (flat.developerName && flat.developerName.trim()) {
    return flat.developerName.trim();
  }
  if (flat.phoneNumber && flat.phoneNumber.trim()) {
    return flat.phoneNumber.trim();
  }
  return 'Untitled entry';
}

/**
 * Identifies missing key fields for completeness check:
 * - Phone Number
 * - Location
 * - Flat Size
 * - Asking Price (for Ready Flat) OR Rate per sq ft (for Under-Construction)
 */
export function getMissingRequiredFields(flat: Partial<FlatRecord>): string[] {
  const missing: string[] = [];
  const propType = flat.propertyType || 'Ready Flat';

  if (!flat.phoneNumber || !flat.phoneNumber.trim()) {
    missing.push('Phone Number');
  }
  if (!flat.location || !flat.location.trim()) {
    missing.push('Location');
  }
  if (flat.flatSize === null || flat.flatSize === undefined || Number(flat.flatSize) <= 0) {
    missing.push('Flat Size');
  }

  if (propType === 'Under-Construction Project') {
    if (flat.ratePerSqFt === null || flat.ratePerSqFt === undefined || Number(flat.ratePerSqFt) <= 0) {
      missing.push('Rate per sq ft');
    }
  } else {
    // Ready Flat: askingPrice is the primary price field
    if (flat.askingPrice === null || flat.askingPrice === undefined || Number(flat.askingPrice) <= 0) {
      missing.push('Asking Price');
    }
  }

  return missing;
}

/**
 * Helper to determine if a flat is incomplete
 */
export function isFlatIncomplete(flat: Partial<FlatRecord>): boolean {
  return getMissingRequiredFields(flat).length > 0;
}
