import React, { useCallback, useEffect, useState } from 'react';
import { AdminDashboardPanel } from './components/AdminDashboardPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FooterSection } from './components/FooterSection';
import { MockOrganizationLogo, MockPlatformLogo } from './components/MockLogos';
import { PermitDocumentView } from './components/PermitDocumentView';
import { VirtualAssistantWidget } from './components/VirtualAssistantWidget';
import { FirebasePermitProvider, useFirebasePermit } from './context/FirebasePermitContext';
import { DEFAULT_PERMIT_DATA } from './data/defaultPermit';
import { PermitData } from './types/permit';

function normalizePath(rawPath: string): string {
  const clean = rawPath.split('?')[0].split('#')[0].replace(/\/+$/, '');
  if (!clean) return '/';
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

function getInitialPath(): string {
  const params = new URLSearchParams(window.location.search);
  const queryPermit = params.get('permit') || params.get('p');
  if (queryPermit) {
    return normalizePath(`/${queryPermit}`);
  }
  const hash = window.location.hash;
  if (hash.toLowerCase() === '#admin') {
    return '/admin';
  }
  if (hash.startsWith('#/')) {
    return normalizePath(hash.slice(1));
  }
  return normalizePath(window.location.pathname);
}

const PortalShell: React.FC = () => {
  const { fetchPermitBySlug } = useFirebasePermit();
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [slugPermit, setSlugPermit] = useState<PermitData | null>(null);
  const [loadingSlugPermit, setLoadingSlugPermit] = useState<boolean>(false);
  const [slugNotFound, setSlugNotFound] = useState<boolean>(false);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((targetPath: string) => {
    const next = normalizePath(targetPath);
    if (window.location.pathname !== next || window.location.hash) {
      window.history.pushState({}, '', next);
    }
    setCurrentPath(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminRoute = currentPath === '/' || currentPath === '/admin';
  const slugSegment = !isAdminRoute ? currentPath.slice(1) : null;

  useEffect(() => {
    if (!slugSegment) {
      setSlugPermit(null);
      setSlugNotFound(false);
      setLoadingSlugPermit(false);
      return;
    }

    let active = true;
    setLoadingSlugPermit(true);
    setSlugNotFound(false);

    void fetchPermitBySlug(slugSegment)
      .then((data) => {
        if (!active) return;
        if (data) {
          setSlugPermit(data);
          setSlugNotFound(false);
        } else {
          setSlugPermit(null);
          setSlugNotFound(true);
        }
        setLoadingSlugPermit(false);
      })
      .catch(() => {
        if (!active) return;
        setSlugPermit(null);
        setSlugNotFound(true);
        setLoadingSlugPermit(false);
      });

    return () => {
      active = false;
    };
  }, [slugSegment, fetchPermitBySlug]);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-gray-900 flex flex-col">
      {isAdminRoute ? (
        <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-6">
          <AdminDashboardPanel onNavigate={navigate} />
        </main>
      ) : (
        <main className="flex-1 w-full">
          {/* Top Dual-Logo Strip properly centered & aligned */}
          <div className="border-b border-[#dcdcdc] bg-white">
            <div className="max-w-[440px] sm:max-w-[480px] mx-auto px-3 py-2.5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="شعار المنصة"
                className="flex items-center justify-center shrink-0 cursor-pointer"
              >
                <MockPlatformLogo size="sm" />
              </button>
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="الشعار التنظيمي"
                className="flex items-center justify-center shrink-0 cursor-pointer"
              >
                <MockOrganizationLogo size="sm" />
              </button>
            </div>
          </div>

          <div className="print-container max-w-[440px] sm:max-w-[480px] mx-auto px-2 pt-2 pb-4">
            {slugNotFound ? (
              <div className="border border-[#dcdcdc] bg-white p-8 text-center space-y-3 my-4">
                <h1 className="text-lg font-bold text-gray-950">التصريح غير موجود</h1>
                <p className="text-sm text-gray-600">
                  لم يتم العثور على تصريح مسجل بالرابط المطلوب.
                </p>
              </div>
            ) : loadingSlugPermit ? (
              <PermitDocumentView permit={DEFAULT_PERMIT_DATA} loading={true} />
            ) : (
              slugPermit && <PermitDocumentView permit={slugPermit} loading={false} />
            )}
            <FooterSection />
          </div>
        </main>
      )}

      {/* Bottom-Left Floating Green Chat Launcher */}
      {!isAdminRoute && !slugNotFound && <VirtualAssistantWidget />}
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
