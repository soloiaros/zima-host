import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import Domains from './pages/Domains';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/domains" element={<Domains />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
