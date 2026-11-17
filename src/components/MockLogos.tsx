import React from 'react';
import brandPortalImg from '../assets/images/ai_brand_portal_logo_1794938811291.png';
import orgPartnerImg from '../assets/images/ai_org_partner_logo_1794938811706.png';
import registrySealImg from '../assets/images/ai_registry_seal_logo_1794938812952.png';
import solutionsWaveImg from '../assets/images/ai_solutions_wave_logo_1794938812325.png';
import techPrismImg from '../assets/images/ai_tech_prism_logo_1794938812463.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const LogoImage: React.FC<{
  src: string;
  alt: string;
  imgClass: string;
}> = ({ src, alt, imgClass }) => (
  <img
    src={src}
    alt={alt}
    referrerPolicy="no-referrer"
    className={`${imgClass} object-contain shrink-0 block mx-auto`}
  />
);

export const MockPlatformLogo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const imgClass =
    size === 'sm'
      ? 'h-10 w-auto max-w-[140px]'
      : 'h-16 sm:h-18 w-auto max-w-[170px]';
  return (
    <div className="inline-flex items-center justify-center shrink-0">
      <LogoImage src={brandPortalImg} alt="شعار المنصة" imgClass={imgClass} />
    </div>
  );
};

export const MockOrganizationLogo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const imgClass =
    size === 'sm'
      ? 'h-10 w-auto max-w-[140px]'
      : 'h-16 sm:h-18 w-auto max-w-[170px]';
  return (
    <div className="inline-flex items-center justify-center shrink-0">
      <LogoImage src={orgPartnerImg} alt="الشعار التنظيمي" imgClass={imgClass} />
    </div>
  );
};

export const MockSolutionsLogo: React.FC = () => (
  <div className="inline-flex items-center justify-center mx-auto">
    <LogoImage src={solutionsWaveImg} alt="شعار الحلول" imgClass="h-12 w-auto max-w-[160px]" />
  </div>
);

export const MockTechLogo: React.FC = () => (
  <div className="inline-flex items-center justify-center mx-auto">
    <LogoImage src={techPrismImg} alt="شعار التقنية" imgClass="h-11 w-auto max-w-[160px]" />
  </div>
);

export const MockRegistryLogo: React.FC = () => (
  <div className="inline-flex items-center justify-center mx-auto">
    <LogoImage src={registrySealImg} alt="شعار التوثيق" imgClass="h-16 w-auto max-w-[170px]" />
  </div>
);
