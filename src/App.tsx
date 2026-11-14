import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar, type AppPage } from './components/Navbar';
import { DEFAULT_CUSTOMIZATIONS } from './data/catalog';
import { AuthProvider } from './hooks/useAuth';
import { CatalogProvider } from './hooks/useCatalog';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { ConsultationsPage } from './pages/ConsultationsPage';
import { InsightsPage } from './pages/InsightsPage';
import { LandingPage } from './pages/LandingPage';
import { MyDesignsPage } from './pages/MyDesignsPage';
import { StudioPage } from './pages/StudioPage';
import type {
  Customizations,
  DesignStyleId,
  RoomType,
  SavedDesign,
} from './types/decora';

const PAGE_TO_PATH: Record<AppPage, string> = {
  home: '/',
  studio: '/studio',
  designs: '/designs',
  insights: '/insights',
  consultations: '/consultations',
  admin: '/admin',
  auth: '/auth',
};

function getPageFromPathname(pathname: string): AppPage {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/admin' || clean.startsWith('/admin/')) return 'admin';
  if (clean === '/studio') return 'studio';
  if (clean === '/designs') return 'designs';
  if (clean === '/insights') return 'insights';
  if (clean === '/consultations') return 'consultations';
  if (clean === '/auth') return 'auth';
  return 'home';
}

function DecoraShell() {
  const { showToast } = useToast();
  const [page, setPage] = useState<AppPage>(() =>
    getPageFromPathname(window.location.pathname),
  );
  const [roomType, setRoomType] = useState<RoomType>('Living Room');
  const [selectedStyleId, setSelectedStyleId] =
    useState<DesignStyleId>('scandinavian');
  const [customizations, setCustomizations] = useState<Customizations>(
    DEFAULT_CUSTOMIZATIONS,
  );
  const [studioSeedImage, setStudioSeedImage] = useState<string | undefined>(
    undefined,
  );
  const [designsRefreshSignal, setDesignsRefreshSignal] = useState(0);

  useEffect(() => {
    const onPopState = () => {
      setPage(getPageFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (next: AppPage) => {
    const targetPath = PAGE_TO_PATH[next] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartStudio = (styleId?: DesignStyleId) => {
    if (styleId) {
      setSelectedStyleId(styleId);
    }
    handleNavigate('studio');
  };

  const handleOpenDesignInStudio = (design: SavedDesign) => {
    setStudioSeedImage(design.originalImage);
    setRoomType(design.roomType);
    setSelectedStyleId(design.styleId);
    setCustomizations({ ...DEFAULT_CUSTOMIZATIONS, ...design.customizations });
    handleNavigate('studio');
    showToast(`Loaded "${design.title}" into Studio.`, 'info');
  };

  if (page === 'admin') {
    return <AdminPage onBackToPublic={() => handleNavigate('home')} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] text-slate-900 dark:bg-[#0F1117] dark:text-slate-100">
      <Navbar currentPage={page} onNavigate={handleNavigate} />

      <main className="flex-1">
        {page === 'home' && (
          <LandingPage
            onStartStudio={handleStartStudio}
            onBookConsultation={() => handleNavigate('consultations')}
          />
        )}

        {page === 'studio' && (
          <StudioPage
            initialImage={studioSeedImage}
            customizations={customizations}
            onCustomizationsChange={setCustomizations}
            roomType={roomType}
            onRoomTypeChange={setRoomType}
            selectedStyleId={selectedStyleId}
            onStyleChange={setSelectedStyleId}
            onSavedDesign={() => setDesignsRefreshSignal((n) => n + 1)}
          />
        )}

        {page === 'designs' && (
          <MyDesignsPage
            refreshSignal={designsRefreshSignal}
            onOpenInStudio={handleOpenDesignInStudio}
            onGoToStudio={() => handleNavigate('studio')}
          />
        )}

        {page === 'insights' && (
          <InsightsPage onGoToStudio={() => handleNavigate('studio')} />
        )}

        {page === 'consultations' && <ConsultationsPage />}

        {page === 'auth' && (
          <AuthPage
            onSuccessNavigate={() => handleNavigate('studio')}
            onOpenAdmin={() => handleNavigate('admin')}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CatalogProvider>
            <DecoraShell />
          </CatalogProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
