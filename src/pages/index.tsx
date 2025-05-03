import React, { useState } from "react";
import UploadForm from "../components/UploadForm";
import LectureView from "../components/LectureView";

export default function Home() {
  const [result, setResult] = useState<string>(""); // This holds the AI lesson result
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.result) {
        setResult(data.result);
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating lesson");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>AI Tutor</h1>
      <p>Add notes here...</p>

      <UploadForm onSubmit={(formData) => handleGenerate(formData.get("file") as File)} />

      {loading && <p>Generating lesson...</p>}

      {result && <LectureView result={result} />}
    </div>
  );
}
// This is the main page of the application. It imports the UploadForm and LectureView components.