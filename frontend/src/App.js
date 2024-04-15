import React from 'react';
import { BrowserRouter as Router,Routes, Route,  } from 'react-router-dom';

import TaxCalculator from './components/TaxCalculator';
import PortfolioOverview from './components/PortfolioOverview';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<TaxCalculator />} />
          <Route path="/portfolio-overview" element={<PortfolioOverview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
