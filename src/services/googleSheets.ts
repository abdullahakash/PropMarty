import type { FlatRecord } from '../types.ts';
import { 
  getStoredGoogleAccessToken, 
  clearGoogleAccessToken, 
  reauthorizeGoogleDrive 
} from '../firebase.ts';

export interface BackupResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
  needsReauth?: boolean;
}

// Helper to check if an error is related to missing or insufficient scopes / auth
function isScopeOrAuthError(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('insufficient') ||
    lower.includes('scope') ||
    lower.includes('permission_denied') ||
    lower.includes('unauthenticated') ||
    lower.includes('access_token_scope_insufficient')
  );
}

export const HEADERS = [
  'ID',
  'Property Type',
  'Project Name',
  'Rate per sq ft (BDT)',
  'Developer / Company',
  'Contact Person',
  'Expected Handover',
  'Location (Society/Area/Road)',
  'Plot / House No.',
  'Owner Name',
  'Phone Number',
  'Contact Status',
  'Date Recorded',
  'Date Contacted',
  'Next Follow-up Date',
  'Flat Size (sq ft)',
  'Bedrooms',
  'Bathrooms',
  'Balconies',
  'Drawing Rooms',
  'Dining Rooms',
  'Drawing/Dining Arrangement',
  'Layout Description',
  'Floor No.',
  'Total Floors',
  'Building Structure',
  'Floors Available for Sale',
  'Total Flats in Project',
  'Unsold Flats Count',
  'Facing Directions',
  'Flat Position',
  'Facing Notes',
  'Lift Available',
  'Generator Available',
  'Parking Available',
  'Intercom Available',
  '24/7 Security',
  'Fire Exit / Safety',
  'Community Hall / Rooftop',
  'Solar / Green Power',
  'Gas Line',
  'Separate Electricity Meter',
  'Water Supply',
  'Registration Status',
  'Mutation / Namjari Status',
  'Rajuk / Authority Approval',
  'Land Share / Ownership',
  'Bank Loan Possible',
  'Documentation Notes',
  'Asking Price (BDT)',
  'Utility Charges (BDT)',
  'Parking Charges (BDT)',
  'Other Charges (BDT)',
  'Grand Total Price (BDT)',
  'Negotiable',
  'Payment Terms',
  'Down Payment (BDT)',
  'Photo / Video Link',
  'Listing Status',
  'Additional Notes',
  'Follow-up Notes / Next Date',
  'Created By',
  'Date Created',
  'Updated By',
  'Last Updated',
  'Area'
];

export function flatToRow(f: FlatRecord): any[] {
  const facingStr = Array.isArray(f.facingDirections) && f.facingDirections.length > 0
    ? f.facingDirections.join(', ')
    : (f.facing || '');

  return [
    f.id || '',
    f.propertyType || 'Ready Flat',
    f.projectName || f.buildingHouseNo || '',
    f.ratePerSqFt ?? '',
    f.developerName || '',
    f.contactPerson || f.ownerName || '',
    f.handoverDate || '',
    f.location || '',
    f.plotHouseNo || f.buildingHouseNo || '',
    f.ownerName || '',
    f.phoneNumber || '',
    f.contactStatus || 'Not Contacted Yet',
    f.dateRecorded || '',
    f.dateContacted || '',
    f.nextFollowUpDate || '',
    f.flatSize ?? '',
    f.bedrooms ?? '',
    f.bathrooms ?? '',
    f.balconies ?? '',
    f.drawingRooms ?? '',
    f.diningRooms ?? '',
    f.drawingDiningArrangement || f.drawingDining || '',
    f.layoutDescription || '',
    f.floorNo ?? '',
    f.totalFloors ?? '',
    f.buildingStructure || '',
    f.floorsAvailable || f.unsoldFloors || '',
    f.totalFlatsInProject ?? '',
    f.unsoldFlatsCount ?? '',
    facingStr,
    f.flatPosition || '',
    f.facingNotes || '',
    f.liftAvailable ? 'Yes' : 'No',
    f.generatorAvailable ? 'Yes' : 'No',
    f.parkingAvailable ? 'Yes' : 'No',
    f.intercomAvailable ? 'Yes' : 'No',
    f.security24x7 ? 'Yes' : 'No',
    f.fireExitAvailable ? 'Yes' : 'No',
    f.communityHallAvailable ? 'Yes' : 'No',
    f.solarAvailable ? 'Yes' : 'No',
    f.gasLine || '',
    f.separateElectricMeter ? 'Yes' : 'No',
    f.waterSupply || '',
    f.registrationStatus || '',
    f.mutationStatus || '',
    f.rajukApproval || '',
    f.landShareType || '',
    f.bankLoanPossible || '',
    f.documentationNotes || '',
    f.askingPrice ?? '',
    f.utilityCharges ?? '',
    f.parkingCharges ?? '',
    f.otherCharges ?? '',
    f.grandTotalPrice ?? '',
    f.negotiable ? 'Yes' : 'No',
    f.paymentTerms || '',
    f.downPayment ?? '',
    f.mediaLink || '',
    f.listingStatus || 'Available',
    f.additionalNotes || '',
    f.followUpNotes || '',
    f.createdBy || f.collectedBy || '',
    f.createdAt ? f.createdAt.split('T')[0] : '',
    f.updatedBy || f.createdBy || f.collectedBy || '',
    f.updatedAt ? f.updatedAt.split('T')[0] : '',
    f.area || ''
  ];
}

