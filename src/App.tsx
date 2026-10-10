import Homepage from './frontend/homepage';
import Create from './frontend/create';
import SharedMessage from './frontend/shared';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/create" element={<Create />} />
        <Route path="/view" element={<SharedMessage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App