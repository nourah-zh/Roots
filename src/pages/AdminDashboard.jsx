import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
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
} from "recharts";
import "leaflet/dist/leaflet.css";

const TABUK_CENTER = [28.3838, 36.5662];

const categoryImages = {
  pothole:
    "https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=800",
  poor_lighting:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
  construction:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
  road_damage:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
  sidewalk:
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800",
  waste:
    "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800",
  default:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
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

function scoreColor(score) {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "error";
}

function statusColor(status) {
  if (status === "resolved") return "success";
  if (status === "reviewed") return "info";
  if (status === "false_report") return "error";
  return "warning";
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F5F7FA", py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3" fontWeight={900}>
              Tabuk Road Safety Dashboard
            </Typography>
            <Typography color="text.secondary">
              Monitor road issues, neighborhood safety scores, and community reports.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    spacing={2}
                    mb={2}
                  >
                    <Typography variant="h5" fontWeight={800}>
                      Interactive Map
                    </Typography>

                    <FormControl size="small" sx={{ minWidth: 220 }}>
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
                  </Stack>

                  <Box sx={{ height: 540, borderRadius: 3, overflow: "hidden" }}>
                    <MapContainer
                      center={TABUK_CENTER}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <MapFocus selectedNeighborhood={selectedNeighborhood} />

                      <TileLayer
                        attribution="OpenStreetMap"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {neighborhoods.map((n) => {
                        const score = scores.find(
                          (s) => s.neighborhood_id === n.id
                        );

                        return (
                          <Marker
                            key={`n-${n.id}`}
                            position={[n.latitude, n.longitude]}
                            eventHandlers={{
                              click: () => setSelectedNeighborhood(n),
                            }}
                          >
                            <Popup>
                              <b>{n.name}</b>
                              <br />
                              Zone: {n.zone}
                              <br />
                              Score: {score?.safety_score ?? "N/A"}/100
                            </Popup>
                          </Marker>
                        );
                      })}

                      {areaReports.map((r) =>
                        r.latitude && r.longitude ? (
                          <Marker
                            key={`r-${r.report_ID}`}
                            position={[r.latitude, r.longitude]}
                          >
                            <Popup>
                              <b>{r.title}</b>
                              <br />
                              {r.description}
                              <br />
                              Status: {r.status}
                              <br />
                              Category: {r.category}
                            </Popup>
                          </Marker>
                        ) : null
                      )}
                    </MapContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography variant="h5" fontWeight={800}>
                      Selected Area
                    </Typography>

                    {!selectedNeighborhood && (
                      <>
                        <Typography variant="h4" fontWeight={900} mt={2}>
                          All Tabuk
                        </Typography>
                        <Typography>Total Reports: {reports.length}</Typography>
                        <Typography>Neighborhoods: {neighborhoods.length}</Typography>
                      </>
                    )}

                    {selectedNeighborhood && selectedScore && (
                      <>
                        <Typography variant="h4" fontWeight={900} mt={2}>
                          {selectedNeighborhood.name}
                        </Typography>

                        <Stack spacing={1.2} mt={2}>
                          <Typography>Zone: {selectedNeighborhood.zone}</Typography>
                          <Typography>Reports: {selectedScore.reports_count}</Typography>
                          <Typography>Accidents: {selectedScore.accident_count}</Typography>
                          <Typography>Lighting: {selectedScore.lighting_level}</Typography>
                          <Typography>
                            Maintenance: {selectedScore.maintenance_level}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="h2"
                          fontWeight={900}
                          color={`${scoreColor(selectedScore.safety_score)}.main`}
                          mt={2}
                        >
                          {selectedScore.safety_score}/100
                        </Typography>

                        <Chip
                          label={scoreLabel(selectedScore.safety_score)}
                          color={scoreColor(selectedScore.safety_score)}
                          sx={{ fontWeight: 800 }}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Typography color="text.secondary">Pending</Typography>
                        <Typography variant="h4" fontWeight={900}>
                          {reports.filter((r) => r.status === "pending").length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6}>
                    <Card sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Typography color="text.secondary">Resolved</Typography>
                        <Typography variant="h4" fontWeight={900}>
                          {reports.filter((r) => r.status === "resolved").length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={800} mb={2}>
                    Neighborhood Safety Scores
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreChartData}>
                        <XAxis dataKey="neighborhood" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" fill="#2563EB" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={800} mb={2}>
                    Most Common Problems
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={problemChartData}>
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
                mb={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Reports
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedNeighborhood
                      ? `Reports in ${selectedNeighborhood.name}`
                      : "All reports in Tabuk"}
                  </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 180 }}>
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
              </Stack>

              <Grid container spacing={2}>
                {visibleReports.map((r) => (
                  <Grid item xs={12} sm={6} md={4} key={r.report_ID}>
                    <Card variant="outlined" sx={{ borderRadius: 4, height: "100%" }}>
                      <Box
                        component="img"
                        src={
                          r.image_url ||
                          categoryImages[r.category] ||
                          categoryImages.default
                        }
                        alt={r.title}
                        sx={{
                          width: "100%",
                          height: 170,
                          objectFit: "cover",
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                        }}
                      />

                      <CardContent>
                        <Stack direction="row" spacing={1} mb={1}>
                          <Chip
                            label={r.status}
                            color={statusColor(r.status)}
                            size="small"
                          />
                          <Chip label={r.severity} size="small" />
                        </Stack>

                        <Typography variant="h6" fontWeight={800}>
                          {r.title}
                        </Typography>
                        <Typography color="text.secondary" fontSize={14}>
                          {r.description}
                        </Typography>

                        <Typography mt={1} fontSize={14}>
                          📍 {r.location}
                        </Typography>
                        <Typography fontSize={14}>Category: {r.category}</Typography>

                        <Stack direction="row" flexWrap="wrap" gap={1} mt={2}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => updateStatus(r.report_ID, "reviewed")}
                          >
                            Reviewed
                          </Button>
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            onClick={() => updateStatus(r.report_ID, "resolved")}
                          >
                            Resolved
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => updateStatus(r.report_ID, "false_report")}
                          >
                            False
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            variant="contained"
                            onClick={() => updateStatus(r.report_ID, "pending")}
                          >
                            Pending
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {visibleReports.length === 0 && (
                <Typography color="text.secondary" mt={2}>
                  No reports found.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default AdminDashboard;

