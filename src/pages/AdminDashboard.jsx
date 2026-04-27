import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "leaflet/dist/leaflet.css";

const TABUK_CENTER = [28.3838, 36.5662];
const TABUK_BOUNDS = [
  [28.2, 36.3],
  [28.55, 36.8],
];

const categoryImages = {
  pothole: "https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=800",
  poor_lighting: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
  construction: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
  road_damage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
  sidewalk: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800",
  waste: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800",
  default: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
};

function MapFocus({ selectedNeighborhood }) {
  const map = useMap();

  useEffect(() => {
    if (selectedNeighborhood?.latitude && selectedNeighborhood?.longitude) {
      map.flyTo([selectedNeighborhood.latitude, selectedNeighborhood.longitude], 15);
    } else {
      map.flyTo(TABUK_CENTER, 12);
    }
  }, [selectedNeighborhood, map]);

  return null;
}

function scoreLabel(score) {
  if (score >= 80) return "Safe";
  if (score >= 50) return "Moderate";
  return "Risky";
}

function scoreClass(score) {
  if (score >= 80) return "safe";
  if (score >= 50) return "moderate";
  return "risky";
}

function statusClass(status) {
  if (status === "resolved") return "safe";
  if (status === "reviewed") return "info";
  if (status === "false_report") return "risky";
  return "moderate";
}

