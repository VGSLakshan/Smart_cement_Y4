import Sidebar from './components/Sidebar';
// import Home from '../src/pages/Home';

import RawMealPages from './pages/RawMealPages';

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      {/* <Home /> */}
      <RawMealPages/>
    </div>
  );
}