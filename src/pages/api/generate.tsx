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

    if (!pdfText) {
      return res.status(400).json({ message: "No text found in PDF" });
    }

    if (!process.env.OPENAIKEY) {
      return res.status(500).json({ message: "OpenAI API Key not configured" });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAPIKEY,
    });
    const prompt = `
      You are an expert AI tutor.

      Given the following notes, your job is to create a structured, detailed, and interactive lesson plan. Follow all instructions carefully.

      === INITIAL STEP ===

      - Before starting, ask the student:
      "Would you like to go section-by-section in detail (recommended for deeper learning) or receive everything at once?"

      - If the student chooses "section-by-section":
          - Only show the first section and its explanation.
          - Stop and ask: "Would you like to continue to the next section?"
          - Only continue when the student agrees.
          - Repeat this for every section until the lecture is fully covered.

      - If the student chooses "everything at once":
          - Generate the full lecture, real world examples, and quiz (see below) in one response.

      === LECTURE ===

      - Teach the material step-by-step.
      - Break down the lecture into clear sections and subsections based on the notes.
      - If the notes contain headers (e.g., "Section 1.1", "Section 1.2"), use them to structure your explanation.
      - For each section:
          - Explain clearly and concisely.
          - Cover every important detail.
          - Avoid fluff or generic statements.
          - Use simple language, lists, and examples.

      === REAL WORLD EXAMPLES ===

      - After each major section (or at the end if "everything at once" mode), provide real-world examples or analogies to make the material relatable.

      === QUIZ (Optional) ===

      - At the end of the lecture, ask:
      "Would you like to take a quiz to test your knowledge so far?"

      - If the student agrees, generate the quiz:
          - The number of questions should reflect the complexity and length of the notes.
          - For each question:
              - Provide multiple choice answers (A, B, C, D).
              - Indicate the correct answer immediately after.
              - Include explanations.

      === NEXT STEPS ===

      - After the lecture and quiz (if provided), ask:
      "Would you like to continue with a more detailed, page-by-page explanation for even deeper understanding?"

      NOTES:
      """
      ${pdfText}
      """

      ⚡️ FORMAT THE RESPONSE LIKE THIS:

      [Initial Step]
      (Ask: Would you like to go section-by-section or receive everything at once?)

      [Lecture]
      Section 1.1 - [Section Title]
      (Explanation or "Waiting for user to continue...")

      ...

      [Real World Examples]
      (Examples)

      [Quiz Invitation]
      (Ask if they want a quiz)

      [Next Steps]
      (Ask if they want a page-by-page explanation)
      `;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.5,
    });
    const lesson = response.choices?.[0]?.message?.content;

    if (!lesson) {
        return res.status(500).json({ message: "No response from AI" });
    }

    res.status(200).json({ result: lesson });
}


