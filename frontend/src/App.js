import Sidebar from './components/Sidebar';
import Home from '../src/pages/Home';

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <Home />
    </div>
  );
}