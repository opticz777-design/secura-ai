const { GoogleGenAI } = require('@google/genai');
const { VoiceEntry, Patient, HealthRecord } = require('../models');
const fs = require('fs');
const path = require('path');

exports.processAudio = async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }

    const language = req.body.language || 'English';
    console.log('[VOICE] Audio received');

    // Upload to Gemini File API
    const uploadResult = await ai.files.upload({
        file: req.file.path,
        config: {
            mimeType: req.file.mimetype,
            displayName: `voice-input-${Date.now()}`
        }
    });

    console.log('[VOICE] Sending audio to Gemini');

    const schema = {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          age: { type: 'INTEGER' },
          gender: { type: 'STRING' },
          village: { type: 'STRING' },
          visitType: { type: 'STRING' },
          symptoms: { type: 'ARRAY', items: { type: 'STRING' } },
          bloodPressure: { type: 'STRING' },
          temperature: { type: 'STRING' },
          pulse: { type: 'INTEGER' },
          weight: { type: 'INTEGER' },
          allergies: { type: 'ARRAY', items: { type: 'STRING' } },
          medicalHistory: { type: 'ARRAY', items: { type: 'STRING' } },
          medications: { type: 'ARRAY', items: { type: 'STRING' } },
          clinicalSummary: { type: 'STRING' },
          notes: { type: 'STRING' }
        }
      };

    const prompt = `You are extracting structured patient information from an ASHA worker's spoken clinical intake.

Extract ONLY information explicitly stated in the audio/transcript.

Never infer missing values EXCEPT for gender from the patient's name.
Never guess.
Never calculate medical values.
Never copy one field's value into another field.
If a value is not explicitly mentioned, return null unless it is gender inferred from the name.

You may logically infer gender if the patient's name is unambiguous (e.g. Adithyan -> Male, Lakshmi -> Female).
Do not infer age from any other information.
Do not derive pulse from blood pressure or age.
Do not derive blood pressure from symptoms.
Do not derive temperature from symptoms.
Do not convert or calculate medical values unless the exact value was explicitly spoken.
Do not invent symptoms, allergies, diagnoses, medications, clinical notes, or medical history.

Preserve the meaning of Malayalam speech accurately.

The speaker may use:
- Malayalam
- English
- Malayalam mixed with English
- Malayalam medical terminology
- English medical terminology
- Numbers spoken naturally

Normalize structured fields where appropriate, but never change the underlying meaning.

For example:
'പേര് ലക്ഷ്മി, വയസ്സ് 45' -> name = 'ലക്ഷ്മി', age = 45
'BP 120/80' -> bloodPressure = '120/80'
'Temperature 100 degree' -> temperature = '100'

If pulse was not mentioned -> pulse = null.

Return valid structured JSON only.`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest'];
    let response;
    for (const model of modelsToTry) {
        try {
            response = await ai.models.generateContent({
                model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
                            { text: prompt }
                        ]
                    }
                ],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            transcript: { type: 'STRING', description: 'The exact transcript of the audio.' },
                            extractedData: schema
                        },
                        required: ['transcript', 'extractedData']
                    }
                }
            });
            break; // If successful, exit loop
        } catch (err) {
            console.error(`[VOICE] Model ${model} failed:`, err.message);
        }
    }
    
    if (!response) {
        fs.unlinkSync(req.file.path);
        return res.status(503).json({ success: false, error: 'All AI models are currently unavailable.' });
    }

    // Move the file instead of unlinking
    const safeFilename = path.basename(req.file.path) + '.webm';
    const destPath = path.join(__dirname, '../uploads/voice-recordings', safeFilename);
    fs.renameSync(req.file.path, destPath);

    console.log('[VOICE] Gemini transcription completed');
    console.log('[VOICE] Gemini extraction completed');
    console.log('[VOICE] Validating extracted data');

    let responseData;
    try {
        responseData = JSON.parse(response.text);
        console.log('[VOICE] Extracted Data from Gemini:', JSON.stringify(responseData.extractedData, null, 2));
    } catch (e) {
        console.error('[VOICE] Validation error: Invalid JSON returned from Gemini');
        return res.status(500).json({ success: false, message: 'Invalid response from AI' });
    }

    const ex = responseData.extractedData || {};
    const validatedData = {
        name: ex.name || null,
        age: (typeof ex.age === 'number' && ex.age !== 0) ? ex.age : null,
        gender: ex.gender || null,
        village: ex.village || null,
        visitType: 'Voice Input Consult',
        symptoms: Array.isArray(ex.symptoms) ? ex.symptoms : (ex.symptoms ? [ex.symptoms] : []),
        bloodPressure: ex.bloodPressure || null,
        temperature: ex.temperature || null,
        pulse: (typeof ex.pulse === 'number' && ex.pulse !== 0) ? ex.pulse : null,
        weight: (typeof ex.weight === 'number' && ex.weight !== 0) ? ex.weight : null,
        allergies: Array.isArray(ex.allergies) ? ex.allergies : (ex.allergies ? [ex.allergies] : []),
        medicalHistory: Array.isArray(ex.medicalHistory) ? ex.medicalHistory : (ex.medicalHistory ? [ex.medicalHistory] : []),
        medications: Array.isArray(ex.medications) ? ex.medications : (ex.medications ? [ex.medications] : []),
        clinicalSummary: ex.clinicalSummary || null,
        notes: ex.notes || null
    };

    return res.json({
      success: true,
      transcript: responseData.transcript,
      language: language,
      extractedData: validatedData,
      audioUrl: safeFilename
    });

  } catch (error) {
    console.error('[VOICE] Gemini processing error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: 'Processing failed', error: error.message });
  }
};

