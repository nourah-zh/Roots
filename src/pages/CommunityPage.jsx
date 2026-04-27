import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

function CommunityPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "pothole",
    severity: "medium",
    latitude: "",
    longitude: "",
    image: null,
  });

  const [message, setMessage] = useState("");

  const completion =
    [formData.title, formData.location, formData.description, formData.category, formData.severity].filter(Boolean)
      .length * 20;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMessage("Location selected successfully.");
      },
      () => setMessage("Could not get your location.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting report...");

    let imageUrl = "";

    if (formData.image) {
      const fileExt = formData.image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("reports-images")
        .upload(fileName, formData.image, {
          cacheControl: "3600",
          upsert: false,
          contentType: formData.image.type,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("reports-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("reports").insert([
      {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        image_url: imageUrl,
        user_id: 1,
        status: "pending",
        category: formData.category,
        severity: formData.severity,
        latitude: formData.latitude,
        longitude: formData.longitude,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Report submitted successfully.");

    setFormData({
      title: "",
      description: "",
      location: "",
      category: "pothole",
      severity: "medium",
      latitude: "",
      longitude: "",
      image: null,
    });
  };

  return (
    <main className="roots-public-page">
      <nav className="roots-nav">
        <Link to="/" className="roots-logo">ROOTS</Link>
        <span>Road Safety Intelligence Platform</span>
      </nav>

      <section className="report-hero">
        <div className="report-hero-text">
          <span className="roots-badge">Community Reporting</span>
          <h1>Roots for Safer Roads</h1>
          <p>
            Report road hazards and help authorities improve safety across Tabuk city.
          </p>

          <div className="hero-mini-grid">
            <div><strong>01</strong><span>Submit issue</span></div>
            <div><strong>02</strong><span>Verify location</span></div>
            <div><strong>03</strong><span>Support action</span></div>
          </div>
        </div>

        <aside className="report-status-panel">
          <p>Report Completion</p>
          <h3>{completion}%</h3>
          <div className="progress-track">
            <div style={{ width: `${completion}%` }} />
          </div>
          <span className={`severity-preview ${formData.severity}`}>
            {formData.severity} priority
          </span>
        </aside>
      </section>

      <section className="report-content">
        <form onSubmit={handleSubmit} className="report-card">
          <div className="section-title">
            <span>New Report</span>
            <h2>Submit Road Issue Report</h2>
            <p>Provide accurate details to help the road safety team review the issue faster.</p>
          </div>

          <div className="form-grid">
            <label className="field full">
              Issue Title
              <input
                name="title"
                value={formData.title}
                placeholder="Example: Damaged road near university gate"
                onChange={handleChange}
                required
              />
            </label>

            <label className="field full">
              Location
              <input
                name="location"
                value={formData.location}
                placeholder="Road name, district, or nearby landmark"
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              Category
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="pothole">Pothole</option>
                <option value="road_damage">Road Damage</option>
                <option value="poor_lighting">Poor Lighting</option>
                <option value="traffic_signal">Traffic Signal</option>
                <option value="accident">Accident</option>
                <option value="road_block">Road Block</option>
                <option value="pedestrian_issue">Pedestrian Issue</option>
                <option value="flooding">Flooding</option>
                <option value="construction">Construction</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="field">
              Severity
              <select name="severity" value={formData.severity} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="field full">
              Description
              <textarea
                name="description"
                value={formData.description}
                placeholder="Describe the issue, its impact, and any important details..."
                onChange={handleChange}
                required
              />
            </label>

            <label className="field full">
              Image Upload
              <input type="file" accept="image/*" onChange={handleImage} />
            </label>
          </div>

          <div className="geo-box">
            <button type="button" onClick={getLocation}>
              Use My Current Location
            </button>

            <div className="geo-grid">
              <input value={formData.latitude} placeholder="Latitude" readOnly />
              <input value={formData.longitude} placeholder="Longitude" readOnly />
            </div>
          </div>

          <button type="submit" className="main-submit">
            Submit Report
          </button>

          {message && <p className="message-box">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default CommunityPage;