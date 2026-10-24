import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3001; // Defaults to 3001 to avoid conflicting with Next.js on 3000

// 1. Setup tools
const upload = multer({ storage: multer.memoryStorage() }); // Keeps file in memory, not on disk

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 2. Create the API Endpoint
app.post('/api/upload-brand-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    // --- STEP A: UPLOAD & EXTRACT ---
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF uploaded' });
    }

    // Read the PDF from the memory buffer using pdf-parse
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      await parser.load();
      const parseResult = await parser.getText();
      await parser.destroy();
      pdfText = typeof parseResult === 'string' ? parseResult : (parseResult?.text || '');
    } catch {
      pdfText = req.file.buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
    }

    // --- STEP B: AI STRUCTURING ---
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      You are an expert data extractor. Extract specific brand rules from the text below.
      Return ONLY a JSON object with this exact structure:
      {
        "banned_words": [
          {
            "word": "string",
            "category": "Tone",
            "severity": "critical",
            "reason": "string",
            "alternatives": ["string"]
          }
        ],
        "facts": [
          {
            "claim": "string",
            "source": "string"
          }
        ],
        "hex_colors": [
          {
            "name": "string",
            "hex": "#string"
          }
        ]
      }
      Text to analyze:
      ${pdfText}
    `;

    const result = await model.generateContent(prompt);
    const brandData = JSON.parse(result.response.text());

    // --- STEP C: SAVE TO SUPABASE ---
    const { data: savedData, error: dbError } = await supabase
      .from('brand_guidelines')
      .insert([{
        source_name: req.file.originalname,
        data: brandData,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (dbError) {
      console.warn('Notice on Supabase save:', dbError.message);
    }

    // Send success response back to the frontend
    res.json({ success: true, data: savedData || brandData });
  } catch (error) {
    console.error('Pipeline Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
