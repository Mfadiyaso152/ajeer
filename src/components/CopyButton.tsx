import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'تم النسخ' : label ? `نسخ ${label}` : 'نسخ'}
      aria-label={label ? `نسخ ${label}` : 'نسخ'}
      className={`no-print inline-flex items-center justify-center w-7 h-7 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 ${
        copied
          ? 'text-[#1e7a43] bg-emerald-50'
          : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
  );
};
