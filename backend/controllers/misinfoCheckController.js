const fs = require('fs');
const { MisinfoCheck } = require('../models');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.check = async (req, res) => {
  try {
    const { claimText, language } = req.body;
    let ashaWorkerId = req.body.ashaWorkerId;
    let ashaWorkerName = req.body.ashaWorkerName;
    let healthCentre = req.body.healthCentre;

    if (req.user && req.user.role === 'ASHA_WORKER') {
      ashaWorkerId = req.user.ashaWorkerId || req.user.username;
      ashaWorkerName = req.user.displayName;
      healthCentre = req.user.healthCentre;
    }
    let screenshotPath = null;
    let sourceType = 'text';
    
    if (req.file) {
      screenshotPath = req.file.path;
      sourceType = claimText ? 'text_and_screenshot' : 'screenshot';
    } else if (!claimText) {
      return res.status(400).json({ success: false, message: 'Please provide text or a screenshot.' });
    }
    
    const prompt = `You are a medical information verification system for community health workers (ASHA workers).
Analyze the following health claim: "${claimText || 'No text provided. Analyze the attached screenshot.'}"

Determine whether the claim is supported, contradicted, or cannot be reliably verified.
Never fabricate medical evidence.
Never invent studies, organizations, statistics, URLs, or citations.
Do not infer facts that are not present.
Clearly distinguish between:
1. "Verified True"
2. "False / Misleading"
3. "Unverified"
If evidence is insufficient, choose "Unverified" rather than guessing.
Explain the reasoning in simple language suitable for an ASHA worker.
Provide a corrected statement when the claim is false or misleading.
Identify potential public-health risk.
Avoid diagnosis or individualized medical treatment.
Encourage consultation with qualified healthcare professionals when appropriate.

Return your response strictly in the following JSON structure:
{
  "verdict": "Verified True | False / Misleading | Unverified",
  "confidence": 0.95,
  "category": "General Health",
  "riskLevel": "Low | Medium | High",
  "explanation": "...",
  "correctedClaim": "...",
  "keyFacts": ["fact 1", "fact 2"],
  "recommendation": "..."
}
`;

    let payloadContents = [prompt];
    
    if (screenshotPath) {
        const fileBytes = fs.readFileSync(screenshotPath);
        const base64Data = fileBytes.toString('base64');
        payloadContents.push({
            inlineData: {
                data: base64Data,
                mimeType: req.file.mimetype || 'image/jpeg'
            }
        });
    }

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
    let response;
    
    for (const model of modelsToTry) {
        try {
            response = await ai.models.generateContent({
                model,
                contents: payloadContents,
                config: { responseMimeType: 'application/json' }
            });
            break;
        } catch (err) {
            console.error(`[MISINFO] Model ${model} failed:`, err.message);
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
    
    const newCheck = await MisinfoCheck.create({
      ashaWorkerId,
      ashaWorkerName,
      healthCentre,
      claimText: claimText || '',
      sourceType,
      screenshotPath,
      language: language || 'English',
      verdict: generatedData.verdict,
      confidence: generatedData.confidence,
      explanation: generatedData.explanation,
      correctedClaim: generatedData.correctedClaim,
      keyFacts: generatedData.keyFacts || [],
      riskLevel: generatedData.riskLevel,
      category: generatedData.category,
      recommendation: generatedData.recommendation,
      aiModel: 'gemini'
    });
    
    res.json({ success: true, data: newCheck });
  } catch (error) {
    console.error('[MISINFO] Check Error:', error);
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    let ashaWorkerId = req.query.ashaWorkerId;
    if (req.user && req.user.role === 'ASHA_WORKER') {
      ashaWorkerId = req.user.ashaWorkerId || req.user.username;
    }
    const where = ashaWorkerId ? { ashaWorkerId } : {};
    const data = await MisinfoCheck.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const { healthCentre } = req.query;
    const where = healthCentre ? { healthCentre } : {};
    
    const recentMyths = await MisinfoCheck.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 10
    });
    
    res.json({ success: true, data: recentMyths });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await MisinfoCheck.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await MisinfoCheck.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await MisinfoCheck.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await MisinfoCheck.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await MisinfoCheck.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
