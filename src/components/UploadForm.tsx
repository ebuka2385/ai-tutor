import React, {useState} from 'react';

const UploadForm = ({ onSubmit }: { onSubmit: (formData: FormData) => void }) => {
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        if(file){
            formData.append('file', file);
        }
        formData.append('text', notes);
        onSubmit(formData);
    }


    return (
        <form onSubmit={handleSubmit}>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Add notes here...'
            />

            <input
                type = "file"
                onChange = {(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />

            <button type="submit"> Generate Lesson </button>

        </form>
    );
};
export default UploadForm;