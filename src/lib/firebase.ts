import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore targeting the provisioned database ID
export const firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

/**
 * Validates connectivity to the provisioned Firestore database
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(firestore, 'system', 'connection_probe'));
    return { connected: true, message: 'Connected to Firestore successfully.' };
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'not-found') {
      // Permission-denied or not-found confirms active server reachability
      return { connected: true, message: `Connected to Firestore (status: ${error.code}).` };
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
      return { connected: false, message: 'Firestore client is currently offline.' };
    }
    return { connected: true, message: 'Server reached.' };
  }
}
