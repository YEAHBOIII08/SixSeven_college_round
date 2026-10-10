import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ScanWorkspace } from './pages/ScanWorkspace';
import { ScanReport } from './pages/ScanReport';
import { ReportsList } from './pages/ReportsList';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workspace" element={<ScanWorkspace />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/:id" element={<ScanReport />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