exports.saveEntry = async (req, res) => {
  try {
    const { transcript, language, extractedData, status, audioUrl } = req.body;
    console.log('[VOICE] Saving voice entry');

    const searchName = (extractedData.name || extractedData.patientName || '').trim();
    let patient = null;
    if (searchName) {
        const { Sequelize } = require('sequelize');
        patient = await Patient.findOne({ 
            where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), searchName.toLowerCase())
        });
    }

    const recordVitals = {
      bp: extractedData.bloodPressure || null,
      pulse: extractedData.pulse || null,
      temp: extractedData.temperature || null,
      weight: extractedData.weight || null,
      spO2: null
    };

    if (!patient) {
      patient = await Patient.create({
        name: extractedData.name, // Will throw validation error safely if null and required by model
        age: typeof extractedData.age === 'number' ? extractedData.age : null,
        gender: extractedData.gender || null,
        village: extractedData.village || null,
        status: 'Registered',
        lastVisit: new Date(),
        timestamp: new Date().toISOString(),
        avatar: 'default.jpg',
        phone: null,
        address: extractedData.village || null,
        emergencyContact: null,
        registrationDate: new Date().toISOString(),
        assignedAsha: 'ASHA Worker',
        abhaId: null,
        conditions: extractedData.symptoms || []
      });
    }

    await HealthRecord.create({
      patientId: patient.id,
      visitType: extractedData.visitType || 'Voice Input Consult',
      date: new Date(),
      recordedBy: 'ASHA Worker',
      symptoms: Array.isArray(extractedData.symptoms) ? extractedData.symptoms.join(', ') : (extractedData.symptoms || 'None'),
      vitals: recordVitals,
      notes: extractedData.notes || '',
      status: 'Reviewed'
    });

    const entryId = `VE-${Date.now().toString().slice(-4)}`;
    const voiceEntry = await VoiceEntry.create({
      id: entryId,
      patientId: patient.id,
      transcript: transcript,
      language: language,
      extractedData: extractedData,
      status: status || 'Saved',
      audioUrl: audioUrl || null
    });

    console.log('[VOICE] Voice entry saved successfully');
    return res.status(201).json({ success: true, data: voiceEntry, patient: patient });

  } catch (error) {
    console.error('[VOICE] Database save error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save entry', error: error.message });
  }
};

exports.getRecentEntries = async (req, res) => {
  try {
    const entries = await VoiceEntry.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{ model: Patient }]
    });

    // Format for frontend
    const formatted = entries.map(e => {
      let symptomsStr = 'No symptoms';
      if (Array.isArray(e.extractedData?.symptoms) && e.extractedData.symptoms.length > 0) {
          symptomsStr = e.extractedData.symptoms.join(', ');
      } else if (typeof e.extractedData?.symptoms === 'string' && e.extractedData.symptoms.trim() !== '') {
          symptomsStr = e.extractedData.symptoms;
      }

      return {
        id: e.id,
        patientName: e.Patient ? e.Patient.name : (e.extractedData?.name || e.extractedData?.patientName || 'Unknown'),
        summary: symptomsStr + (e.extractedData?.bloodPressure ? ` · BP ${e.extractedData.bloodPressure}` : ''),
        timestamp: e.createdAt,
        status: e.status,
        language: e.language
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching voice entries:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch entries', error: error.message });
  }
};

exports.getAudio = (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const filepath = path.join(__dirname, '../uploads/voice-recordings', filename);
    
    if (fs.existsSync(filepath)) {
      res.setHeader('Content-Type', 'audio/webm'); // or appropriate mime type
      res.sendFile(filepath);
    } else {
      res.status(404).json({ success: false, error: 'Audio not found' });
    }
  } catch (err) {
    console.error('Error streaming audio:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
