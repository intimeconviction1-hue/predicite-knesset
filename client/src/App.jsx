import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

const Login = lazy(() => import('./pages/Login'));

// Repli pendant le chargement d'un chunk de page (React.lazy). Sobre et sur
// fond de page : pas de spinner de marque tierce, pas de flash blanc.
const ChargementPage = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Chargement…</p>
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Pas de gating d'authentification au niveau App : chaque page appelle
// base44.auth.me() elle-même (voir src/api/client.js) et s'adapte selon que
// l'utilisateur est connecté ou non — plus simple qu'un blocage global, et
// ça évite une dépendance à un système d'"app public settings" hébergé.
// Le Suspense enveloppe les ROUTES, pas chaque page : le Layout (header, nav,
// fond) reste affiché pendant qu'un chunk de page se charge — seul le contenu
// central montre le repli.
const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Suspense fallback={<ChargementPage />}><Login /></Suspense>} />
    <Route path="/" element={
      <LayoutWrapper currentPageName={mainPageKey}>
        <MainPage />
      </LayoutWrapper>
    } />
    {Object.entries(Pages).map(([path, Page]) => (
      <Route
        key={path}
        path={`/${path}`}
        element={
          <LayoutWrapper currentPageName={path}>
            <Suspense fallback={<ChargementPage />}>
              <Page />
            </Suspense>
          </LayoutWrapper>
        }
      />
    ))}
    <Route path="*" element={<LayoutWrapper><PageNotFound /></LayoutWrapper>} />
  </Routes>
);

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
