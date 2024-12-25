import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './screens/Dashboard';  // Assuming you have this component created

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
            {/* Add other routes here */}
          </Routes>
    </Router>
  );
}

export default App;
