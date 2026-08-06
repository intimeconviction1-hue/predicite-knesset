import { Suspense, lazy } from 'react';
import { MotionConfig } from 'framer-motion';
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

// MotionConfig reducedMotion="user" — le trou d'accessibilité le plus large du
// site, et le plus invisible. globals.css traite prefers-reduced-motion avec
// beaucoup de soin (cinq blocs de gardes : blobs, marquee, p-reveal, tracés SVG,
// hover des cartes), mais tout cela ne vaut que pour les animations CSS.
// framer-motion, lui, anime en JavaScript : il écrit les transforms image par
// image, sans jamais consulter transition-duration. Les `motion.*` de dix-sept
// pages et d'une trentaine de composants continuaient donc de glisser et de
// zoomer pour quelqu'un qui a demandé à son système d'arrêter le mouvement.
// Cette ligne le branche partout d'un coup : framer-motion coupe les animations
// de transform et de layout, et garde les fondus d'opacité — le contenu apparaît
// toujours, il ne bouge plus. Les composants qui appellent déjà useReducedMotion()
// (CinematicHero, HeroBackdrop, ConfettiBurst, AnimatedExplainer) restent valides,
// c'est la même préférence.
function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </MotionConfig>
  )
}

export default App
