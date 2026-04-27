import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import CommunityPage from "./pages/CommunityPage";

function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <span className="badge">Roots | جذور</span>
        <h1>Road safety insights powered by community reports.</h1>
        <p>
          A smart platform that helps authorities monitor road issues, analyze
          risk areas, and support faster safety decisions.
        </p>

        <div className="hero-actions">
          <Link to="/report" className="btn primary">Submit Report</Link>
          <Link to="/admin" className="btn secondary">Admin Dashboard</Link>
        </div>
      </section>

      <section className="features">
        <div>
          <h3>Community Reports</h3>
          <p>Citizens report potholes, poor lighting, and road hazards.</p>
        </div>
        <div>
          <h3>Risk Map</h3>
          <p>Issues are displayed on a map to identify dangerous areas.</p>
        </div>
        <div>
          <h3>Decision Support</h3>
          <p>Admins can track reports, status, and safety indicators.</p>
        </div>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="s/report" element={<CommunityPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

<Route path="/report" element={<CommunityPage />} />

export default App;