// Backup flats data to Google Sheets using Google OAuth Access Token
export async function backupFlatsToGoogleSheets(
  flats: FlatRecord[], 
  overrideToken?: string
): Promise<BackupResult> {
  try {
    let accessToken = overrideToken || getStoredGoogleAccessToken();

    // If no access token is available in local storage, prompt reauthorization
    if (!accessToken) {
      try {
        accessToken = await reauthorizeGoogleDrive();
      } catch (authErr: any) {
        return {
          success: false,
          needsReauth: true,
          error: 'Google Drive & Sheets permission is needed to back up your data. Please click "Re-authorize Google Drive Access" to grant access.',
        };
      }
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const title = `PropMarty Property Records (${dateStr})`;

    // 1. Create a new Spreadsheet in user's Google Drive
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title,
        },
        sheets: [
          {
            properties: {
              title: 'Flats Collection',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createResponse.ok) {
      const errData = await createResponse.json().catch(() => ({}));
      const rawMessage = errData.error?.message || `Google Sheets API responded with status ${createResponse.status}`;
      
      if (isScopeOrAuthError(createResponse.status, rawMessage)) {
        clearGoogleAccessToken();
        return {
          success: false,
          needsReauth: true,
          error: 'Permission Issue: Your Google sign-in session is missing the required permissions for Google Sheets and Google Drive (insufficient scopes). Please click "Re-authorize Google Drive Access" below to grant permissions and complete the backup.',
        };
      }

      throw new Error(rawMessage);
    }

    const createdSheet = await createResponse.json();
    const spreadsheetId = createdSheet.spreadsheetId;

    // 2. Prepare rows
    const rows = [
      HEADERS,
      ...flats.map(flatToRow)
    ];

    // 3. Append data to spreadsheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Flats Collection'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: "'Flats Collection'!A1",
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errData = await updateResponse.json().catch(() => ({}));
      const rawMessage = errData.error?.message || 'Failed to populate Google Sheet rows.';

      if (isScopeOrAuthError(updateResponse.status, rawMessage)) {
        clearGoogleAccessToken();
        return {
          success: false,
          needsReauth: true,
          error: 'Permission Issue: Your Google sign-in session is missing the required permissions for Google Sheets and Google Drive (insufficient scopes). Please click "Re-authorize Google Drive Access" below to grant permissions and complete the backup.',
        };
      }

      throw new Error(rawMessage);
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Persist last backup sheet ID and URL for easy 1-click import later
    try {
      localStorage.setItem('pm_last_backup_sheet_id', spreadsheetId);
      localStorage.setItem('pm_last_backup_sheet_url', spreadsheetUrl);
    } catch {
      // ignore storage errors
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (error: any) {
    console.error('Google Sheets backup error:', error);
    const msg = error.message || 'An unexpected error occurred during Google Sheets backup.';
    const isAuth = isScopeOrAuthError(0, msg);

    if (isAuth) {
      clearGoogleAccessToken();
    }

    return {
      success: false,
      needsReauth: isAuth,
      error: isAuth 
        ? 'Permission Issue: Google Drive and Google Sheets access has not been granted or has expired. Please click "Re-authorize Google Drive Access" below to grant permissions.'
        : msg,
    };
  }
}

export function getLastBackupSheet(): { id: string | null; url: string | null } {
  try {
    return {
      id: localStorage.getItem('pm_last_backup_sheet_id'),
      url: localStorage.getItem('pm_last_backup_sheet_url'),
    };
  } catch {
    return { id: null, url: null };
  }
}

// Extract Spreadsheet ID from standard Google Drive / Sheets URLs
export function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}

export interface SheetFetchResult {
  success: boolean;
  rows?: any[][];
  spreadsheetTitle?: string;
  error?: string;
  needsReauth?: boolean;
}

// Read raw data from a Google Spreadsheet
export async function readFlatsFromGoogleSheet(
  spreadsheetIdOrUrl: string,
  overrideToken?: string
): Promise<SheetFetchResult> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!spreadsheetId) {
    return { success: false, error: 'Please enter a valid Google Sheet URL or Spreadsheet ID.' };
  }

  let accessToken = overrideToken || getStoredGoogleAccessToken();
  if (!accessToken) {
    try {
      accessToken = await reauthorizeGoogleDrive();
    } catch (authErr: any) {
      return {
        success: false,
        needsReauth: true,
        error: 'Google Drive & Sheets access is required to import. Please authorize access.',
      };
    }
  }

  try {
    // 1. Fetch metadata to get the first sheet name
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!metaResponse.ok) {
      const errData = await metaResponse.json().catch(() => ({}));
      const rawMsg = errData.error?.message || `Google Sheets API returned status ${metaResponse.status}`;
      if (isScopeOrAuthError(metaResponse.status, rawMsg)) {
        clearGoogleAccessToken();
        return {
          success: false,
          needsReauth: true,
          error: 'Your Google sign-in session is missing permissions to read this sheet. Please re-authorize Google Drive access.',
        };
      }
      throw new Error(rawMsg);
    }

    const meta = await metaResponse.json();
    const sheetTitle = meta.sheets?.[0]?.properties?.title || 'Flats Collection';
    const spreadsheetTitle = meta.properties?.title || 'Google Sheet';

    // 2. Fetch row values
    const valuesResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1:AG500`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!valuesResponse.ok) {
      const errData = await valuesResponse.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to read rows from the Google Sheet.');
    }

    const valData = await valuesResponse.json();
    const rows = valData.values || [];

    return {
      success: true,
      rows,
      spreadsheetTitle,
    };
  } catch (error: any) {
    console.error('Error reading Google Sheet:', error);
    const msg = error.message || 'Failed to fetch spreadsheet rows.';
    const isAuth = isScopeOrAuthError(0, msg);
    if (isAuth) clearGoogleAccessToken();

    return {
      success: false,
      needsReauth: isAuth,
      error: isAuth
        ? 'Google permissions missing or expired. Please re-authorize Google Drive access.'
        : msg,
    };
  }
}

export function rowToFlat(row: any[], headerMap?: Map<string, number>): Partial<FlatRecord> {
  const parseNum = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(String(val).replace(/,/g, '').trim());
    return isNaN(n) ? null : n;
  };

  const parseBool = (val: any) => {
    if (!val) return false;
    const s = String(val).trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1';
  };

  const getCell = (headerKey: string, fallbackIdx: number): any => {
    if (headerMap && headerMap.has(headerKey)) {
      const idx = headerMap.get(headerKey)!;
      return row[idx];
    }
    return row[fallbackIdx];
  };

  // Check if row has ID in column 0 (new standard format) or legacy format (ownerName at 0)
  const isNewFormat = headerMap 
    ? headerMap.has('id') 
    : (row.length >= 35 && (typeof row[0] === 'string' && (row[0].length === 20 || row[0].startsWith('PM-') || row[0] === '' || row[1] === 'Ready Flat' || row[1] === 'Under-Construction Project')));

  if (headerMap) {
    const rawFacing = getCell('facing directions', 29)?.toString() || getCell('facing', 19)?.toString() || '';
    const facingDirections = rawFacing
      ? rawFacing.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    return {
      id: getCell('id', 0)?.toString().trim() || undefined,
      propertyType: (getCell('property type', 1)?.toString().trim() || 'Ready Flat') as any,
      projectName: getCell('project name', 2)?.toString().trim() || '',
      ratePerSqFt: parseNum(getCell('rate per sq ft (bdt)', 3) || getCell('rate per sq ft', 3)),
      developerName: getCell('developer / company', 4)?.toString().trim() || getCell('developer name', 4)?.toString().trim() || '',
      contactPerson: getCell('contact person', 5)?.toString().trim() || '',
      handoverDate: getCell('expected handover', 6)?.toString().trim() || getCell('handover date', 6)?.toString().trim() || '',
      location: getCell('location (society/area/road)', 7)?.toString().trim() || getCell('location', 7)?.toString().trim() || '',
      plotHouseNo: getCell('plot / house no.', 8)?.toString().trim() || getCell('building/house no.', 8)?.toString().trim() || '',
      buildingHouseNo: getCell('building/house no.', 8)?.toString().trim() || getCell('plot / house no.', 8)?.toString().trim() || '',
      ownerName: getCell('owner name', 9)?.toString().trim() || '',
      phoneNumber: getCell('phone number', 10)?.toString().trim() || '',
      contactStatus: (getCell('contact status', 11)?.toString().trim() || 'Not Contacted Yet') as any,
      dateRecorded: getCell('date recorded', 12)?.toString().trim() || '',
      dateContacted: getCell('date contacted', 13)?.toString().trim() || getCell('date contacted', 11)?.toString().trim() || '',
      nextFollowUpDate: getCell('next follow-up date', 14)?.toString().trim() || '',
      flatSize: parseNum(getCell('flat size (sq ft)', 15) || getCell('flat size', 12)),
      bedrooms: parseNum(getCell('bedrooms', 16) || getCell('bedrooms', 13)),
      bathrooms: parseNum(getCell('bathrooms', 17) || getCell('bathrooms', 14)),
      balconies: parseNum(getCell('balconies', 18) || getCell('balconies', 15)),
      drawingRooms: parseNum(getCell('drawing rooms', 19)),
      diningRooms: parseNum(getCell('dining rooms', 20)),
      drawingDiningArrangement: (getCell('drawing/dining arrangement', 21)?.toString().trim() || null) as any,
      drawingDining: (getCell('drawing/dining separate', 16)?.toString().trim() || null) as any,
      layoutDescription: getCell('layout description', 22)?.toString().trim() || '',
      floorNo: parseNum(getCell('floor no.', 23) || getCell('floor no.', 17) || getCell('floor no', 17)),
      totalFloors: parseNum(getCell('total floors', 24) || getCell('total floors', 18)),
      buildingStructure: getCell('building structure', 25)?.toString().trim() || '',
      floorsAvailable: getCell('floors available for sale', 26)?.toString().trim() || getCell('floors available', 26)?.toString().trim() || '',
      unsoldFloors: getCell('floors available for sale', 26)?.toString().trim() || '',
      totalFlatsInProject: parseNum(getCell('total flats in project', 27)),
      unsoldFlatsCount: parseNum(getCell('unsold flats count', 28)),
      facingDirections: facingDirections as any,
      facing: (facingDirections[0] || getCell('facing', 19)?.toString().trim() || null) as any,
      flatPosition: (getCell('flat position', 30)?.toString().trim() || null) as any,
      facingNotes: getCell('facing notes', 31)?.toString().trim() || '',
      liftAvailable: parseBool(getCell('lift available', 32) ?? getCell('lift available', 20)),
      generatorAvailable: parseBool(getCell('generator available', 33) ?? getCell('generator available', 21)),
      parkingAvailable: parseBool(getCell('parking available', 34) ?? getCell('parking available', 22)),
      intercomAvailable: parseBool(getCell('intercom available', 35) ?? getCell('intercom available', 23)),
      security24x7: parseBool(getCell('24/7 security', 36) ?? getCell('24/7 security', 24)),
      fireExitAvailable: parseBool(getCell('fire exit / safety', 37)),
      communityHallAvailable: parseBool(getCell('community hall / rooftop', 38)),
      solarAvailable: parseBool(getCell('solar / green power', 39)),
      gasLine: (getCell('gas line', 40)?.toString().trim() || getCell('gas line', 25)?.toString().trim() || null) as any,
      separateElectricMeter: parseBool(getCell('separate electricity meter', 41) ?? getCell('separate electricity meter', 26)),
      waterSupply: (getCell('water supply', 42)?.toString().trim() || getCell('water supply', 27)?.toString().trim() || null) as any,
      registrationStatus: (getCell('registration status', 43)?.toString().trim() || getCell('registration status', 28)?.toString().trim() || null) as any,
      mutationStatus: (getCell('mutation / namjari status', 44)?.toString().trim() || getCell('mutation / namjari status', 29)?.toString().trim() || null) as any,
      rajukApproval: (getCell('rajuk / authority approval', 45)?.toString().trim() || null) as any,
      landShareType: (getCell('land share / ownership', 46)?.toString().trim() || null) as any,
      bankLoanPossible: (getCell('bank loan possible', 47)?.toString().trim() || getCell('bank loan possible', 30)?.toString().trim() || null) as any,
      documentationNotes: getCell('documentation notes', 48)?.toString().trim() || '',
      askingPrice: parseNum(getCell('asking price (bdt)', 49) || getCell('asking price', 31)),
      utilityCharges: parseNum(getCell('utility charges (bdt)', 50)),
      parkingCharges: parseNum(getCell('parking charges (bdt)', 51)),
      otherCharges: parseNum(getCell('other charges (bdt)', 52)),
      grandTotalPrice: parseNum(getCell('grand total price (bdt)', 53)),
      negotiable: parseBool(getCell('negotiable', 54) ?? getCell('negotiable', 32)),
      paymentTerms: getCell('payment terms', 55)?.toString().trim() || getCell('payment terms', 33)?.toString().trim() || '',
      downPayment: parseNum(getCell('down payment (bdt)', 56)),
      mediaLink: getCell('photo / video link', 57)?.toString().trim() || getCell('media link', 34)?.toString().trim() || '',
      listingStatus: (getCell('listing status', 58)?.toString().trim() || getCell('listing status', 35)?.toString().trim() || 'Available') as any,
      additionalNotes: getCell('additional notes', 59)?.toString().trim() || getCell('additional notes', 36)?.toString().trim() || '',
      followUpNotes: getCell('follow-up notes / next date', 60)?.toString().trim() || getCell('follow-up notes / next date', 37)?.toString().trim() || '',
      createdBy: getCell('created by', 61)?.toString().trim() || 'Team Member',
      updatedBy: getCell('updated by', 63)?.toString().trim() || 'Team Member',
    };
  }

  // Fallback to standard indices (new format where col 0 is ID)
  if (isNewFormat) {
    return {
      id: row[0]?.toString().trim() || undefined,
      propertyType: (row[1]?.toString().trim() || 'Ready Flat') as any,
      projectName: row[2]?.toString().trim() || '',
      ratePerSqFt: parseNum(row[3]),
      developerName: row[4]?.toString().trim() || '',
      contactPerson: row[5]?.toString().trim() || '',
      handoverDate: row[6]?.toString().trim() || '',
      location: row[7]?.toString().trim() || '',
      buildingHouseNo: row[8]?.toString().trim() || '',
      ownerName: row[9]?.toString().trim() || '',
      phoneNumber: row[10]?.toString().trim() || '',
      dateContacted: row[11]?.toString().trim() || '',
      flatSize: parseNum(row[12]),
      bedrooms: parseNum(row[13]),
      bathrooms: parseNum(row[14]),
      balconies: parseNum(row[15]),
      drawingDining: (row[16]?.toString().trim() || null) as any,
      floorNo: parseNum(row[17]),
      totalFloors: parseNum(row[18]),
      facing: (row[19]?.toString().trim() || null) as any,
      liftAvailable: parseBool(row[20]),
      generatorAvailable: parseBool(row[21]),
      parkingAvailable: parseBool(row[22]),
      intercomAvailable: parseBool(row[23]),
      security24x7: parseBool(row[24]),
      gasLine: (row[25]?.toString().trim() || null) as any,
      separateElectricMeter: parseBool(row[26]),
      waterSupply: (row[27]?.toString().trim() || null) as any,
      registrationStatus: (row[28]?.toString().trim() || null) as any,
      mutationStatus: (row[29]?.toString().trim() || null) as any,
      bankLoanPossible: (row[30]?.toString().trim() || null) as any,
      askingPrice: parseNum(row[31]),
      negotiable: parseBool(row[32]),
      paymentTerms: row[33]?.toString().trim() || '',
      mediaLink: row[34]?.toString().trim() || '',
      listingStatus: (row[35]?.toString().trim() || 'Available') as any,
      additionalNotes: row[36]?.toString().trim() || '',
      followUpNotes: row[37]?.toString().trim() || '',
      createdBy: row[38]?.toString().trim() || 'Team Member',
      updatedBy: row[40]?.toString().trim() || 'Team Member',
    };
  }

  // Legacy layout where col 0 is ownerName
  return {
    ownerName: row[0]?.toString().trim() || '',
    phoneNumber: row[1]?.toString().trim() || '',
    dateContacted: row[2]?.toString().trim() || '',
    location: row[3]?.toString().trim() || '',
    buildingHouseNo: row[4]?.toString().trim() || '',
    flatSize: parseNum(row[5]),
    bedrooms: parseNum(row[6]),
    bathrooms: parseNum(row[7]),
    balconies: parseNum(row[8]),
    drawingDining: (row[9]?.toString().trim() || null) as any,
    floorNo: parseNum(row[10]),
    totalFloors: parseNum(row[11]),
    facing: (row[12]?.toString().trim() || null) as any,
    liftAvailable: parseBool(row[13]),
    generatorAvailable: parseBool(row[14]),
    parkingAvailable: parseBool(row[15]),
    intercomAvailable: parseBool(row[16]),
    security24x7: parseBool(row[17]),
    gasLine: (row[18]?.toString().trim() || null) as any,
    separateElectricMeter: parseBool(row[19]),
    waterSupply: (row[20]?.toString().trim() || null) as any,
    registrationStatus: (row[21]?.toString().trim() || null) as any,
    mutationStatus: (row[22]?.toString().trim() || null) as any,
    bankLoanPossible: (row[23]?.toString().trim() || null) as any,
    askingPrice: parseNum(row[24]),
    negotiable: parseBool(row[25]),
    paymentTerms: row[26]?.toString().trim() || '',
    mediaLink: row[27]?.toString().trim() || '',
    listingStatus: (row[28]?.toString().trim() || 'Available') as any,
    additionalNotes: row[29]?.toString().trim() || '',
    followUpNotes: row[30]?.toString().trim() || '',
    collectedBy: row[31]?.toString().trim() || 'Team Member',
  };
}

export interface FieldDifference {
  field: keyof FlatRecord;
  label: string;
  oldValue: any;
  newValue: any;
}

export interface FlatDiffItem {
  type: 'new' | 'modified';
  flat: Partial<FlatRecord>;
  existingId?: string;
  changes?: FieldDifference[];
}

export interface SheetComparisonResult {
  newFlats: FlatDiffItem[];
  modifiedFlats: FlatDiffItem[];
  unchangedCount: number;
  totalSheetRows: number;
}

// Compare parsed rows against existing Firestore records using ID as primary matcher
export function compareSheetWithFirestore(
  rows: any[][],
  existingFlats: FlatRecord[]
): SheetComparisonResult {
  if (!rows || rows.length <= 1) {
    return { newFlats: [], modifiedFlats: [], unchangedCount: 0, totalSheetRows: 0 };
  }

  // Row 0 is header row
  const headerRow = rows[0] || [];
  const dataRows = rows.slice(1);
  const newFlats: FlatDiffItem[] = [];
  const modifiedFlats: FlatDiffItem[] = [];
  let unchangedCount = 0;

  // Build header lookup map (lowercase trimmed)
  const headerMap = new Map<string, number>();
  headerRow.forEach((h, idx) => {
    if (h) headerMap.set(String(h).trim().toLowerCase(), idx);
  });

  // Fast map by Firestore document ID
  const existingById = new Map<string, FlatRecord>();
  for (const flat of existingFlats) {
    if (flat.id) {
      existingById.set(flat.id, flat);
    }
  }

  for (const row of dataRows) {
    // Skip completely empty rows
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === '')) {
      continue;
    }

    const parsed = rowToFlat(row, headerMap);

    // Requirement 6: Do NOT reject rows with empty phone or empty location!
    // If the row has an ID matching an existing Firestore doc, check for diffs
    const docId = parsed.id?.trim();
    let existing: FlatRecord | undefined = undefined;

    if (docId && existingById.has(docId)) {
      existing = existingById.get(docId);
    }

    if (!existing) {
      // Row has no ID or ID not found in Firestore -> treat as a new entry
      newFlats.push({
        type: 'new',
        flat: parsed,
      });
    } else {
      // Row has a matching ID in Firestore -> compare fields for modifications
      const changes: FieldDifference[] = [];

      const checkField = (field: keyof FlatRecord, label: string) => {
        const oldVal = existing![field] ?? '';
        const newVal = parsed[field] ?? '';
        if (String(oldVal).trim() !== String(newVal).trim()) {
          changes.push({
            field,
            label,
            oldValue: oldVal,
            newValue: newVal,
          });
        }
      };

      checkField('propertyType', 'Property Type');
      checkField('projectName', 'Project Name');
      checkField('ratePerSqFt', 'Rate per sq ft');
      checkField('developerName', 'Developer / Company');
      checkField('contactPerson', 'Contact Person');
      checkField('handoverDate', 'Expected Handover');
      checkField('ownerName', 'Owner Name');
      checkField('phoneNumber', 'Phone Number');
      checkField('location', 'Location');
      checkField('buildingHouseNo', 'House / Building No.');
      checkField('flatSize', 'Flat Size (sq ft)');
      checkField('bedrooms', 'Bedrooms');
      checkField('bathrooms', 'Bathrooms');
      checkField('askingPrice', 'Asking Price');
      checkField('listingStatus', 'Listing Status');
      checkField('negotiable', 'Negotiable');
      checkField('floorNo', 'Floor No.');
      checkField('totalFloors', 'Total Floors');
      checkField('gasLine', 'Gas Line');
      checkField('registrationStatus', 'Registration Status');
      checkField('mutationStatus', 'Mutation Status');
      checkField('paymentTerms', 'Payment Terms');
      checkField('mediaLink', 'Photo/Video Link');
      checkField('additionalNotes', 'Additional Notes');
      checkField('followUpNotes', 'Follow-up Notes');

      if (changes.length > 0) {
        modifiedFlats.push({
          type: 'modified',
          flat: parsed,
          existingId: existing.id,
          changes,
        });
      } else {
        unchangedCount++;
      }
    }
  }

  return {
    newFlats,
    modifiedFlats,
    unchangedCount,
    totalSheetRows: dataRows.length,
  };
}

// Download data as CSV file
export function exportFlatsToCSV(flats: FlatRecord[]): void {
  const rows = [
    HEADERS,
    ...flats.map(flatToRow)
  ];

  const csvContent = rows
    .map((row) =>
      row
        .map((field) => {
          const stringified = field === null || field === undefined ? '' : String(field);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
            return `"${stringified.replace(/"/g, '""')}"`;
          }
          return stringified;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `propmarty_flats_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
