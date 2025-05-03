import React from "react";

interface LectureViewProps {
  result: string;
}

const LectureView: React.FC<LectureViewProps> = ({ result }) => {
  if (!result) return null;

  const formattedResult = result
    .split("\n")
    .map((line, index) => {
      // Headings (like [Initial Step], [Lecture], etc.)
      if (line.startsWith("[") && line.endsWith("]")) {
        return (
          <h2 key={index} style={{ marginTop: "2rem", color: "#333" }}>
            {line}
          </h2>
        );
      }

      // Subsection Headers (like Section 1.1 - Title)
      if (line.startsWith("Section")) {
        return (
          <h3 key={index} style={{ marginTop: "1rem", color: "#555" }}>
            {line}
          </h3>
        );
      }

      // Bullet points or numbered lists
      if (line.trim().startsWith("-")) {
        return (
          <li key={index} style={{ marginLeft: "1.5rem" }}>
            {line.replace("-", "").trim()}
          </li>
        );
      }

      if (line.trim().match(/^\d+\./)) {
        return (
          <li key={index} style={{ marginLeft: "1.5rem" }}>
            {line.trim()}
          </li>
        );
      }

      // Normal text
      return (
        <p key={index} style={{ marginBottom: "0.5rem", color: "#444" }}>
          {line}
        </p>
      );
    });

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", lineHeight: "1.8" }}>
      <h1>Generated Lesson</h1>
      <div>{formattedResult}</div>
    </div>
  );
};

export default LectureView;
