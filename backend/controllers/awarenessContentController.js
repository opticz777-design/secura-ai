const { AwarenessContent, OutbreakAlert, HealthRecord } = require('../models');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generate = async (req, res) => {
  try {
    const { topic, contentType, language, tone, category, misinfoContext } = req.body;
    
    if (!topic || !contentType || !language || !tone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const allowedFormats = ['Poster', 'WhatsApp Message', 'Audio Clip'];
    if (!allowedFormats.includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid or unsupported format. Allowed formats are: Poster, WhatsApp Message, Audio Clip.' });
    }

    let contextInstruction = `Topic: ${topic}`;
    if (misinfoContext && misinfoContext.isMisinfoHandoff) {
        contextInstruction = `
You are generating Awareness Content based on a Misinformation Check result.
VERIFIED FACT (PRIMARY SOURCE): "${misinfoContext.correctedClaim}"
SUPPORTING EXPLANATION: "${misinfoContext.explanation}"
MISINFORMATION CLAIM (DO NOT AMPLIFY): "${misinfoContext.claimText}"
VERDICT: ${misinfoContext.verdict}

CRITICAL RULES FOR MISINFORMATION:
- The VERIFIED FACT is your primary factual source. Base the content entirely on this fact and the supporting explanation.
- NEVER present the MISINFORMATION CLAIM as medically true.
- If you mention the MISINFORMATION CLAIM, you MUST clearly label it as "Common Myth:" or "False Claim:", immediately followed by "Fact:" and the verified correction.
- The verified correction must be significantly more prominent than the false claim.
- If mentioning the false claim is unnecessary, omit it entirely and focus solely on the verified health information.
- DO NOT invent medications, medication dosages, treatment protocols, medical diagnoses, unsupported cures, or unsupported prevention methods. If the supplied correction does not contain enough detail, provide concise educational content rather than inventing medical details.
- For the headline: Keep it short, professional, and community-friendly. DO NOT include "Original claim:", "Correction:", raw JSON, or long system text in the headline.
- For Audio format: Do not read JSON, database IDs, or internal field names. Keep it conversational.
`;
    }

    let toneInstruction = 'Use simple community-friendly language suitable for rural/semi-urban outreach.';
    if (tone === 'Urgent/Warning') {
        toneInstruction = 'CRITICAL TONE INSTRUCTION: Use an urgent, warning, and serious tone to emphasize immediate action or danger. The language must sound alarming and stress the severity of the situation, while still being understood in rural/semi-urban areas.';
    } else if (tone === 'Formal') {
        toneInstruction = 'CRITICAL TONE INSTRUCTION: Use a formal, official, and professional tone suitable for government health advisories. Avoid overly casual or friendly language.';
    } else if (tone === 'Simple & Friendly') {
        toneInstruction = 'CRITICAL TONE INSTRUCTION: Use a simple, friendly, and reassuring tone suitable for community outreach.';
    }

    const prompt = `You are an AI generating health awareness content for an ASHA (Accredited Social Health Activist) worker in Kerala, India.
${contextInstruction}
Format: ${contentType}
Language: ${language}
Tone: ${tone}

Produce medically responsible health-awareness content.
Avoid inventing statistics or unsupported medical claims. Do not diagnose or prescribe medicine.
${toneInstruction}
CRITICAL REGIONAL INSTRUCTION: Do NOT use Hindi words or slang (e.g., avoid "Namaste", "Didi", "Bhaiya"). The target demographic is Kerala.
If Language is English, use standard English greetings (e.g., "Hello") and use the title "ASHA Worker".
If Language is Malayalam, generate the content entirely in proper Malayalam script and use natural Malayalam cultural greetings (e.g., "Namaskaram"). The title should be transliterated into Malayalam script as "ആശ വർക്കർ" (Do NOT use English letters "ASHA Worker" and do NOT use "ASHA Chechi").
Format the response as JSON with the following structure:
{
  "headline": "A catchy title for the content",
  "generatedText": "The main body of the content",
  "bulletPoints": ["point 1", "point 2", "point 3"],
  "callToAction": "A short closing action statement",
  "audioDuration": "0:45"
}
Ensure the output is valid JSON.`;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
    let response;
    for (const model of modelsToTry) {
        try {
            response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            break; // If successful, break out of loop
        } catch (err) {
            console.error(`[AWARENESS] Model ${model} failed:`, err.message);
        }
    }
    if (!response) {
        return res.status(503).json({ success: false, message: 'All AI models are currently unavailable.' });
    }
    let generatedData;
    try {
        generatedData = JSON.parse(response.text);
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
    }

    res.json({
        success: true,
        data: {
            topic,
            contentType,
            language,
            tone,
            category: category || 'General Health',
            headline: generatedData.headline,
            generatedText: generatedData.generatedText,
            bulletPoints: generatedData.bulletPoints || [],
            callToAction: generatedData.callToAction,
            audioDuration: generatedData.audioDuration || null
        }
    });
  } catch (error) {
    console.error('[AWARENESS] AI Generation Error:', error);
    res.status(500).json({ success: false, message: 'Generation failed', error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    let ashaWorkerId = req.query.ashaWorkerId;
    if (req.user && req.user.role === 'ASHA_WORKER') {
      ashaWorkerId = req.user.ashaWorkerId || req.user.username;
    }
    const where = ashaWorkerId ? { ashaWorkerId } : {};
    const data = await AwarenessContent.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await AwarenessContent.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await AwarenessContent.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await AwarenessContent.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await AwarenessContent.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.share = async (req, res) => {
  try {
    const data = await AwarenessContent.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    data.shareCount = (data.shareCount || 0) + 1;
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.download = async (req, res) => {
  try {
    const data = await AwarenessContent.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    data.downloadCount = (data.downloadCount || 0) + 1;
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.metrics = async (req, res) => {
  try {
    let ashaWorkerId = req.query.ashaWorkerId;
    if (req.user && req.user.role === 'ASHA_WORKER') {
      ashaWorkerId = req.user.ashaWorkerId || req.user.username;
    }
    const where = ashaWorkerId ? { ashaWorkerId } : {};
    
    const count = await AwarenessContent.count({ where });
    const shareSum = await AwarenessContent.sum('shareCount', { where }) || 0;
    const downloadSum = await AwarenessContent.sum('downloadCount', { where }) || 0;
    
    res.json({ 
        success: true, 
        metrics: {
            totalCampaigns: count,
            totalShares: shareSum,
            totalDownloads: downloadSum
        }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.suggestions = async (req, res) => {
  try {
    const suggestions = [];
    
    if (OutbreakAlert) {
      const activeOutbreaks = await OutbreakAlert.findAll({ where: { status: 'Active' }, limit: 2 });
      activeOutbreaks.forEach(alert => {
        suggestions.push({
            topic: `Preventing ${alert.disease} in ${alert.location}`,
            reason: 'Active Outbreak Alert',
            priority: 'High'
        });
      });
    }

    if (suggestions.length === 0) {
        // Return empty array, UI will display empty state message
    }
    
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const googleTTS = require('google-tts-api');

exports.tts = async (req, res) => {
    try {
        const { text, language } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }
        
        const langCode = language === 'Malayalam' ? 'ml' : 'en';
        
        const results = await googleTTS.getAllAudioBase64(text, {
            lang: langCode,
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.?'
        });
        
        res.json({ success: true, chunks: results });
    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

