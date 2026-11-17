import React, { useState } from 'react';
import { Mail, Phone, X } from 'lucide-react';
import { DEFAULT_FOOTER_EMBLEM } from '../data/defaultPermit';

type FooterModalKey =
  | 'about'
  | 'services'
  | 'support'
  | 'faq'
  | 'terms'
  | 'privacy'
  | 'contact'
  | null;

interface ModalContent {
  title: string;
  body: string[];
}

const MODAL_CONTENT: Record<Exclude<FooterModalKey, null>, ModalContent> = {
  about: {
    title: 'عن منصة ميثاق',
    body: [
      'منصة ميثاق هي بوابة رقمية متخصصة في عرض وإدارة بيانات تصاريح العمل والربط بين المنشآت بأسلوب منظم وميسر.',
      'تتيح المنصة استعراض تفاصيل التصريح والعامل وبيانات المنشآت المرتبطة بوضوح عبر الجوال والحاسوب.',
    ],
  },
  services: {
    title: 'خدمات ميثاق',
    body: [
      'عرض بيانات التصاريح الإلكترونية، مراجعة تفاصيل العامل والمنشآت، نسخ الأرقام المرجعية، وتصدير المستندات للطباعة بصيغة PDF.',
      'توفير لوحة تحكم سحابية محمية لإدارة البيانات والشعار وتحديثها فورياً.',
    ],
  },
  support: {
    title: 'الدعم والمساعدة',
    body: [
      'للحصول على المساعدة الفورية حول التصاريح والخدمات، يمكنك استخدام أيقونة المساعد الافتراضي الخضراء أسفل يسار الصفحة.',
      'فريق الدعم الفني جاهز للإجابة عن الاستفسارات المتعلقة بالمنصة وطباعة المستندات.',
    ],
  },
  faq: {
    title: 'الأسئلة الشائعة',
    body: [
      'س: كيف يمكنني حفظ نسخة PDF من بيانات التصريح؟\nج: يمكنك استخدام زر الطباعة أسفل يمين الشاشة أو خيار الطباعة من المتصفح ثم اختيار حفظ كـ PDF.',
      'س: كيف يمكن تعديل البيانات أو الشعار؟\nج: عبر الدخول إلى لوحة التحكم المحمية وتسجيل الدخول بحساب المشرف المصرح له.',
    ],
  },
  terms: {
    title: 'الشروط والأحكام',
    body: [
      'تخضع جميع العمليات والبيانات المعروضة عبر منصة ميثاق لضوابط الاستخدام الم المعتمدة داخل المؤسسة.',
      'يلتزم المستخدم بالمحافظة على سرية بيانات الدخول وعدم استخدام المنصة في غير الأغراض المخصصة لها.',
    ],
  },
  privacy: {
    title: 'سياسة الخصوصية',
    body: [
      'تلتزم منصة ميثاق بحماية سرية وخصوصية بيانات المنشآت والعاملين وتخزينها في بيئة سحابية محمية.',
      'تقتصر صلاحية التعديل والإدارة على الحسابات المخولة فقط وفق قواعد الأمان المعتمدة.',
    ],
  },
  contact: {
    title: 'تواصل معنا',
    body: [
      'البريد الإلكتروني: support@mithaq-portal.example',
      'الهاتف الموحد: 920000000',
      'كما يمكنك التواصل مباشرة عبر المساعد الافتراضي أسفل يسار الصفحة.',
    ],
  },
};

export const FooterSection: React.FC = () => {
  const [activeModal, setActiveModal] = useState<FooterModalKey>(null);
  const [emblemError, setEmblemError] = useState(false);

  const linkClass =
    'block py-1 text-[15px] text-[#7c828d] hover:text-[#111827] transition-colors text-right focus-visible:outline-none focus-visible:underline';

  return (
    <footer className="mt-4 border-t border-[#e5e7eb] bg-white pt-7 pb-6">
      <div className="px-5 space-y-6 text-right">
        {/* Group 1: Platform */}
        <div>
          <h3 className="text-[17px] font-bold text-[#111827] mb-2">مِيثاق</h3>
          <nav aria-label="عن المنصة" className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className={linkClass}
            >
              عن مِيثاق
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('services')}
              className={linkClass}
            >
              خدمات مِيثاق
            </button>
          </nav>
        </div>

        {/* Group 2: Support */}
        <div>
          <h3 className="text-[17px] font-bold text-[#111827] mb-2">الدعم</h3>
          <nav aria-label="الدعم" className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveModal('support')}
              className={linkClass}
            >
              الدعم والمساعدة
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('faq')}
              className={linkClass}
            >
              الأسئلة الشائعة
            </button>
          </nav>
        </div>

        {/* Group 3: Terms & Privacy */}
        <div>
          <h3 className="text-[17px] font-bold text-[#111827] mb-2">الشروط والخصوصية</h3>
          <nav aria-label="الشروط والخصوصية" className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className={linkClass}
            >
              الشروط والأحكام
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className={linkClass}
            >
              سياسة الخصوصية
            </button>
          </nav>
        </div>

        {/* Group 4: Contact Us */}
        <div>
          <h3 className="text-[17px] font-bold text-[#111827] mb-3">تواصل معنا</h3>
          <div className="flex items-center justify-end gap-5 text-[#0B2240]">
            <button
              type="button"
              onClick={() => setActiveModal('contact')}
              aria-label="الاتصال الهاتفي"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('contact')}
              aria-label="البريد الإلكتروني"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('contact')}
              aria-label="منصة X"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
            >
              𝕏
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Partner Emblem Area (matching Image 3) */}
      <div className="mt-7 pt-6 pb-4 border-t border-[#e5e7eb] flex flex-col items-center justify-center text-center gap-1.5">
        <span className="text-[11px] text-gray-400">تطوير وتشغيل</span>
        <div className="flex items-center justify-center gap-2.5">
          {!emblemError ? (
            <img
              src={DEFAULT_FOOTER_EMBLEM}
              alt="ميثاق للحلول الرقمية"
              referrerPolicy="no-referrer"
              onError={() => setEmblemError(true)}
              className="h-12 w-auto object-contain"
            />
          ) : null}
          <span className="text-base font-bold text-[#0B2240]">مِيثاق للحلول الرقمية</span>
        </div>
      </div>

      {/* Footer Info Modal */}
      {activeModal && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-modal-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h4 id="footer-modal-title" className="text-base font-bold text-gray-950">
                {MODAL_CONTENT[activeModal].title}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="إغلاق النافذة"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {MODAL_CONTENT[activeModal].body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#0B2240] text-white text-sm font-semibold rounded-lg hover:bg-[#13325c] transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
