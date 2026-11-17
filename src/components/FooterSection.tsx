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
    'block py-1 text-[15px] text-[#7c828d] hover:text-[#111827] transition-colors text-right cursor-pointer';

  return (
    <footer className="mt-4 border-t border-[#e5e7eb] bg-white pt-7 pb-6">
      <div className="px-5 space-y-6 text-right">
        {/* Group 1: About */}
        <div>
          <h3 className="text-[17px] font-bold text-[#111827] mb-2">عن المنصة</h3>
          <nav aria-label="عن المنصة" className="space-y-1">
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
          <h3 className="text-[17px] font-bold text-[#111827] mb-2">الدعم</h3>
          <nav aria-label="الدعم" className="space-y-1">
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
          <h3 className="text-[17px] font-bold text-[#111827] mb-2">الشروط والخصوصية</h3>
          <nav aria-label="الشروط والخصوصية" className="space-y-1">
            <button type="button" onClick={scrollToTop} className={linkClass}>
              الشروط والأحكام
            </button>
            <button type="button" onClick={scrollToTop} className={linkClass}>
              سياسة الخصوصية
            </button>
          </nav>
        </div>

        {/* Group 4: Contact Us */}
        <div>
          <h3 className="text-[17px] font-bold text-[#111827] mb-3">تواصل معنا</h3>
          <div className="flex items-center justify-end gap-5 text-[#0B2240]">
            <a
              href="tel:920011040"
              aria-label="920011040"
              title="920011040"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="mailto:support@ajeer.com.sa"
              aria-label="support@ajeer.com.sa"
              title="support@ajeer.com.sa"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="https://x.com/AjeerSA"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="حساب X"
              title="https://x.com/AjeerSA"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
            >
              𝕏
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Dual-Column Centered AI Logos Area */}
      <div className="mt-7 pt-5 pb-8 border-t border-[#e5e7eb] px-3">
        <div className="grid grid-cols-2 items-center">
          <div className="border-l border-[#e5e7eb] pl-2 flex flex-col items-center justify-center gap-5 py-2">
            <MockOrganizationLogo size="sm" />
            <MockSolutionsLogo />
            <MockTechLogo />
          </div>
          <div className="pr-2 flex items-center justify-center py-2">
            <MockRegistryLogo />
          </div>
        </div>
      </div>
    </footer>
  );
};
