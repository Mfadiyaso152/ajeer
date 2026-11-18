import React from 'react';
import { Mail, Phone } from 'lucide-react';
import {
  MockOrganizationLogo,
  MockRegistryLogo,
  MockSolutionsLogo,
  MockTechLogo,
} from './MockLogos';

export const FooterSection: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const linkClass =
    'block py-1 text-[13px] text-[#7c828d] hover:text-[#111827] transition-colors text-right cursor-pointer';

  return (
    <footer className="mt-4 border-t border-[#e5e7eb] bg-white pt-6 pb-6">
      <div className="px-5 space-y-5 text-right">
        {/* Group 1: About */}
        <div>
          <h3 className="text-[14.5px] font-bold text-[#111827] mb-1.5">عن المنصة</h3>
          <nav aria-label="عن المنصة" className="space-y-0.5">
            <button type="button" onClick={scrollToTop} className={linkClass}>
              عن المنصة
            </button>
            <button type="button" onClick={scrollToTop} className={linkClass}>
              خدمات المنصة
            </button>
          </nav>
        </div>

        {/* Group 2: Support */}
        <div>
          <h3 className="text-[14.5px] font-bold text-[#111827] mb-1.5">الدعم</h3>
          <nav aria-label="الدعم" className="space-y-0.5">
            <button type="button" onClick={scrollToTop} className={linkClass}>
              الدعم والمساعدة
            </button>
            <button type="button" onClick={scrollToTop} className={linkClass}>
              الأسئلة الشائعة
            </button>
          </nav>
        </div>

        {/* Group 3: Terms & Privacy */}
        <div>
          <h3 className="text-[14.5px] font-bold text-[#111827] mb-1.5">الشروط والخصوصية</h3>
          <nav aria-label="الشروط والخصوصية" className="space-y-0.5">
            <button type="button" onClick={scrollToTop} className={linkClass}>
              الشروط والأحكام
            </button>
            <button type="button" onClick={scrollToTop} className={linkClass}>
              سياسة الخصوصية
            </button>
          </nav>
        </div>

        {/* Group 4: Contact Us (right-to-left icons) */}
        <div>
          <h3 className="text-[14.5px] font-bold text-[#111827] mb-2.5">تواصل معنا</h3>
          <div className="flex items-center justify-start gap-4 text-[#0B2240]">
            <a
              href="tel:920011040"
              aria-label="920011040"
              title="920011040"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-[18px] h-[18px]" aria-hidden="true" />
            </a>
            <a
              href="mailto:support@ajeer.com.sa"
              aria-label="support@ajeer.com.sa"
              title="support@ajeer.com.sa"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-[18px] h-[18px]" aria-hidden="true" />
            </a>
            <a
              href="https://x.com/AjeerSA"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="حساب X"
              title="https://x.com/AjeerSA"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors font-bold text-base"
            >
              𝕏
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Dual-Column Centered Logos Area with links */}
      <div className="mt-6 pt-5 pb-8 border-t border-[#e5e7eb] px-3">
        <div className="grid grid-cols-2 items-center">
          {/* Right Column in RTL */}
          <div className="border-l border-[#e5e7eb] pl-2 flex flex-col items-center justify-center gap-5 py-2">
            <a
              href="https://mlsd.gov.sa/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="رابط الشعار الأول"
              className="inline-flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <MockOrganizationLogo size="sm" />
            </a>
            <a
              href="https://takamolholding.com/en"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="رابط الشعار الثاني"
              className="inline-flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <MockSolutionsLogo />
            </a>
            <a
              href="https://tamkeentech.sa"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="رابط الشعار الثالث"
              className="inline-flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <MockTechLogo />
            </a>
          </div>

          {/* Left Column in RTL */}
          <div className="pr-2 flex items-center justify-center py-2">
            <a
              href="https://raqmi.dga.gov.sa/platforms/DigitalStamp/ShowCertificate/441"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="رابط شهادة التوثيق الرقمي"
              className="inline-flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <MockRegistryLogo />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
