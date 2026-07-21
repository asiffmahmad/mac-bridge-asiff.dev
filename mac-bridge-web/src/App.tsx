import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Chat } from '@/pages/Chat';
import { Terminal } from '@/pages/Terminal';
import { Files } from '@/pages/Files';
import { Git } from '@/pages/Git';
import { System } from '@/pages/System';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
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
    </BrowserRouter>
  );
}

export default App;
