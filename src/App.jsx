import "./App.css";
import AdminDashboard from "./pages/AdminDashboard";
import Community from "./pages/CommunityPage";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>

        {/* Admin الصفحة الرئيسية */}
        <Route path="/" element={<AdminDashboard />} />

        {/* Community */}
        <Route path="/community" element={<Community />} />

      </Routes>
    </Router>
  );
}

export default App;