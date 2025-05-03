import { NextApiRequest, NextApiResponse } from "next";
import pdfParse from "pdf-parse";
import { IncomingForm } from "formidable";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const form = new IncomingForm();

    const data = await new Promise<{ fields: any, files: any }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve({ fields, files });
        });
    });

    const file = Array.isArray(data.files.file) ? data.files.file[0] : data.files.file;

    if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const fs = await import("fs/promises");
    const fileBuffer = await fs.readFile(file.filepath);
    const pdfData = await pdfParse(fileBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim() === "") {
      return res.status(400).json({ message: "PDF could not be processed or contains unsupported fonts." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: "OpenAI API Key not configured" });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    if (!openai) {
        return res.status(500).json({ message: "OpenAI client not initialized" });
    }

    const prompt = `
    You are an expert AI tutor who teaches students interactively and with depth.
    
    Given the following notes, create a structured, detailed, and interactive lesson plan exactly as instructed below. Follow carefully and DO NOT summarize or skip any important detail.
    
    === INITIAL STEP ===
    
    - Before starting, ask the student:
    "Would you like to go section-by-section in detail (recommended for deeper learning) or receive everything at once?"
    
    - If the student says "section-by-section":
        - Only show the first section and its explanation (fully detailed).
        - Stop and ask: "Would you like to continue to the next section?"
        - Wait for permission before continuing.
        - Repeat for every section until the lecture is complete.
    
    - If the student says "everything at once":
        - Generate the full lecture using the instructions below.
    
    === LECTURE FORMAT ===
    
    - Teach step-by-step.
    - For each section in the notes (e.g., Section 1.1, Section 1.2, etc):
        - Use the exact section title.
        - Explain clearly and thoroughly, as if teaching a beginner.
        - Break down ideas into sub-points or numbered lists where possible.
        - Include examples for EACH subsection.
        - Avoid vague or generic statements.
        - Always connect explanations to the source notes.
    
    === REAL WORLD EXAMPLES ===
    
    - After every subsection (not just at the end), add real-world analogies or relatable scenarios.
    - These examples should help the student visualize or intuitively understand the concept.
    
    === QUIZ ===
    
    - After the lecture (or if the student asks), say:
    "Would you like to take a quiz to test your knowledge?"
    
    - If yes:
        - Generate multiple choice questions (A, B, C, D).
        - Immediately provide the correct answer and a short explanation.
    
    === NEXT STEPS ===
    
    - After the lecture and quiz (if provided), ask:
    "Would you like to continue with a more detailed, page-by-page explanation?"
    
    NOTES:
    """
    ${pdfText}
    """
    
    ⚡️ FORMAT YOUR RESPONSE LIKE THIS ⚡️
    
    [Initial Step]
    (Ask the student...) (Do not continue until they respond)
    (If "section-by-section", show first section only, then ask to continue)
    (If "everything at once", continue with full lesson)
    
    [Lecture]
    Section 1.1 - [Title]
    (Detailed explanation)
    
    Section 1.2 - [Title]
    (Detailed explanation)
    
    ...
    
    [Real World Examples]
    (Add examples here after each subsection)
    
    [Quiz Invitation]
    (Ask if they want a quiz)
    (If yes, generate questions with answers and explanations)
    
    [Next Steps]
    (Ask if they want a page-by-page explanation)
    `;
    

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
    });
    const lesson = response.choices?.[0]?.message?.content;

    if (!lesson) {
        return res.status(500).json({ message: "No response from AI" });
    }

    res.status(200).json({ result: lesson });
}


