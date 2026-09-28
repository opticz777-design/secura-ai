const { Consultation, Patient, User } = require('../models');
const { GoogleGenAI } = require('@google/genai');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.getAll = async (req, res) => {
  try {
    const records = await Consultation.findAll({
      include: [{ model: Patient }]
    });
    // Flatten patient details
    const data = records.map(r => {
      const record = r.toJSON();
      if (record.Patient) {
        record.patientName = record.Patient.name;
        record.age = record.Patient.age;
        record.gender = record.Patient.gender;
        record.village = record.Patient.village;
      }
      return record;
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await Consultation.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.patientId) return res.status(400).json({ success: false, error: 'patientId is required' });
    const data = await Consultation.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await Consultation.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await Consultation.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.simplify = async (req, res) => {
  try {
    const { doctorNotes, language } = req.body;
    if (!doctorNotes) return res.status(400).json({ success: false, error: 'doctorNotes is required' });

    let langInstruction = language === 'ml' ? 'Malayalam' : 'English';
    const prompt = `You are a medical assistant helping an ASHA worker explain a doctor's prescription to a patient in rural India.
Translate and simplify the following doctor's notes into patient-friendly instructions in ${langInstruction}.
- Use bullet points.
- Keep the language simple and avoid complex medical jargon.
- If Language is Malayalam, generate the content entirely in proper Malayalam script.

Doctor Notes:
${doctorNotes}

Return ONLY the simplified summary text, nothing else.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
    let response;
    for (const model of modelsToTry) {
        try {
            response = await ai.models.generateContent({
                model: model,
                contents: prompt,
            });
            break;
        } catch (error) {
            console.error(`[CONSULTATION] Model ${model} failed:`, error.message || error);
        }
    }

    if (!response) {
      return res.status(500).json({ success: false, error: 'Failed to generate simplified advice from AI.' });
    }

    const simplifiedText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ success: true, simplifiedNotes: simplifiedText });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.notifyPatient = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [{ model: Patient }]
    });

    if (!consultation) {
      return res.status(404).json({ success: false, notified: false, message: 'Consultation not found' });
    }

    const patient = consultation.Patient;
    if (!patient) {
      return res.status(404).json({ success: false, notified: false, message: 'Patient not found' });
    }

    if (!patient.email) {
      return res.status(400).json({ 
        success: false, 
        notified: false, 
        code: "PATIENT_EMAIL_MISSING",
        message: "Patient email address is not available." 
      });
    }

    if (consultation.patientNotified) {
      return res.status(409).json({ 
        success: true, 
        notified: true, 
        alreadyNotified: true,
        message: "Patient has already been notified." 
      });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, notified: false, message: 'RESEND_API_KEY is missing in server environment.' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f766e; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">SynCura AI – Doctor Consultation Update</h2>
        </div>
        <div style="padding: 20px; background-color: #f8fafc;">
          <p>Dear <strong>${patient.name}</strong>,</p>
          <p>Your doctor consultation through SynCura AI has been reviewed by the medical officer.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff; width: 35%;"><strong>Consultation Date</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${new Date(consultation.submittedAt).toLocaleDateString()}</td></tr>
            ${consultation.doctorNotes ? `<tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Doctor's Advice</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${consultation.doctorNotes}</td></tr>` : ''}
          </table>

          <p>Please follow the medical advice provided by your healthcare professional.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">This notification was sent through SynCura AI as part of your healthcare coordination workflow.</p>
          <p style="color: #64748b; font-size: 14px;">Regards,<br/>SynCura AI<br/>Healthcare Coordination System</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'SYNCURA AI <onboarding@resend.dev>',
      to: [patient.email],
      subject: 'SynCura AI – Doctor Consultation Update',
      html: htmlContent
    });

    if (error) {
      console.error("[CONSULTATION EMAIL] Email send failed:", error);
      return res.status(500).json({ 
        success: false, 
        notified: false,
        code: "EMAIL_SEND_FAILED",
        message: 'Unable to send patient notification.' 
      });
    }

    console.log(`[CONSULTATION EMAIL] Patient notification sent successfully for consultation ID ${consultation.id}`);
    
    // Only after email succeeds
    consultation.patientNotified = true;
    await consultation.save();

    res.json({ success: true, notified: true, message: 'Patient notification email sent successfully.', data });
    
  } catch (error) {
    console.error("[CONSULTATION EMAIL] Unexpected error:", error);
    res.status(500).json({ success: false, notified: false, message: error.message });
  }
};
