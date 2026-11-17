import React, { useState } from 'react';
import { Printer, Settings2 } from 'lucide-react';
import { AdminDashboardPanel } from './components/AdminDashboardPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FooterSection } from './components/FooterSection';
import { PermitDocumentView } from './components/PermitDocumentView';
import { VirtualAssistantWidget } from './components/VirtualAssistantWidget';
import { FirebasePermitProvider, useFirebasePermit } from './context/FirebasePermitContext';

const PortalShell: React.FC = () => {
  const { permit, loadingPermit } = useFirebasePermit();
  const [activeView, setActiveView] = useState<'document' | 'admin'>('document');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white text-gray-900 flex flex-col">
      <main className="flex-1 w-full">
        {activeView === 'document' ? (
          <div className="print-container max-w-[440px] sm:max-w-[480px] mx-auto px-2 py-2 sm:py-6">
            <PermitDocumentView permit={permit} loading={loadingPermit} />
            <FooterSection />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
            <AdminDashboardPanel onBackToView={() => setActiveView('document')} />
          </div>
        )}
      </main>

      {/* Bottom-Left Floating Green Chat Launcher (Exact Screenshot Position) */}
      <VirtualAssistantWidget />

      {/* Discreet Bottom-Right Floating Utility Controls for Print/PDF & Admin Control Panel */}
      {activeView === 'document' && (
        <div className="no-print fixed bottom-5 right-5 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            title="لوحة التحكم"
            aria-label="فتح لوحة التحكم"
            className="w-11 h-11 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:text-[#0B2240] hover:border-gray-300 shadow-md flex items-center justify-center transition-colors"
          >
            <Settings2 className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            title="طباعة / حفظ PDF"
            aria-label="طباعة وحفظ PDF"
            className="w-11 h-11 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:text-[#0B2240] hover:border-gray-300 shadow-md flex items-center justify-center transition-colors"
          >
            <Printer className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <FirebasePermitProvider>
        <PortalShell />
      </FirebasePermitProvider>
    </ErrorBoundary>
  );
}
