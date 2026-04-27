import { useState } from "react";
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
        setMessage("Location selected successfully");
      },
      (error) => {
        console.log(error);
        setMessage("Could not get your location");
      }
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
        console.log(uploadError);
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
      console.log(error);
      setMessage(error.message);
      return;
    }

    setMessage("Report submitted successfully");
  };

  return (
    <div>
      <h1>Report Road Issue</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Report title"
          onChange={handleChange}
          required
        />

        <br />

        <textarea
          name="description"
          placeholder="Describe the problem"
          onChange={handleChange}
          required
        />

        <br />

        <input
          name="location"
          placeholder="Road name or area"
          onChange={handleChange}
          required
        />

        <br />

        <select name="category" onChange={handleChange}>
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

        <br />

        <select name="severity" onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <br />

        <input type="file" accept="image/*" onChange={handleImage} />

        <br />

        <button type="button" onClick={getLocation}>
          Use My Current Location
        </button>

        <br />

        <input value={formData.latitude} placeholder="Latitude" readOnly />
        <input value={formData.longitude} placeholder="Longitude" readOnly />

        <br />

        <button type="submit">Submit Report</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default CommunityPage;