import React, { useState } from 'react';
import { DEFAULT_HEADER_LOGO } from '../data/defaultPermit';
import { PermitData } from '../types/permit';
import { CopyButton } from './CopyButton';

interface PermitDocumentViewProps {
  permit: PermitData;
  loading: boolean;
}

interface DataRowProps {
  label: string;
  value: string;
  bold?: boolean;
  copyable?: boolean;
  ltrValue?: boolean;
}

const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  bold = false,
  copyable = false,
  ltrValue = false,
}) => {
  return (
    <div className="border-t border-[#e5e7eb]">
      <div className="bg-[#fafafa] px-4 pt-2.5 pb-1 text-right text-[13.5px] text-[#8c929c] font-normal">
        {label}
      </div>
      <div className="bg-white px-4 pt-1 pb-3 flex items-center justify-end gap-1.5">
        {copyable && <CopyButton value={value} label={label} />}
        <span
          dir={ltrValue ? 'ltr' : 'auto'}
          className={`text-[15px] text-[#111827] break-words text-left ${
            bold ? 'font-bold' : 'font-semibold'
          } ${ltrValue ? 'tabular-nums' : ''}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
};

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <section className="print-card border border-[#dcdcdc] bg-white overflow-hidden">
      <div className="bg-[#f2f3f5] px-4 py-3 text-right">
        <h2 className="text-[18px] font-bold text-[#111827]">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
};

export const PermitDocumentView: React.FC<PermitDocumentViewProps> = ({ permit, loading }) => {
  const [logoError, setLogoError] = useState(false);
  const hasCustomLogo = Boolean(permit.customLogoDataUrl);

  if (loading) {
    return (
      <div
        className="border border-[#dcdcdc] bg-white p-3 space-y-3 animate-pulse"
        aria-busy="true"
        aria-label="جاري تحميل بيانات التصريح"
      >
        <div className="h-24 bg-gray-100" />
        <div className="h-14 bg-gray-100" />
        <div className="h-56 bg-gray-100" />
        <div className="h-72 bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="border border-[#dcdcdc] bg-white">
      {/* Header Logo + Title + Status + Subtitle */}
      <header className="bg-white">
        <div className="py-5 px-4 flex items-center justify-center gap-3 border-b border-[#e5e7eb]">
          {!logoError ? (
            <img
              src={hasCustomLogo ? permit.customLogoDataUrl : DEFAULT_HEADER_LOGO}
              alt="شعار منصة ميثاق"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className={hasCustomLogo ? 'h-16 sm:h-20 w-auto object-contain' : 'h-14 w-auto object-contain'}
            />
          ) : null}
          {!hasCustomLogo && (
            <span className="text-2xl font-extrabold tracking-tight text-[#0B2240]">
              مِيثاق
            </span>
          )}
        </div>

        <div className="py-3.5 px-4 text-center border-b border-[#e5e7eb]">
          <h1 className="text-[22px] font-bold text-[#111827] leading-snug">
            {permit.platformTitle}
          </h1>
        </div>

        <div className="py-3 px-4 text-center border-b border-[#e5e7eb] bg-white">
          <p className="text-[18px] font-semibold text-[#1e7a43]">
            {permit.verificationStatus}
          </p>
        </div>

        <div className="py-3.5 px-4 text-center bg-white">
          <p className="text-[15px] text-[#7c828d] leading-relaxed">
            {permit.platformSubtitle}
          </p>
        </div>
      </header>

      {/* Main Sequential Cards */}
      <div className="px-2.5 pb-3 space-y-3 bg-white">
        {/* Card 1: Permit Details */}
        <SectionCard title="بيانات التصريح">
          <DataRow label="رقم التصريح" value={permit.permitNumber} copyable />
          <DataRow label="نوع التصريح" value={permit.permitType} />
          <DataRow label="تاريخ بداية التصريح" value={permit.startDate} ltrValue />
          <DataRow label="تاريخ نهاية التصريح" value={permit.endDate} ltrValue />
        </SectionCard>

        {/* Card 2: Worker Details */}
        <SectionCard title="بيانات العامل">
          <DataRow label="اسم العامل" value={permit.workerName} bold copyable />
          <DataRow
            label="رقم الهوية / الإقامة"
            value={permit.workerIdNumber}
            bold
            copyable
            ltrValue
          />
          <DataRow label="الجنسية" value={permit.nationality} />
          <DataRow label="المهنة" value={permit.occupation} />
          <DataRow label="الجنس" value={permit.gender} />
          <DataRow label="تاريخ الميلاد" value={permit.birthDate} ltrValue />
        </SectionCard>

        {/* Card 3: First Establishment Details */}
        <SectionCard title="بيانات المنشأة الأولى">
          <DataRow
            label="رقم المنشأة"
            value={permit.firstEstablishmentNumber}
            copyable
            ltrValue
          />
          <DataRow label="اسم المنشأة" value={permit.firstEstablishmentName} />
        </SectionCard>

        {/* Card 4: Second Establishment Details */}
        <SectionCard title="بيانات المنشأة الثانية">
          <DataRow
            label="رقم المنشأة"
            value={permit.secondEstablishmentNumber}
            copyable
            ltrValue
          />
          <DataRow label="اسم المنشأة" value={permit.secondEstablishmentName} />
        </SectionCard>
      </div>
    </div>
  );
};
