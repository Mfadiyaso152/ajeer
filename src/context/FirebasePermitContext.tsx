import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
import { PermitData, isValidPermitSlug, sanitizePermitPayload } from '../types/permit';

export interface PermitListItem {
  id: string;
  data: PermitData;
}

interface FirebasePermitContextValue {
  permit: PermitData;
  allPermits: PermitListItem[];
  loadingPermitsList: boolean;
  loadingPermit: boolean;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  saving: boolean;
  authError: string | null;
  fetchPermitBySlug: (slug: string) => Promise<PermitData | null>;
  refreshAllPermits: () => Promise<void>;
  createPermitWithPermitNumber: (nextData: PermitData) => Promise<string>;
  updatePermitById: (permitId: string, nextData: PermitData) => Promise<string>;
  deletePermitById: (permitId: string) => Promise<void>;
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
  const [allPermits, setAllPermits] = useState<PermitListItem[]>([]);
  const [loadingPermitsList, setLoadingPermitsList] = useState<boolean>(false);
  const [loadingPermit, setLoadingPermit] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      setAuthError(null);

      if (
        currentUser &&
        currentUser.emailVerified &&
        currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL
      ) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setAllPermits([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load main default permit record
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
            setPermit(mapDocToPermitData(snap.data() as Record<string, unknown>));
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
          setPermit(mapDocToPermitData(snap.data() as Record<string, unknown>));
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

  const refreshAllPermits = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingPermitsList(true);
    try {
      const snap = await getDocs(collection(db, 'permits'));
      const items: PermitListItem[] = [];
      snap.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          data: mapDocToPermitData(docSnap.data() as Record<string, unknown>),
        });
      });
      setAllPermits(items);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'permits');
    } finally {
      setLoadingPermitsList(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void refreshAllPermits();
    }
  }, [isAdmin, refreshAllPermits]);

  const fetchPermitBySlug = useCallback(async (slug: string): Promise<PermitData | null> => {
    const cleanSlug = slug.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanSlug) || cleanSlug.length > 128) {
      return null;
    }
    const permitPath = `permits/${cleanSlug}`;
    try {
      const snap = await getDoc(doc(db, 'permits', cleanSlug));
      if (!snap.exists()) {
        return null;
      }
      return mapDocToPermitData(snap.data() as Record<string, unknown>);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, permitPath);
    }
  }, []);

  const createPermitWithPermitNumber = useCallback(
    async (nextData: PermitData): Promise<string> => {
      if (!user || user.email !== BOOTSTRAPPED_ADMIN_EMAIL) {
        throw new Error('الدخول والتعديل مصرح به فقط لحساب mfb.15.f@gmail.com.');
      }
      const slug = nextData.permitNumber.trim();
      if (!isValidPermitSlug(slug)) {
        throw new Error(
          'رقم التصريح إجباري ويجب أن يتكون من أحرف إنجليزية وأرقام أو (- / _) بدون مسافات.',
        );
      }

      setSaving(true);
      try {
        const permitPath = `permits/${slug}`;
        const existingSnap = await getDoc(doc(db, 'permits', slug));
        if (existingSnap.exists()) {
          throw new Error(
            'يوجد تصريح مسجل مسبقاً بنفس رقم التصريح هذا. يرجى إدخال رقم مختلف أو تعديل التصريح الموجود.',
          );
        }

        const sanitized = sanitizePermitPayload({ ...nextData, permitNumber: slug });
        try {
          await setDoc(doc(db, 'permits', slug), {
            ...sanitized,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, permitPath);
        }

        await refreshAllPermits();
        return slug;
      } finally {
        setSaving(false);
      }
    },
    [user, refreshAllPermits],
  );

  const updatePermitById = useCallback(
    async (permitId: string, nextData: PermitData): Promise<string> => {
      if (!user || user.email !== BOOTSTRAPPED_ADMIN_EMAIL) {
        throw new Error('الدخول والتعديل مصرح به فقط لحساب mfb.15.f@gmail.com.');
      }
      const nextSlug = nextData.permitNumber.trim();
      if (!isValidPermitSlug(nextSlug)) {
        throw new Error(
          'رقم التصريح إجباري ويجب أن يتكون من أحرف إنجليزية وأرقام أو (- / _) بدون مسافات.',
        );
      }

      setSaving(true);
      const targetPath = `permits/${nextSlug}`;
      try {
        const sanitized = sanitizePermitPayload({ ...nextData, permitNumber: nextSlug });
        if (nextSlug !== permitId) {
          const existingSnap = await getDoc(doc(db, 'permits', nextSlug));
          if (existingSnap.exists()) {
            throw new Error('يوجد تصريح آخر مسجل مسبقاً برقم التصريح الجديد.');
          }
          await setDoc(doc(db, 'permits', nextSlug), {
            ...sanitized,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          });
          if (permitId !== DEFAULT_PERMIT_DOC_ID) {
            await deleteDoc(doc(db, 'permits', permitId));
          }
        } else {
          await setDoc(doc(db, 'permits', permitId), {
            ...sanitized,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          });
        }

        if (nextSlug === DEFAULT_PERMIT_DOC_ID) {
          setPermit(sanitized);
        }
        await refreshAllPermits();
        return nextSlug;
      } catch (error) {
        if (error instanceof Error && error.message.includes('يوجد تصريح')) {
          throw error;
        }
        handleFirestoreError(error, OperationType.WRITE, targetPath);
      } finally {
        setSaving(false);
      }
    },
    [user, refreshAllPermits],
  );

  const deletePermitById = useCallback(
    async (permitId: string): Promise<void> => {
      if (!user || user.email !== BOOTSTRAPPED_ADMIN_EMAIL) {
        throw new Error('الدخول والتعديل مصرح به فقط لحساب mfb.15.f@gmail.com.');
      }
      if (permitId === DEFAULT_PERMIT_DOC_ID) {
        throw new Error('لا يمكن حذف التصريح الافتراضي الرئيسي.');
      }
      setSaving(true);
      const permitPath = `permits/${permitId}`;
      try {
        await deleteDoc(doc(db, 'permits', permitId));
        await refreshAllPermits();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, permitPath);
      } finally {
        setSaving(false);
      }
    },
    [user, refreshAllPermits],
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      let msg = error instanceof Error ? error.message : 'تعذّر تسجيل الدخول بحساب Google.';
      if (code === 'auth/unauthorized-domain') {
        msg = `هذا النطاق (${window.location.hostname}) غير مضاف ضمن النطاقات المصرح بها في Firebase Authentication.`;
      }
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
      if (!cleanMessage || !user || !user.emailVerified) {
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
        allPermits,
        loadingPermitsList,
        loadingPermit,
        user,
        authReady,
        isAdmin,
        saving,
        authError,
        fetchPermitBySlug,
        refreshAllPermits,
        createPermitWithPermitNumber,
        updatePermitById,
        deletePermitById,
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
