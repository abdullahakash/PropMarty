import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import type { FlatRecord } from './types.ts';
import config from '../firebase-applet-config.json';

const firebaseConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure GoogleAuthProvider without extra scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

let inMemoryGoogleAccessToken: string | null = null;

export function getStoredGoogleAccessToken(): string | null {
  return inMemoryGoogleAccessToken;
}

export function setGoogleAccessToken(token: string) {
  inMemoryGoogleAccessToken = token;
}

export function clearGoogleAccessToken() {
  inMemoryGoogleAccessToken = null;
}

// The user's Firestore database ID as specified in system config
const DATABASE_ID = config.firestoreDatabaseId || 'ai-studio-propmarty-644fcfde-ae17-41ff-a37a-971be694ceff';

export const db = getFirestore(app, DATABASE_ID);

export const FLATS_COLLECTION = 'flats';

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setGoogleAccessToken(credential.accessToken);
    }
    return result.user;
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

// Re-authorizes Google Drive and Sheets without logging out the current user
export async function reauthorizeGoogleDrive(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({
    prompt: 'consent select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      throw new Error('Could not retrieve Google OAuth access token from authorization popup.');
    }
    setGoogleAccessToken(accessToken);
    return accessToken;
  } catch (error: any) {
    console.error('Re-authorization error:', error);
    throw error;
  }
}

export async function logOut() {
  clearGoogleAccessToken();
  await fbSignOut(auth);
}

// Keep in sync with ADMIN_EMAILS in firestore.rules.
export const ADMIN_EMAILS = ['abdullahakash940@gmail.com'];

