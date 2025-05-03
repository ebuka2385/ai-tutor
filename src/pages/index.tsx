import React, { useState } from "react";
import UploadForm from "@/components/UploadForm";

export default function Home() {
    const [lesson, setLesson] = useState<string | null>(null);

    const handleUpload = async (formData: FormData) => {
        const response = await fetch('/api/generate', {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            setLesson(data.result); // Make sure this matches backend key ("result" not "lesson" in generate.ts)
        } else {
            console.error("Error uploading file");
        }
    };

    return (
        <main>
            <h1>AI Tutor</h1>
            <UploadForm onSubmit={handleUpload} />
            {lesson && (
                <div>
                    <pre>{lesson}</pre>
                </div>
            )}
        </main>
    );
}