function createMarkerIcon(score) {
  const cls = scoreClass(score);
  return L.divIcon({
    className: "roots-marker-wrap",
    html: `<div class="roots-marker ${cls}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [scores, setScores] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchReports();
    fetchScores();
    fetchNeighborhoods();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);
    setReports(data || []);
  };

  const fetchScores = async () => {
    const { data, error } = await supabase
      .from("neighborhood_safety_scores")
      .select("*")
      .order("safety_score", { ascending: true });

    if (error) return alert(error.message);
    setScores(data || []);
  };

  const fetchNeighborhoods = async () => {
    const { data, error } = await supabase
      .from("neighborhoods")
      .select("*")
      .order("name", { ascending: true });

    if (error) return alert(error.message);
    setNeighborhoods(data || []);
  };

  const updateStatus = async (reportId, newStatus) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("report_ID", reportId);

    if (error) return alert(error.message);

    fetchReports();
    fetchScores();
  };

  const selectedScore = selectedNeighborhood
    ? scores.find((s) => s.neighborhood_id === selectedNeighborhood.id)
    : null;

  const areaReports = useMemo(() => {
    if (!selectedNeighborhood) return reports;
    return reports.filter((r) => r.neighborhood_id === selectedNeighborhood.id);
  }, [reports, selectedNeighborhood]);

  const visibleReports = useMemo(() => {
    if (statusFilter === "all") return areaReports;
    return areaReports.filter((r) => r.status === statusFilter);
  }, [areaReports, statusFilter]);

  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;
  const criticalAlerts = reports.filter(
    (r) => r.severity === "high" || r.category === "accident"
  ).length;

  const problemChartData = Object.values(
    areaReports.reduce((acc, report) => {
      const category = report.category || "unknown";
      acc[category] = acc[category] || { category, count: 0 };
      acc[category].count += 1;
      return acc;
    }, {})
  );

  const scoreChartData = scores.map((s) => ({
    neighborhood: s.neighborhood_name,
    score: s.safety_score,
  }));

  const getReportScore = (report) => {
    const areaScore = scores.find((s) => s.neighborhood_id === report.neighborhood_id);
    if (areaScore?.safety_score) return areaScore.safety_score;

    if (report.severity === "high") return 35;
    if (report.severity === "medium") return 60;
    return 85;
  };

  return (
    <main className="admin-page">
      <nav className="admin-nav">
        <div>
          <h2>ROOTS</h2>
          <p>Road Safety Intelligence Platform</p>
        </div>

        <Chip label="Tabuk City" className="nav-chip" />
      </nav>

      <section className="admin-hero">
        <div>
          <span className="roots-badge">Government Road Safety Dashboard</span>
          <h1>Data-Driven Decisions for Safer Roads</h1>
          <p>
            Real-time analytics powered by verified community reports to support
            smarter infrastructure decisions.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <Card className="stat-card">
          <CardContent>
            <span>📍</span>
            <p>Total Reports</p>
            <h3>{reports.length}</h3>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <span>⏳</span>
            <p>Pending Reports</p>
            <h3>{pendingReports}</h3>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <span>✅</span>
            <p>Resolved Reports</p>
            <h3>{resolvedReports}</h3>
          </CardContent>
        </Card>

        <Card className="stat-card alert">
          <CardContent>
            <span>⚠️</span>
            <p>Critical Alerts</p>
            <h3>{criticalAlerts}</h3>
          </CardContent>
        </Card>
      </section>

      <Grid container spacing={3} className="admin-main-grid">
        <Grid item xs={12} lg={8}>
          <Card className="dashboard-card">
            <CardContent>
              <div className="card-heading">
                <div>
                  <span>LIVE MAP</span>
                  <h3>Tabuk Risk Observation Map</h3>
                </div>

                <FormControl size="small" className="filter-select">
                  <InputLabel>Neighborhood</InputLabel>
                  <Select
                    label="Neighborhood"
                    value={selectedNeighborhood?.id || ""}
                    onChange={(e) => {
                      const n = neighborhoods.find(
                        (x) => x.id === Number(e.target.value)
                      );
                      setSelectedNeighborhood(n || null);
                    }}
                  >
                    <MenuItem value="">All Tabuk</MenuItem>
                    {neighborhoods.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="map-shell">
                <MapContainer
                  center={TABUK_CENTER}
                  zoom={12}
                  minZoom={11}
                  maxZoom={16}
                  maxBounds={TABUK_BOUNDS}
                  maxBoundsViscosity={1}
                  style={{ height: "440px", width: "100%" }}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                  <MapFocus selectedNeighborhood={selectedNeighborhood} />

                  {neighborhoods.map((n) => {
                    const score = scores.find((s) => s.neighborhood_id === n.id);
                    const value = score?.safety_score ?? 60;

                    return (
                      <Marker
                        key={n.id}
                        position={[n.latitude, n.longitude]}
                        icon={createMarkerIcon(value)}
                        eventHandlers={{
                          click: () => setSelectedNeighborhood(n),
                        }}
                      >
                        <Popup>
                          <div className="map-popup">
                            <h4>{n.name}</h4>
                            <span className={`score-badge ${scoreClass(value)}`}>
                              {value}/100 — {scoreLabel(value)}
                            </span>
                            <p>Zone: {n.zone || "Not specified"}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {areaReports.map((r) =>
                    r.latitude && r.longitude ? (
                      <Marker
                        key={r.report_ID}
                        position={[r.latitude, r.longitude]}
                        icon={createMarkerIcon(getReportScore(r))}
                      >
                        <Popup>
                          <div className="map-popup">
                            <h4>{r.title}</h4>
                            <p>{r.description}</p>
                            <span className={`score-badge ${scoreClass(getReportScore(r))}`}>
                              {scoreLabel(getReportScore(r))}
                            </span>
                            <span className={`status-badge ${statusClass(r.status)}`}>
                              {r.status}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    ) : null
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card className="dashboard-card side-card">
            <CardContent>
              <div className="card-heading">
                <div>
                  <span>AREA INSIGHTS</span>
                  <h3>Selected Area</h3>
                </div>
              </div>

              {!selectedNeighborhood && (
                <div className="area-summary">
                  <h2>All Tabuk</h2>
                  <p>Total Reports: {reports.length}</p>
                  <p>Neighborhoods: {neighborhoods.length}</p>
                </div>
              )}

              {selectedNeighborhood && (
                <div className="area-summary">
                  <h2>{selectedNeighborhood.name}</h2>
                  <p>Zone: {selectedNeighborhood.zone}</p>
                  <p>Reports: {selectedScore?.reports_count ?? 0}</p>
                  <p>Accidents: {selectedScore?.accident_count ?? 0}</p>

                  <div className="big-score">
                    {selectedScore?.safety_score ?? "N/A"}
                    <span>/100</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <div className="card-heading">
                <div>
                  <span>ANALYTICS</span>
                  <h3>Neighborhood Safety Scores</h3>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="neighborhood" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0f766e" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <div className="card-heading">
                <div>
                  <span>REPORT TRENDS</span>
                  <h3>Most Common Problems</h3>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={problemChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <section className="reports-section">
        <div className="reports-header">
          <div>
            <span>COMMUNITY REPORTS</span>
            <h2>
              {selectedNeighborhood
                ? `Reports in ${selectedNeighborhood.name}`
                : "All Reports in Tabuk"}
            </h2>
          </div>

          <FormControl size="small" className="filter-select">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="reviewed">Reviewed</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="false_report">False Report</MenuItem>
            </Select>
          </FormControl>
        </div>

        <Grid container spacing={2.5}>
          {visibleReports.map((r) => (
            <Grid item xs={12} md={6} lg={4} key={r.report_ID}>
              <Card className="report-item-card">
                <img
                  src={r.image_url || categoryImages[r.category] || categoryImages.default}
                  alt={r.title}
                />

                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={r.status || "pending"}
                      className={`status-chip ${statusClass(r.status)}`}
                    />
                    <Chip label={r.severity || "medium"} className="severity-chip" />
                  </Stack>

                  <Typography variant="h6" className="report-title">
                    {r.title}
                  </Typography>

                  <Typography className="report-description">
                    {r.description}
                  </Typography>

                  <Typography className="report-location">
                    📍 {r.location || "No location provided"}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
                    <Button onClick={() => updateStatus(r.report_ID, "reviewed")}>
                      Reviewed
                    </Button>
                    <Button onClick={() => updateStatus(r.report_ID, "resolved")}>
                      Resolved
                    </Button>
                    <Button onClick={() => updateStatus(r.report_ID, "false_report")}>
                      False
                    </Button>
                    <Button onClick={() => updateStatus(r.report_ID, "pending")}>
                      Pending
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {visibleReports.length === 0 && (
          <Box className="empty-state">No reports found.</Box>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;