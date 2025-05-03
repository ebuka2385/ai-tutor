import UploadForm from "@/components/UploadForm";
import React,{useState} from "react";

const [lesson, setLesson] = useState<string | null>(null);

// This is the main page of the application
// It contains the UploadForm component and handles the file upload
// It sends the file and notes to the server and receives the generated lesson
const handleUpload = async (formData: FormData) => {
    const response = await fetch('/api/generate',{
        method: "POST",
        body: formData,
    });
    if(response.ok){
        const data = await response.json();
        setLesson(data.lesson);
    }
    else{
        console.error("Error uploading file");
    }

    return (
        <main>
            <h1> AI Tutor</h1>
            <UploadForm onSubmit={handleUpload} />
            {lesson && (
                <div>
                    <pre> {lesson} </pre>
                </div>
            )}
        </main>
    );
    
}
