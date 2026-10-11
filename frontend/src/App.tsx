import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ScanWorkspace } from './pages/ScanWorkspace';
import { ScanReport } from './pages/ScanReport';
import { ReportsList } from './pages/ReportsList';
import { DefenseEvaluation } from './pages/DefenseEvaluation';
import { TracesExplorer } from './pages/TracesExplorer';
import { NotFound } from './pages/NotFound';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspace" element={<ScanWorkspace />} />
          <Route path="/defenses" element={<DefenseEvaluation />} />
          <Route path="/traces" element={<TracesExplorer />} />
          <Route path="/reports" element={<ReportsList />} />
          <Route path="/reports/:id" element={<ScanReport />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

