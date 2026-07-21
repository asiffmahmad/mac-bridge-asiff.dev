import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';

// Lazy load route pages
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Pair = lazy(() => import('@/pages/Pair').then(module => ({ default: module.Pair })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Chat = lazy(() => import('@/pages/Chat').then(module => ({ default: module.Chat })));
const Terminal = lazy(() => import('@/pages/Terminal').then(module => ({ default: module.Terminal })));
const Files = lazy(() => import('@/pages/Files').then(module => ({ default: module.Files })));
const Git = lazy(() => import('@/pages/Git').then(module => ({ default: module.Git })));
const System = lazy(() => import('@/pages/System').then(module => ({ default: module.System })));
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })));

// Simple fallback loading indicator
function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#121212] text-white">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="text-sm font-medium text-gray-400">Loading Console...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pair" element={<Pair />} />
          
          <Route element={<AuthGuard><MobileLayout /></AuthGuard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/files" element={<Files />} />
            <Route path="/git" element={<Git />} />
            <Route path="/system" element={<System />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
