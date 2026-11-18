import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImagePlus,
  List,
  Lock,
  LogIn,
  LogOut,
  Pencil,
  PlusCircle,
  Save,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useFirebasePermit } from '../context/FirebasePermitContext';
import { DEFAULT_PERMIT_DATA } from '../data/defaultPermit';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/firebase';
import {
  PERMIT_DATE_PATTERN,
  PERMIT_FIELD_LIMITS,
  PermitData,
  isValidPermitSlug,
} from '../types/permit';
import { MockPlatformLogo } from './MockLogos';
import { PermitDocumentView } from './PermitDocumentView';

interface AdminDashboardPanelProps {
  onNavigate: (path: string) => void;
}

const EMPTY_NEW_PERMIT: PermitData = {
  permitNumber: '',
  permitType: '',
  startDate: '',
  endDate: '',
  verificationStatus: 'ساري / فعال',
  workerName: '',
  workerIdNumber: '',
  nationality: '',
  occupation: '',
  gender: 'ذكر',
  birthDate: '',
  firstEstablishmentName: '',
  firstEstablishmentNumber: '',
  secondEstablishmentName: '',
  secondEstablishmentNumber: '',
  customLogoDataUrl: '',
  platformTitle: 'التحقق من تصريح أجير',
  platformSubtitle: 'تم التحقق من التصريح بنجاح.',
};

const STATUS_PRESETS = ['ساري / فعال', 'موقوف مؤقتاً', 'منتهي الصلاحية'];
const LAST_DATES_STORAGE_KEY = 'ajeer_admin_last_dates';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadLastDates(): { startDate: string; endDate: string } {
  try {
    const raw = window.localStorage.getItem(LAST_DATES_STORAGE_KEY);
    if (!raw) return { startDate: '', endDate: '' };
    const parsed = JSON.parse(raw) as { startDate?: unknown; endDate?: unknown };
    return {
      startDate:
        typeof parsed.startDate === 'string' && PERMIT_DATE_PATTERN.test(parsed.startDate)
          ? parsed.startDate
          : '',
      endDate:
        typeof parsed.endDate === 'string' && PERMIT_DATE_PATTERN.test(parsed.endDate)
          ? parsed.endDate
          : '',
    };
  } catch {
    return { startDate: '', endDate: '' };
  }
}

