import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import SignIn from '@/components/SignIn';
import EnvironmentBanner from '@/components/EnvironmentBanner';
import BrandSplash from '@/components/BrandSplash';
import { useSplashGate } from '@/lib/splash';
import React, { Suspense } from 'react';

/**
 * O painel da equipe vem sob demanda: o pai nunca baixa esse codigo, e a
 * sessao de la' nao passa pela sessao de pai deste App.
 */
const PanelApp = React.lazy(() => import('@/panel/PanelApp'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const showsSplash = useSplashGate(isLoadingAuth);

  if (showsSplash) {
    return <BrandSplash />;
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  // Render the main app
  return (
    <Routes>
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
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {/* Fora do Router para a faixa aparecer tambem na tela de entrada. */}
        <EnvironmentBanner />
        <Router>
          <Routes>
            <Route
              path="/painel/*"
              element={
                <Suspense fallback={<BrandSplash />}>
                  <PanelApp />
                </Suspense>
              }
            />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App