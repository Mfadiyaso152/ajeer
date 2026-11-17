import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  Lock,
  LogIn,
  LogOut,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useFirebasePermit } from '../context/FirebasePermitContext';
import { DEFAULT_HEADER_LOGO, DEFAULT_PERMIT_DATA } from '../data/defaultPermit';
import { PERMIT_FIELD_LIMITS, PermitData } from '../types/permit';
import { PermitDocumentView } from './PermitDocumentView';

interface AdminDashboardPanelProps {
  onBackToView: () => void;
}

const STATUS_PRESETS = [
  'ساري / فعال',
  'موقوف مؤقتاً',
  'منتهي الصلاحية',
];

async function compressLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذّر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح.'));
      img.onload = () => {
        const maxDim = 280;
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

export const AdminDashboardPanel: React.FC<AdminDashboardPanelProps> = ({ onBackToView }) => {
  const {
    permit,
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
  } = useFirebasePermit();

  const [draft, setDraft] = useState<PermitData>(permit);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setDraft(permit);
  }, [permit]);

  const updateField = <K extends keyof PermitData>(key: K, value: PermitData[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (feedback) setFeedback(null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await savePermitData(draft);
      setFeedback({
        type: 'success',
        text: 'تم حفظ التعديلات ومزامنتها سحابياً في قاعدة البيانات بنجاح.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'تعذّر حفظ التعديلات.',
      });
    }
  };

  const handleReset = async () => {
    setFeedback(null);
    try {
      await resetToDefaultPermit();
      setDraft(DEFAULT_PERMIT_DATA);
      setFeedback({
        type: 'success',
        text: 'تمت استعادة البيانات الافتراضية وحفظها في قاعدة البيانات.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'تعذّر إعادة التعيين.',
      });
    }
  };

  if (!authReady || checkingAdmin) {
    return (
      <div className="max-w-lg mx-auto my-8 border border-gray-200 rounded-xl p-8 text-center bg-white">
        <p className="text-sm text-gray-600 font-medium">جاري التحقق من حالة الحساب والصلاحيات...</p>
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
          <h2 className="text-xl font-bold text-gray-950">لوحة التحكم المحمية</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            تعديل بيانات التصريح والعامل والمنشأتين والشعار محمي عبر نظام الحسابات السحابي
            (Firebase Authentication). يرجى تسجيل الدخول بحساب المشرف المعتمد للمتابعة.
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {authError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B2240] hover:bg-[#14345c] text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>تسجيل الدخول بحساب Google</span>
          </button>
          <button
            type="button"
            onClick={onBackToView}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            العودة لعرض التصريح
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-8 border border-gray-200 rounded-xl p-6 sm:p-8 bg-white space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-950">صلاحية التعديل غير متوفرة</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            تم تسجيل الدخول بالحساب{' '}
            <span dir="ltr" className="font-semibold text-gray-900">
              {user.email}
            </span>
            ، ولكنه غير مدرج ضمن قائمة المشرفين المصرح لهم بتعديل بيانات التصريح.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
          <button
            type="button"
            onClick={onBackToView}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            العودة لعرض التصريح
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
      {/* Top Admin Status Bar */}
      <div className="border border-gray-200 rounded-xl bg-[#f8f9fa] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-950">
            لوحة التحكم وإدارة البيانات السحابية
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            الحساب النشط:{' '}
            <span dir="ltr" className="font-semibold text-gray-900">
              {user.email}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToView}
            className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            عرض صفحة التصريح
          </button>
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

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          {/* Logo & Header Identity */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-950">الشعار وعنوان النموذج</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-32 h-20 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden">
                  <img
                    src={draft.customLogoDataUrl || DEFAULT_HEADER_LOGO}
                    alt="معاينة الشعار"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-semibold transition-colors">
                    <ImagePlus className="w-4 h-4" aria-hidden="true" />
                    <span>{uploadingLogo ? 'جاري الضغط...' : 'رفع شعار مخصص'}</span>
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
                      <span>استعادة الشعار الافتراضي</span>
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

          {/* Permit Details */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-950">بيانات التصريح</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="permitNumber" className={labelClass}>
                  رقم التصريح
                </label>
                <input
                  id="permitNumber"
                  type="text"
                  required
                  maxLength={PERMIT_FIELD_LIMITS.permitNumber}
                  value={draft.permitNumber}
                  onChange={(e) => updateField('permitNumber', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="permitType" className={labelClass}>
                  نوع التصريح
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
                <label htmlFor="startDate" className={labelClass}>
                  تاريخ بداية التصريح
                </label>
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
                  تاريخ نهاية التصريح
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
                  حالة التصريح
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
              <h3 className="text-sm font-bold text-gray-950">بيانات العامل</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workerName" className={labelClass}>
                  اسم العامل
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
                  رقم الهوية / الإقامة
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
                  الجنسية
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
                  المهنة
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
                  الجنس
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
                  تاريخ الميلاد
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

          {/* Establishments */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="bg-[#f4f5f7] px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-950">بيانات المنشأتين</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstEstablishmentName" className={labelClass}>
                  اسم المنشأة الأولى
                </label>
                <input
                  id="firstEstablishmentName"
                  type="text"
                  required
                  maxLength={PERMIT_FIELD_LIMITS.firstEstablishmentName}
                  value={draft.firstEstablishmentName}
                  onChange={(e) => updateField('firstEstablishmentName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="firstEstablishmentNumber" className={labelClass}>
                  رقم المنشأة الأولى
                </label>
                <input
                  id="firstEstablishmentNumber"
                  type="text"
                  dir="ltr"
                  required
                  maxLength={PERMIT_FIELD_LIMITS.firstEstablishmentNumber}
                  value={draft.firstEstablishmentNumber}
                  onChange={(e) => updateField('firstEstablishmentNumber', e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="secondEstablishmentName" className={labelClass}>
                  اسم المنشأة الثانية
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
                  رقم المنشأة الثانية
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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B2240] hover:bg-[#14345c] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات في السحابة'}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleReset()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 text-sm font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>استعادة البيانات الافتراضية</span>
            </button>
          </div>
        </form>

        {/* Live Preview Column (Desktop) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20 space-y-2">
          <div className="text-xs font-bold text-gray-500 px-1">معاينة فورية للتعديلات</div>
          <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-xs">
            <PermitDocumentView permit={draft} loading={false} />
          </div>
        </aside>
      </div>
    </div>
  );
};
