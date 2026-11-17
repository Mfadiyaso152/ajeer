import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { DEFAULT_PERMIT_DATA } from '../data/defaultPermit';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  DEFAULT_PERMIT_DOC_ID,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  testConnection,
} from '../lib/firebase';
import { PermitData, sanitizePermitPayload } from '../types/permit';

interface FirebasePermitContextValue {
  permit: PermitData;
  loadingPermit: boolean;
  lastSyncedAt: string | null;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  saving: boolean;
  authError: string | null;
  savePermitData: (nextData: PermitData) => Promise<void>;
  resetToDefaultPermit: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  submitSupportInquiry: (serviceTopic: string, message: string) => Promise<boolean>;
}

const FirebasePermitContext = createContext<FirebasePermitContextValue | undefined>(undefined);

function mapDocToPermitData(data: Record<string, unknown>): PermitData {
  return sanitizePermitPayload({
    permitNumber: String(data.permitNumber ?? DEFAULT_PERMIT_DATA.permitNumber),
    permitType: String(data.permitType ?? DEFAULT_PERMIT_DATA.permitType),
    startDate: String(data.startDate ?? DEFAULT_PERMIT_DATA.startDate),
    endDate: String(data.endDate ?? DEFAULT_PERMIT_DATA.endDate),
    verificationStatus: String(
      data.verificationStatus ?? DEFAULT_PERMIT_DATA.verificationStatus,
    ),
    workerName: String(data.workerName ?? DEFAULT_PERMIT_DATA.workerName),
    workerIdNumber: String(data.workerIdNumber ?? DEFAULT_PERMIT_DATA.workerIdNumber),
    nationality: String(data.nationality ?? DEFAULT_PERMIT_DATA.nationality),
    occupation: String(data.occupation ?? DEFAULT_PERMIT_DATA.occupation),
    gender: String(data.gender ?? DEFAULT_PERMIT_DATA.gender),
    birthDate: String(data.birthDate ?? DEFAULT_PERMIT_DATA.birthDate),
    firstEstablishmentName: String(
      data.firstEstablishmentName ?? DEFAULT_PERMIT_DATA.firstEstablishmentName,
    ),
    firstEstablishmentNumber: String(
      data.firstEstablishmentNumber ?? DEFAULT_PERMIT_DATA.firstEstablishmentNumber,
    ),
    secondEstablishmentName: String(
      data.secondEstablishmentName ?? DEFAULT_PERMIT_DATA.secondEstablishmentName,
    ),
    secondEstablishmentNumber: String(
      data.secondEstablishmentNumber ?? DEFAULT_PERMIT_DATA.secondEstablishmentNumber,
    ),
    customLogoDataUrl: String(data.customLogoDataUrl ?? ''),
    platformTitle: String(data.platformTitle ?? DEFAULT_PERMIT_DATA.platformTitle),
    platformSubtitle: String(data.platformSubtitle ?? DEFAULT_PERMIT_DATA.platformSubtitle),
  });
}

export const FirebasePermitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permit, setPermit] = useState<PermitData>(DEFAULT_PERMIT_DATA);
  const [loadingPermit, setLoadingPermit] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void testConnection();
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      setUser(currentUser);
      setAuthReady(true);
      setAuthError(null);

      if (!currentUser) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      if (!currentUser.emailVerified) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      if (currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return;
      }

      setCheckingAdmin(true);
      const adminDocPath = `admins/${currentUser.uid}`;
      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        if (active) {
          setIsAdmin(adminSnap.exists());
        }
      } catch (error) {
        if (active) {
          setIsAdmin(false);
        }
        handleFirestoreError(error, OperationType.GET, adminDocPath);
      } finally {
        if (active) {
          setCheckingAdmin(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    const permitPath = `permits/${DEFAULT_PERMIT_DOC_ID}`;
    const permitRef = doc(db, 'permits', DEFAULT_PERMIT_DOC_ID);

    if (!user) {
      const loadPublicPermit = async () => {
        setLoadingPermit(true);
        try {
          const snap = await getDoc(permitRef);
          if (!active) return;
          if (snap.exists()) {
            const raw = snap.data() as Record<string, unknown>;
            setPermit(mapDocToPermitData(raw));
            setLastSyncedAt(new Date().toLocaleTimeString('ar-SA'));
          } else {
            setPermit(DEFAULT_PERMIT_DATA);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, permitPath);
        } finally {
          if (active) {
            setLoadingPermit(false);
          }
        }
      };
      void loadPublicPermit();
      return () => {
        active = false;
      };
    }

    const unsubscribe = onSnapshot(
      permitRef,
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          const raw = snap.data() as Record<string, unknown>;
          setPermit(mapDocToPermitData(raw));
          setLastSyncedAt(new Date().toLocaleTimeString('ar-SA'));
        } else {
          setPermit(DEFAULT_PERMIT_DATA);
        }
        setLoadingPermit(false);
      },
      (error) => {
        if (active) {
          setLoadingPermit(false);
        }
        handleFirestoreError(error, OperationType.GET, permitPath);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authReady, user]);

  const savePermitData = useCallback(
    async (nextData: PermitData) => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول بحساب مشرف معتمد للحفظ.');
      }
      setSaving(true);
      const permitPath = `permits/${DEFAULT_PERMIT_DOC_ID}`;
      try {
        const sanitized = sanitizePermitPayload(nextData);
        await setDoc(doc(db, 'permits', DEFAULT_PERMIT_DOC_ID), {
          ...sanitized,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
        setPermit(sanitized);
        setLastSyncedAt(new Date().toLocaleTimeString('ar-SA'));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, permitPath);
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const resetToDefaultPermit = useCallback(async () => {
    await savePermitData(DEFAULT_PERMIT_DATA);
  }, [savePermitData]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'تعذّر تسجيل الدخول بحساب Google.';
      setAuthError(msg);
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const submitSupportInquiry = useCallback(
    async (serviceTopic: string, message: string): Promise<boolean> => {
      const cleanMessage = message.trim().slice(0, 1000);
      const cleanTopic = serviceTopic.trim().slice(0, 120) || 'استفسار عام';
      if (!cleanMessage) return false;

      if (!user || !user.emailVerified) {
        return false;
      }

      const path = 'supportInquiries';
      try {
        await addDoc(collection(db, 'supportInquiries'), {
          userId: user.uid,
          serviceTopic: cleanTopic,
          message: cleanMessage,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [user],
  );

  return (
    <FirebasePermitContext.Provider
      value={{
        permit,
        loadingPermit,
        lastSyncedAt,
        user,
        authReady,
        isAdmin,
        checkingAdmin,
        saving,
        authError,
        savePermitData,
        resetToDefaultPermit,
        signInWithGoogle,
        signOutUser,
        submitSupportInquiry,
      }}
    >
      {children}
    </FirebasePermitContext.Provider>
  );
};

export function useFirebasePermit(): FirebasePermitContextValue {
  const ctx = useContext(FirebasePermitContext);
  if (!ctx) {
    throw new Error('useFirebasePermit must be used inside FirebasePermitProvider');
  }
  return ctx;
}
