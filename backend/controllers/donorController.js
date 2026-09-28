const { Resend } = require('resend');
const crypto = require('crypto');
const { Donor, BloodRequest, BloodDonationResponse, NotificationToken } = require('../models');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

exports.getAll = async (req, res) => {
  try {
    const data = await Donor.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await Donor.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await Donor.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await Donor.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await Donor.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.notifyDonor = async (req, res) => {
  const { id } = req.params;
  const { requestId } = req.body;

  try {
    const donor = await Donor.findByPk(id);
    if (!donor) return res.status(404).json({ success: false, error: 'Donor not found' });

    if (!donor.email) {
      return res.status(400).json({ success: false, error: 'Donor does not have an email address.' });
    }

    const request = await BloodRequest.findByPk(requestId) || await BloodRequest.findOne({ where: { patientName: requestId } });

    if (!request) {
       return res.status(404).json({ success: false, error: 'Blood request not found in database' });
    }

    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

    await NotificationToken.create({
      token: tokenString,
      donorId: donor.id,
      bloodRequestId: request.id,
      expiresAt: expiresAt
    });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Links for YES/NO buttons
    const yesLink = `${backendUrl}/api/donors/email/respond?token=${tokenString}&response=WILLING`;
    const noLink = `${backendUrl}/api/donors/email/respond?token=${tokenString}&response=NOT_AVAILABLE`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e11d48; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">🚨 Urgent Blood Donation Request</h2>
        </div>
        <div style="padding: 20px; background-color: #f8fafc;">
          <p>Dear <strong>${donor.name}</strong>,</p>
          <p>Your blood type (<strong>${request.bloodGroup}</strong>) is urgently needed. Please see the request details below:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff; width: 35%;"><strong>Patient Name</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${request.patientName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Required Group</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff; color: #e11d48; font-weight: bold;">${request.bloodGroup}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Units Needed</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${request.unitsNeeded}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Urgency</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${request.urgency}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Hospital</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${request.hospital}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Location</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${request.village}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Request Date</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">${new Date(request.postedAt).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;"><strong>Request ID</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fff;">REQ-${request.id}</td></tr>
          </table>

          <p style="text-align: center; margin-top: 30px; font-weight: bold;">Can you donate?</p>
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${yesLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">YES, I CAN DONATE</a>
            <a href="${noLink}" style="display: inline-block; background-color: #64748b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">NO, I AM NOT AVAILABLE</a>
          </div>
        </div>
      </div>
    `;

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'RESEND_API_KEY is missing in server environment.' });
    }

    const { data, error } = await resend.emails.send({
      from: 'SYNCURA AI <onboarding@resend.dev>',
      to: [donor.email],
      subject: `Urgent Blood Donation Request [REQ-${request.id}]`,
      html: htmlContent
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Notification email sent successfully via Resend.', data });
    
  } catch (error) {
    console.error("Error in notifyDonor:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.emailRespond = async (req, res) => {
  const { token, response } = req.query;

  if (!token || !response) {
    return res.status(400).send("Missing required parameters.");
  }

  try {
    const notificationToken = await NotificationToken.findByPk(token);

    if (!notificationToken || notificationToken.status !== 'PENDING' || new Date() > notificationToken.expiresAt) {
      return res.send(`
        <div style="text-align:center; padding: 50px; font-family: Arial, sans-serif;">
          <h2 style="color: #ef4444;">Link Expired or Invalid</h2>
          <p style="font-size: 18px;">This response link has expired or has already been used.</p>
        </div>
      `);
    }

    const donorId = notificationToken.donorId;
    const requestId = notificationToken.bloodRequestId;

    const donor = await Donor.findByPk(donorId);
    if (!donor) return res.status(404).send("Donor not found.");

    const request = await BloodRequest.findByPk(requestId);
    if (!request) return res.status(404).send("Blood request not found.");

    // Check for duplicate response
    const existing = await BloodDonationResponse.findOne({ where: { donorId, bloodRequestId: requestId }});
    
    if (existing) {
       // if they used a different token but already responded
       notificationToken.status = 'USED';
       await notificationToken.save();
       return res.send(`
         <div style="text-align:center; padding: 50px; font-family: Arial, sans-serif;">
           <h2 style="color: #ef4444;">Response Already Recorded</h2>
           <p style="font-size: 18px;">This response link has expired or has already been used.</p>
         </div>
       `);
    }

    await BloodDonationResponse.create({
      bloodRequestId: requestId,
      donorId,
      response,
      respondedAt: new Date()
    });

    notificationToken.status = 'USED';
    await notificationToken.save();

    const isWilling = response === 'WILLING';

    res.send(`
      <div style="text-align:center; padding: 50px; font-family: Arial, sans-serif;">
        <h1 style="color: ${isWilling ? '#10b981' : '#64748b'};">${isWilling ? 'Thank You!' : 'Response Recorded'}</h1>
        <p style="font-size: 18px;">
          ${isWilling 
            ? 'Thank you! Your response has been recorded. The SynCura AI health coordinator has been notified.' 
            : 'Your response has been recorded. Thank you for responding.'}
        </p>
        <p style="color: #64748b; margin-top: 30px;">You can close this window.</p>
      </div>
    `);

  } catch (error) {
    res.status(500).send("Internal Server Error: " + error.message);
  }
};

exports.handleInboundEmailWebhook = async (req, res) => {
  try {
    const payload = req.body;
    
    const fromEmailMatch = payload.from?.match(/<([^>]+)>/);
    const fromEmail = fromEmailMatch ? fromEmailMatch[1] : payload.from;
    
    if (!fromEmail) {
      return res.status(400).send('No sender found');
    }

    // Find donor by email
    const donor = await Donor.findOne({ where: { email: fromEmail }});
    if (!donor) {
      return res.status(404).send('Donor not found');
    }

    // Extract request ID from subject like [REQ-1]
    const subject = payload.subject || '';
    const reqIdMatch = subject.match(/REQ-(\d+)/);
    
    if (!reqIdMatch) {
      return res.status(400).send('Could not identify request ID from subject');
    }

    const requestId = reqIdMatch[1];
    
    const request = await BloodRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).send('Blood request not found');
    }

    // Parse the reply text
    const text = (payload.text || payload.html || '').toLowerCase();
    
    let status = 'NEEDS_REVIEW';
    if (text.includes('yes') || text.includes('available') || text.includes('can donate')) {
      status = 'WILLING';
    } else if (text.includes('no') || text.includes('not available') || text.includes('cannot donate')) {
      status = 'NOT_AVAILABLE';
    }

    // Save or update response
    let responseObj = await BloodDonationResponse.findOne({ where: { donorId: donor.id, bloodRequestId: requestId }});
    if (!responseObj) {
      await BloodDonationResponse.create({
        bloodRequestId: requestId,
        donorId: donor.id,
        response: status,
        originalEmailContent: payload.text || payload.html || 'No content provided',
        respondedAt: new Date()
      });
    } else {
      // update response
      responseObj.response = status;
      responseObj.originalEmailContent = payload.text || payload.html || 'No content provided';
      responseObj.respondedAt = new Date();
      await responseObj.save();
    }

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send(error.message);
  }
};

exports.saveResponse = async (req, res) => {
  const { id } = req.params;
  const { requestId, response } = req.body;

  if (!requestId || !response) {
    return res.status(400).json({ success: false, error: 'requestId and response are required' });
  }

  try {
    const donor = await Donor.findByPk(id);
    if (!donor) return res.status(404).json({ success: false, error: 'Donor not found' });

    const newResponse = await BloodDonationResponse.create({
      bloodRequestId: requestId,
      donorId: id,
      response: response,
      respondedAt: new Date()
    });

    res.status(201).json({ success: true, data: newResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllResponses = async (req, res) => {
  try {
    const data = await BloodDonationResponse.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