// Subscribe to real-time updates for flats collection
export function subscribeToFlats(
  onData: (flats: FlatRecord[]) => void, 
  onError: (error: Error) => void,
  showAllFlats: boolean = false
) {
  const user = auth.currentUser;
  if (!user) {
    onError(new Error('User not signed in'));
    return () => {};
  }
  
  const flatsRef = collection(db, FLATS_COLLECTION);
  let q;
  // If user is admin and showAllFlats is true, show everything.
  // Otherwise, filter by ownerId.
  if (ADMIN_EMAILS.includes(user.email || '') && user.emailVerified && showAllFlats) {
     q = query(flatsRef, orderBy('createdAt', 'desc'));
  } else {
     q = query(flatsRef, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
  }

  // Use direct collection listener to avoid index misses or missing field omissions
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FlatRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: data.ownerId || '',
          ownerEmail: data.ownerEmail || '',
          propertyType: data.propertyType || 'Ready Flat',
          projectName: data.projectName || data.buildingHouseNo || '',
          developerName: data.developerName || '',
          contactPerson: data.contactPerson || '',
          ratePerSqFt: data.ratePerSqFt !== undefined && data.ratePerSqFt !== null && data.ratePerSqFt !== '' ? Number(data.ratePerSqFt) : null,
          handoverDate: data.handoverDate || '',
          ownerName: data.ownerName || '',
          phoneNumber: data.phoneNumber || '',
          dateRecorded: data.dateRecorded || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : ''),
          contactStatus: data.contactStatus || 'Not Contacted Yet',
          dateContacted: data.dateContacted || '',
          nextFollowUpDate: data.nextFollowUpDate || '',
          location: data.location || '',
          plotHouseNo: data.plotHouseNo || data.buildingHouseNo || '',
          buildingHouseNo: data.buildingHouseNo || data.plotHouseNo || '',
          flatSize: data.flatSize !== undefined && data.flatSize !== null && data.flatSize !== '' ? Number(data.flatSize) : null,
          bedrooms: data.bedrooms !== undefined && data.bedrooms !== null && data.bedrooms !== '' ? Number(data.bedrooms) : null,
          bathrooms: data.bathrooms !== undefined && data.bathrooms !== null && data.bathrooms !== '' ? Number(data.bathrooms) : null,
          balconies: data.balconies !== undefined && data.balconies !== null && data.balconies !== '' ? Number(data.balconies) : null,
          drawingRooms: data.drawingRooms !== undefined && data.drawingRooms !== null && data.drawingRooms !== '' ? Number(data.drawingRooms) : null,
          diningRooms: data.diningRooms !== undefined && data.diningRooms !== null && data.diningRooms !== '' ? Number(data.diningRooms) : null,
          drawingDiningArrangement: data.drawingDiningArrangement || (data.drawingDining === 'Yes, separate' ? 'Separate' : data.drawingDining === 'No, combined' ? 'Combined' : null),
          drawingDining: data.drawingDining || null,
          layoutDescription: data.layoutDescription || '',
          floorNo: data.floorNo !== undefined && data.floorNo !== null && data.floorNo !== '' ? Number(data.floorNo) : null,
          totalFloors: data.totalFloors !== undefined && data.totalFloors !== null && data.totalFloors !== '' ? Number(data.totalFloors) : null,
          buildingStructure: data.buildingStructure || '',
          floorsAvailable: data.floorsAvailable || data.unsoldFloors || '',
          unsoldFloors: data.unsoldFloors || data.floorsAvailable || '',
          totalFlatsInProject: data.totalFlatsInProject !== undefined && data.totalFlatsInProject !== null && data.totalFlatsInProject !== '' ? Number(data.totalFlatsInProject) : null,
          unsoldFlatsCount: data.unsoldFlatsCount !== undefined && data.unsoldFlatsCount !== null && data.unsoldFlatsCount !== '' ? Number(data.unsoldFlatsCount) : null,
          facingDirections: Array.isArray(data.facingDirections) ? data.facingDirections : (data.facing ? [data.facing] : []),
          facing: data.facing || null,
          flatPosition: data.flatPosition || null,
          facingNotes: data.facingNotes || '',
          liftAvailable: data.liftAvailable === true ? true : data.liftAvailable === false ? false : null,
          generatorAvailable: data.generatorAvailable === true ? true : data.generatorAvailable === false ? false : null,
          parkingAvailable: data.parkingAvailable === true ? true : data.parkingAvailable === false ? false : null,
          intercomAvailable: data.intercomAvailable === true ? true : data.intercomAvailable === false ? false : null,
          security24x7: data.security24x7 === true ? true : data.security24x7 === false ? false : null,
          fireExitAvailable: data.fireExitAvailable === true ? true : data.fireExitAvailable === false ? false : null,
          communityHallAvailable: data.communityHallAvailable === true ? true : data.communityHallAvailable === false ? false : null,
          solarAvailable: data.solarAvailable === true ? true : data.solarAvailable === false ? false : null,
          gasLine: data.gasLine || null,
          separateElectricMeter: data.separateElectricMeter === true ? true : data.separateElectricMeter === false ? false : null,
          waterSupply: data.waterSupply || null,
          registrationStatus: data.registrationStatus || null,
          mutationStatus: data.mutationStatus || null,
          rajukApproval: data.rajukApproval || null,
          landShareType: data.landShareType || null,
          bankLoanPossible: data.bankLoanPossible || null,
          documentationNotes: data.documentationNotes || '',
          askingPrice: data.askingPrice !== undefined && data.askingPrice !== null && data.askingPrice !== '' ? Number(data.askingPrice) : null,
          utilityCharges: data.utilityCharges !== undefined && data.utilityCharges !== null && data.utilityCharges !== '' ? Number(data.utilityCharges) : null,
          parkingCharges: data.parkingCharges !== undefined && data.parkingCharges !== null && data.parkingCharges !== '' ? Number(data.parkingCharges) : null,
          otherCharges: data.otherCharges !== undefined && data.otherCharges !== null && data.otherCharges !== '' ? Number(data.otherCharges) : null,
          grandTotalPrice: data.grandTotalPrice !== undefined && data.grandTotalPrice !== null && data.grandTotalPrice !== '' ? Number(data.grandTotalPrice) : null,
          negotiable: data.negotiable === true ? true : data.negotiable === false ? false : null,
          paymentTerms: data.paymentTerms || '',
          downPayment: data.downPayment !== undefined && data.downPayment !== null && data.downPayment !== '' ? Number(data.downPayment) : null,
          mediaLink: data.mediaLink || '',
          listingStatus: data.listingStatus || 'Available',
          additionalNotes: data.additionalNotes || '',
          followUpNotes: data.followUpNotes || '',
          collectedBy: data.collectedBy || data.createdBy || 'Team Member',
          collectedByUid: data.collectedByUid || '',
          collectedByEmail: data.collectedByEmail || '',
          createdBy: data.createdBy || data.collectedBy || 'Team Member',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          updatedBy: data.updatedBy || data.createdBy || data.collectedBy || 'Team Member',
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
        } as FlatRecord;
      });

      // Sort client-side by createdAt descending (newest first)
      items.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      onData(items);
    },
    (err) => {
      console.error('Firestore listener error:', err);
      onError(err);
    }
  );
}

