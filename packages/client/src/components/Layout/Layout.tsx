import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-full min-h-screen bg-surface-950 text-surface-100">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