function saveLastDates(startDate: string, endDate: string): void {
  try {
    const current = loadLastDates();
    const next = {
      startDate: PERMIT_DATE_PATTERN.test(startDate) ? startDate : current.startDate,
      endDate: PERMIT_DATE_PATTERN.test(endDate) ? endDate : current.endDate,
    };
    window.localStorage.setItem(LAST_DATES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage access errors
  }
}

async function compressLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذّر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح.'));
      img.onload = () => {
        const maxDim = 320;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذّر تجهيز معالج الصور.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', 0.82);
        if (dataUrl.length > PERMIT_FIELD_LIMITS.customLogoDataUrl) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        }
        if (dataUrl.length > PERMIT_FIELD_LIMITS.customLogoDataUrl) {
          reject(new Error('حجم الشعار بعد الضغط لا يزال أكبر من الحد المسموح.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const AdminDashboardPanel: React.FC<AdminDashboardPanelProps> = ({ onNavigate }) => {
  const {
    allPermits,
    loadingPermitsList,
    user,
    authReady,
    isAdmin,
    saving,
    authError,
    createPermitWithPermitNumber,
    updatePermitById,
    deletePermitById,
    signInWithGoogle,
    signOutUser,
  } = useFirebasePermit();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string>(DEFAULT_PERMIT_DATA.permitNumber);
  const [draft, setDraft] = useState<PermitData>(DEFAULT_PERMIT_DATA);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredPermits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = query
      ? allPermits.filter((item) => {
          const d = item.data;
          return (
            d.workerName.toLowerCase().includes(query) ||
            d.permitNumber.toLowerCase().includes(query) ||
            d.workerIdNumber.toLowerCase().includes(query) ||
            d.secondEstablishmentName.toLowerCase().includes(query)
          );
        })
      : [...allPermits];

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.data.workerName.localeCompare(b.data.workerName, 'ar');
      }
      if (sortBy === 'oldest') {
        return a.updatedAtMs - b.updatedAtMs;
      }
      return b.updatedAtMs - a.updatedAtMs;
    });

    return list;
  }, [allPermits, searchQuery, sortBy]);

  const sortLabel =
    sortBy === 'newest'
      ? 'الأحدث إضافة'
      : sortBy === 'oldest'
        ? 'الأقدم إضافة'
        : 'حسب الاسم (أ - ي)';

  useEffect(() => {
    if (mode === 'edit') {
      const target = allPermits.find((p) => p.id === editingId);
      if (target) {
        setDraft(target.data);
      }
    }
  }, [allPermits, editingId, mode]);

  const SITE_BASE_URL = 'https://ajeer-qewa-sa.icu';

  const getFullPermitUrl = (slug: string): string => {
    return `${SITE_BASE_URL}/${slug}`;
  };

  const handleCopyUrl = async (slug: string) => {
    const url = getFullPermitUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(slug);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const updateField = <K extends keyof PermitData>(key: K, value: PermitData[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'startDate' || key === 'endDate') {
        saveLastDates(next.startDate, next.endDate);
      }
      return next;
    });
    if (feedback) setFeedback(null);
  };

  const handleOpenCreate = () => {
    const lastDates = loadLastDates();
    setDraft({
      ...EMPTY_NEW_PERMIT,
      startDate: lastDates.startDate,
      endDate: lastDates.endDate,
    });
    setCreatedSlug(null);
    setFeedback(null);
    setMode('create');
  };

  const handleOpenEdit = (permitId: string, data: PermitData) => {
    setEditingId(permitId);
    setDraft({ ...data });
    setCreatedSlug(null);
    setFeedback(null);
    setMode('edit');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setFeedback(null);
    try {
      const compressed = await compressLogoFile(file);
      updateField('customLogoDataUrl', compressed);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'تعذّر معالجة الشعار.',
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const trimmedPermitNumber = draft.permitNumber.trim();
  const isDuplicatePermitNumber =
    Boolean(trimmedPermitNumber) &&
    allPermits.some(
      (item) =>
        (mode === 'create' || item.id !== editingId) &&
        (item.id.toLowerCase() === trimmedPermitNumber.toLowerCase() ||
          item.data.permitNumber.trim().toLowerCase() === trimmedPermitNumber.toLowerCase()),
    );

  const validateRequiredFields = (data: PermitData): string | null => {
    const cleanPermitNumber = data.permitNumber.trim();
    if (!cleanPermitNumber) return 'يرجى إدخال رقم التصريح (حقل إجباري).';
    if (!isValidPermitSlug(cleanPermitNumber)) {
      return 'رقم التصريح يجب أن يتكون من أحرف إنجليزية وأرقام أو (- / _) فقط بدون مسافات لأنه يُستخدم كرابط للصفحة.';
    }
    const duplicateExists = allPermits.some(
      (item) =>
        (mode === 'create' || item.id !== editingId) &&
        (item.id.toLowerCase() === cleanPermitNumber.toLowerCase() ||
          item.data.permitNumber.trim().toLowerCase() === cleanPermitNumber.toLowerCase()),
    );
    if (duplicateExists) {
      return `تنبيه: رقم التصريح "${cleanPermitNumber}" مسجل مسبقاً! يرجى إدخال رقم تصريح جديد غير مكرر.`;
    }
    if (!data.permitType.trim()) return 'يرجى إدخال نوع التصريح.';
    if (!data.startDate.trim()) return 'يرجى إدخال تاريخ بداية التصريح.';
    if (!data.endDate.trim()) return 'يرجى إدخال تاريخ نهاية التصريح.';
    if (!data.workerName.trim()) return 'يرجى إدخال اسم العامل.';
    if (!data.workerIdNumber.trim()) return 'يرجى إدخال رقم الهوية / الإقامة.';
    if (!data.nationality.trim()) return 'يرجى إدخال الجنسية.';
    if (!data.occupation.trim()) return 'يرجى إدخال المهنة.';
    if (!data.birthDate.trim()) return 'يرجى إدخال تاريخ الميلاد.';
    if (!data.secondEstablishmentName.trim()) return 'يرجى إدخال اسم المنشأة.';
    if (!data.secondEstablishmentNumber.trim()) return 'يرجى إدخال رقم المنشأة.';
    return null;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const validationError = validateRequiredFields(draft);
    if (validationError) {
      setFeedback({ type: 'error', text: validationError });
      return;
    }

    const payload: PermitData = {
      ...draft,
      firstEstablishmentName:
        draft.firstEstablishmentName.trim() || draft.secondEstablishmentName.trim(),
      firstEstablishmentNumber:
        draft.firstEstablishmentNumber.trim() || draft.secondEstablishmentNumber.trim(),
    };

    try {
      saveLastDates(payload.startDate, payload.endDate);
      if (mode === 'create') {
        const slug = await createPermitWithPermitNumber(payload);
        setCreatedSlug(slug);
        setEditingId(slug);
        setFeedback({
          type: 'success',
          text: 'تم إضافة التصريح الجديد وإنشاء رابط الصفحة بنفس رقم التصريح بنجاح.',
        });
      } else {
        const updatedSlug = await updatePermitById(editingId, payload);
        setEditingId(updatedSlug);
        setCreatedSlug(updatedSlug);
        setFeedback({
          type: 'success',
          text: 'تم تعديل وحفظ بيانات التصريح بنجاح.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'تعذّر حفظ التصريح.',
      });
    }
  };

  const handleDeletePermit = async (permitId: string) => {
    setFeedback(null);
    try {
      await deletePermitById(permitId);
      setConfirmDeleteId(null);
      setFeedback({ type: 'success', text: 'تم حذف التصريح بنجاح.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'تعذّر حذف التصريح.',
      });
    }
  };

  if (!authReady) {
    return (
      <div className="max-w-lg mx-auto my-8 border border-gray-200 rounded-xl p-8 text-center bg-white">
        <p className="text-sm text-gray-600 font-medium">جاري التحقق من حالة الحساب...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-8 border border-gray-200 rounded-xl p-6 sm:p-8 bg-white space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-950">لوحة الإدارة</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            يلزم تسجيل الدخول بواسطة حساب Google المصرح به لإضافة وتعديل التصاريح.
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {authError}
          </div>
        )}

        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B2240] hover:bg-[#14345c] text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>تسجيل الدخول بحساب Google</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-8 border border-gray-200 rounded-xl p-6 sm:p-8 bg-white space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-950">غير مصرح بالدخول</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            الحساب{' '}
            <span dir="ltr" className="font-semibold text-gray-900">
              {user.email}
            </span>{' '}
            غير مصرح له بإدارة التصاريح. الدخول الوحيد المصرح به هو:{' '}
            <span dir="ltr" className="font-semibold text-gray-900">
              {BOOTSTRAPPED_ADMIN_EMAIL}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0B2240] focus:outline-none';
  const labelClass = 'block text-xs font-semibold text-gray-700 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Top Admin Bar */}
      <div className="border border-gray-200 rounded-xl bg-[#f8f9fa] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-950">
            لوحة إدارة التصاريح
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            المشرف المعتمد:{' '}
            <span dir="ltr" className="font-semibold text-gray-900">
              {user.email}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setMode('list');
            setCreatedSlug(null);
            setFeedback(null);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'list'
              ? 'bg-[#0B2240] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <List className="w-4 h-4" aria-hidden="true" />
          <span>جميع التصاريح ({allPermits.length})</span>
        </button>

        <button
          type="button"
          onClick={handleOpenCreate}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'create'
              ? 'bg-[#1e7a43] text-white'
              : 'bg-emerald-50 text-[#1e7a43] border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>إضافة تصريح جديد</span>
        </button>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Newly Created Permit Full Link Card */}
      {createdSlug && (
        <div className="border-2 border-emerald-500 rounded-xl bg-emerald-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-emerald-950">
              رابط التصريح الجديد جاهز للمشاركة:
            </h3>
            <span className="text-xs font-semibold text-emerald-800" dir="ltr">
              /{createdSlug}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={getFullPermitUrl(createdSlug)}
              className="flex-1 bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-gray-900"
            />
            <button
              type="button"
              onClick={() => void handleCopyUrl(createdSlug)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#1e7a43] hover:bg-[#166034] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              {copiedId === createdSlug ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>نسخ الرابط بالكامل</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate(`/${createdSlug}`)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B2240] hover:bg-[#13325c] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>فتح التصريح</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'list' ? (
        /* Permits List View */
        <div className="space-y-3">
          {loadingPermitsList ? (
            <div className="border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
              جاري تحميل التصاريح...
            </div>
          ) : allPermits.length === 0 ? (
            <div className="border border-gray-200 rounded-xl p-8 text-center space-y-3 bg-white">
              <p className="text-sm text-gray-600">لا توجد تصاريح مضافة حتى الآن.</p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e7a43] text-white text-sm font-semibold"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>إضافة أول تصريح</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar & Filter/Sort Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، رقم التصريح، الهوية، أو المنشأة..."
                    aria-label="بحث في التصاريح"
                    className="w-full rounded-lg border border-gray-300 bg-white pr-9 pl-9 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B2240] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="مسح البحث"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div ref={filterMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterMenuOpen((prev) => !prev)}
                    aria-expanded={filterMenuOpen}
                    aria-haspopup="menu"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#0B2240]" aria-hidden="true" />
                    <span>فلترة: {sortLabel}</span>
                  </button>

                  {filterMenuOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 sm:left-0 mt-1.5 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-1.5 z-30"
                    >
                      {(
                        [
                          { id: 'newest', label: 'الأحدث إضافة' },
                          { id: 'oldest', label: 'الأقدم إضافة' },
                          { id: 'name', label: 'حسب الاسم (أ - ي)' },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={sortBy === option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setFilterMenuOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-right text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === option.id
                              ? 'bg-slate-100 text-[#0B2240]'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.id && (
                            <Check className="w-3.5 h-3.5 text-[#1e7a43]" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {filteredPermits.length === 0 ? (
                <div className="border border-gray-200 rounded-xl p-8 text-center space-y-3 bg-white">
                  <p className="text-sm text-gray-600">
                    لا توجد تصاريح مطابقة لـ «{searchQuery}».
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    عرض جميع التصاريح
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPermits.map((item) => {
                    const fullUrl = getFullPermitUrl(item.id);
                    const isPrimary = item.id === DEFAULT_PERMIT_DATA.permitNumber;
                    const addedDateLabel =
                      item.updatedAtMs > 0
                        ? new Date(item.updatedAtMs).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-xl bg-white p-4 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
                                <span>{item.data.workerName}</span>
                                {isPrimary && (
                                  <span className="text-[11px] font-semibold text-[#0B2240] bg-slate-100 px-2 py-0.5 rounded">
                                    التصريح الأساسي
                                  </span>
                                )}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                رقم الهوية:{' '}
                                <span dir="ltr" className="font-semibold text-gray-800 tabular-nums">
                                  {item.data.workerIdNumber}
                                </span>
                                {' · '}
                                رقم التصريح:{' '}
                                <span className="font-semibold text-gray-800">
                                  {item.data.permitNumber}
                                </span>
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-[#1e7a43]">
                              {item.data.verificationStatus}
                            </span>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1 pt-1">
                            <div>المنشأة: {item.data.secondEstablishmentName}</div>
                            {addedDateLabel && (
                              <div className="text-[11px] text-gray-400">
                                تاريخ الإضافة: {addedDateLabel}
                              </div>
                            )}
                          </div>

                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">
                          رابط التصريح:
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            dir="ltr"
                            value={fullUrl}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs font-mono text-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => void handleCopyUrl(item.id)}
                            title="نسخ الرابط"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shrink-0"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#1e7a43]" aria-hidden="true" />
                                <span>نُسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item.id, item.data)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2240] hover:bg-[#13325c] text-white text-xs font-semibold transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate(`/${item.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>عرض</span>
                        </button>
                      </div>

                      <div>
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void handleDeletePermit(item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Create OR Edit Permit Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleSubmitForm} className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <h3 className="text-sm font-bold text-gray-950">
                {mode === 'create'
                  ? 'إضافة تصريح جديد (يرجى تعبئة جميع البيانات المطلوبة)'
                  : `تعديل بيانات التصريح (/${editingId})`}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setFeedback(null);
                  }}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  العودة للقائمة
                </button>
              </div>
            </div>

            {/* Permit Details */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-950">بيانات التصريح</h4>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="permitNumber" className={labelClass}>
                    رقم التصريح (إجباري — يُستخدم كرابط للصفحة) *
                  </label>
                  <input
                    id="permitNumber"
                    type="text"
                    dir="ltr"
                    required
                    pattern="[A-Za-z0-9_-]+"
                    title="أحرف إنجليزية وأرقام أو (- / _) فقط بدون مسافات"
                    maxLength={PERMIT_FIELD_LIMITS.permitNumber}
                    value={draft.permitNumber}
                    onChange={(e) => updateField('permitNumber', e.target.value)}
                    className={`${inputClass} tabular-nums ${
                      isDuplicatePermitNumber ? 'border-red-500 bg-red-50/40 focus:border-red-600' : ''
                    }`}
                  />
                  {isDuplicatePermitNumber ? (
                    <div
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        تنبيه: رقم التصريح «{trimmedPermitNumber}» مسجل مسبقاً، يرجى كتابة رقم آخر.
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-gray-500">
                      رابط الصفحة:{' '}
                      <span dir="ltr" className="font-mono font-semibold text-gray-700 break-all">
                        {SITE_BASE_URL}/{trimmedPermitNumber || '...'}
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="permitType" className={labelClass}>
                    نوع التصريح *
                  </label>
                  <input
                    id="permitType"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.permitType}
                    value={draft.permitType}
                    onChange={(e) => updateField('permitType', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="startDate" className="text-xs font-semibold text-gray-700">
                      تاريخ بداية التصريح *
                    </label>
                    <button
                      type="button"
                      onClick={() => updateField('startDate', getTodayDateString())}
                      className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-[#1e7a43] hover:bg-emerald-100 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      تاريخ اليوم
                    </button>
                  </div>
                  <input
                    id="startDate"
                    type="date"
                    dir="ltr"
                    required
                    value={draft.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className={labelClass}>
                    تاريخ نهاية التصريح *
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    dir="ltr"
                    required
                    value={draft.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label htmlFor="verificationStatus" className={labelClass}>
                    حالة التصريح *
                  </label>
                  <input
                    id="verificationStatus"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.verificationStatus}
                    value={draft.verificationStatus}
                    onChange={(e) => updateField('verificationStatus', e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STATUS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateField('verificationStatus', preset)}
                        className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                          draft.verificationStatus === preset
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Worker Details */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-950">بيانات العامل</h4>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="workerName" className={labelClass}>
                    اسم العامل *
                  </label>
                  <input
                    id="workerName"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.workerName}
                    value={draft.workerName}
                    onChange={(e) => updateField('workerName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="workerIdNumber" className={labelClass}>
                    رقم الهوية / الإقامة *
                  </label>
                  <input
                    id="workerIdNumber"
                    type="text"
                    dir="ltr"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.workerIdNumber}
                    value={draft.workerIdNumber}
                    onChange={(e) => updateField('workerIdNumber', e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label htmlFor="nationality" className={labelClass}>
                    الجنسية *
                  </label>
                  <input
                    id="nationality"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.nationality}
                    value={draft.nationality}
                    onChange={(e) => updateField('nationality', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="occupation" className={labelClass}>
                    المهنة *
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.occupation}
                    value={draft.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className={labelClass}>
                    الجنس *
                  </label>
                  <select
                    id="gender"
                    value={draft.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className={inputClass}
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="birthDate" className={labelClass}>
                    تاريخ الميلاد *
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    dir="ltr"
                    required
                    value={draft.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
            </div>

            {/* Single Establishment (Second Establishment) */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-950">بيانات المنشأة</h4>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="secondEstablishmentName" className={labelClass}>
                    اسم المنشأة *
                  </label>
                  <input
                    id="secondEstablishmentName"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.secondEstablishmentName}
                    value={draft.secondEstablishmentName}
                    onChange={(e) => updateField('secondEstablishmentName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="secondEstablishmentNumber" className={labelClass}>
                    رقم المنشأة *
                  </label>
                  <input
                    id="secondEstablishmentNumber"
                    type="text"
                    dir="ltr"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.secondEstablishmentNumber}
                    value={draft.secondEstablishmentNumber}
                    onChange={(e) => updateField('secondEstablishmentNumber', e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
            </div>

            {/* Logo & Header Texts */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-950">العنوان والشعار</h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-36 h-20 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden">
                    {draft.customLogoDataUrl ? (
                      <img
                        src={draft.customLogoDataUrl}
                        alt="معاينة الشعار"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <MockPlatformLogo size="sm" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-semibold transition-colors">
                      <ImagePlus className="w-4 h-4" aria-hidden="true" />
                      <span>{uploadingLogo ? 'جاري الضغط...' : 'رفع شعار مخصص (اختياري)'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="sr-only"
                      />
                    </label>
                    {draft.customLogoDataUrl && (
                      <button
                        type="button"
                        onClick={() => updateField('customLogoDataUrl', '')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>استعادة الشعارات الافتراضية</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="platformTitle" className={labelClass}>
                    عنوان الصفحة
                  </label>
                  <input
                    id="platformTitle"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.platformTitle}
                    value={draft.platformTitle}
                    onChange={(e) => updateField('platformTitle', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="platformSubtitle" className={labelClass}>
                    العبارة التوضيحية أسفل الحالة
                  </label>
                  <input
                    id="platformSubtitle"
                    type="text"
                    required
                    maxLength={PERMIT_FIELD_LIMITS.platformSubtitle}
                    value={draft.platformSubtitle}
                    onChange={(e) => updateField('platformSubtitle', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e7a43] hover:bg-[#166034] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {mode === 'create' ? (
                  <>
                    <PlusCircle className="w-4 h-4" aria-hidden="true" />
                    <span>{saving ? 'جاري الإنشاء...' : 'إضافة التصريح وإنشاء الرابط'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setFeedback(null);
                }}
                className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>

          {/* Live Preview */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6 space-y-2">
            <div className="text-xs font-bold text-gray-500 px-1">معاينة فورية</div>
            <div className="border border-gray-200 rounded-xl p-2 bg-white shadow-xs">
              <PermitDocumentView permit={draft} loading={false} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