export async function fixOldEntries(ownerId: string, ownerEmail: string): Promise<void> {
  if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email || '') || !auth.currentUser.emailVerified) {
    throw new Error('Unauthorized');
  }

  const flatsRef = collection(db, FLATS_COLLECTION);
  const snapshot = await getDocs(flatsRef);
  
  const batch = writeBatch(db);
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.ownerId) {
      batch.update(docSnap.ref, { ownerId, ownerEmail });
      count++;
      if (count >= 500) break;
    }
  }
  
  if (count > 0) {
      await batch.commit();
  }
}


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error builder and logger that conforms to system specifications.
 * Retains error.code, original error message, and provides structured diagnostic information.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const code = (error as any)?.code || (error as any)?.name || 'firestore-error';
  const originalMessage = (error as any)?.message || String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: originalMessage,
    code,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error:', JSON.stringify(errInfo, null, 2));

  // Construct enhanced error with code, message and diagnostic JSON
  const enhancedError: any = new Error(originalMessage);
  enhancedError.code = code;
  enhancedError.originalMessage = originalMessage;
  enhancedError.details = errInfo;
  enhancedError.diagnosticJson = JSON.stringify(errInfo, null, 2);
  
  throw enhancedError;
}

/**
 * Recursively sanitizes data before writing to Firestore.
 * Replaces any `undefined` with "" and `NaN` with null to prevent Firestore from throwing unsupported field errors.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      cleaned[key] = '';
    } else if (typeof value === 'number' && isNaN(value)) {
      cleaned[key] = null;
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      typeof (value as any)?.toMillis !== 'function' &&
      typeof (value as any)?.toDate !== 'function'
    ) {
      cleaned[key] = sanitizeForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

// Add a new flat record
export async function addFlatRecord(flat: Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'>, ownerId: string, ownerEmail: string): Promise<string> {
  const path = FLATS_COLLECTION;
  try {
    const flatsRef = collection(db, path);
    const cleanFlat = sanitizeForFirestore(flat);
    const docRef = await addDoc(flatsRef, {
      ...cleanFlat,
      ownerId,
      ownerEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update existing flat record
export async function updateFlatRecord(id: string, flat: Partial<FlatRecord>): Promise<void> {
  const path = `${FLATS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, FLATS_COLLECTION, id);
    // Ensure ownerId is NOT in the update payload
    const { id: _, createdAt: __, createdBy: ___, ownerId: ____, ...updatePayload } = flat;
    const cleanPayload = sanitizeForFirestore(updatePayload);
    await updateDoc(docRef, {
      ...cleanPayload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Batch save / import flats (atomic operations in chunks of up to 400 items)
export async function batchSaveFlats(
  flatsToCreate: Array<Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'>>,
  flatsToUpdate: Array<{ id: string; data: Partial<FlatRecord> }>,
  ownerId: string,
  ownerEmail: string
): Promise<void> {
  const path = FLATS_COLLECTION;
  const flatsRef = collection(db, path);
  const CHUNK_SIZE = 400; // Firestore limit is 500 operations per batch

  try {
    // Combine operations
    const allOps: Array<{ type: 'create'; data: any } | { type: 'update'; id: string; data: any }> = [
      ...flatsToCreate.map((data) => ({ type: 'create' as const, data: sanitizeForFirestore(data) })),
      ...flatsToUpdate.map(({ id, data }) => ({ type: 'update' as const, id, data: sanitizeForFirestore(data) }))
    ];

    for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
      const chunk = allOps.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const op of chunk) {
        if (op.type === 'create') {
          const newDocRef = doc(flatsRef);
          batch.set(newDocRef, {
            ...op.data,
            ownerId,
            ownerEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const targetDocRef = doc(db, FLATS_COLLECTION, op.id);
          const { id: _, createdAt: __, ownerId: ___, ownerEmail: ____, ...payload } = op.data;
          batch.update(targetDocRef, {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete flat record
export async function deleteFlatRecord(id: string): Promise<void> {
  const path = `${FLATS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, FLATS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export { onAuthStateChanged };
export type { User };
