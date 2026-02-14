export async function sendOtpEmail(email, otp) {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
      throw new Error('Missing Brevo configuration: BREVO_API_KEY or BREVO_SENDER_EMAIL')
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: 'Shelter Lab'
        },
        to: [{ email, name: 'User' }],
        subject: 'Verify Your University Email - Shelter Lab',
        htmlContent: getEmailTemplate(otp),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Brevo API error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Brevo email error:', error.message)
    }
    return { success: false, error: error.message }
  }
}

function getEmailTemplate(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif; 
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container { 
      max-width: 500px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      border-radius: 12px; 
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); 
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 50px 20px; 
      text-align: center; 
      color: #ffffff;
    }
    .header h1 { 
      font-size: 32px; 
      font-weight: 700; 
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p { 
      font-size: 14px; 
      opacity: 0.95; 
      font-weight: 500;
    }
    .content { 
      padding: 40px 32px; 
    }
    .greeting { 
      font-size: 16px; 
      color: #1a202c; 
      margin-bottom: 16px; 
      font-weight: 600;
    }
    .instruction { 
      font-size: 15px; 
      color: #4a5568; 
      margin-bottom: 32px; 
      line-height: 1.7;
    }
    .code-container {
      background: linear-gradient(135deg, #f5f7fa 0%, #eff2f5 100%);
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 32px 24px;
      margin: 32px 0;
      text-align: center;
    }
    .code-label { 
      font-size: 11px; 
      color: #718096; 
      text-transform: uppercase; 
      letter-spacing: 2px; 
      margin-bottom: 16px; 
      font-weight: 700;
      display: block;
    }
    .code { 
      font-size: 56px; 
      font-weight: 800; 
      color: #667eea; 
      letter-spacing: 12px; 
      font-family: 'Monaco', 'Courier New', monospace; 
      word-break: break-all;
      line-height: 1.2;
    }
    .expiry-notice { 
      font-size: 13px; 
      color: #718096; 
      margin-top: 16px; 
      padding-top: 16px; 
      border-top: 1px solid #e2e8f0;
      font-weight: 500;
    }
    .security-note { 
      background-color: #fffaf0; 
      border-left: 4px solid #f6ad55; 
      padding: 16px 20px; 
      margin: 24px 0; 
      border-radius: 4px; 
      font-size: 14px; 
      color: #7c2d12; 
      line-height: 1.6;
    }
    .security-note strong {
      display: block;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .action-text {
      font-size: 15px;
      color: #4a5568;
      margin: 24px 0;
      line-height: 1.7;
    }
    .footer { 
      padding: 24px 32px; 
      background-color: #f7fafc; 
      text-align: center; 
      border-top: 1px solid #e2e8f0;
    }
    .footer-text { 
      font-size: 13px; 
      color: #718096; 
      line-height: 1.6;
      margin: 8px 0;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 16px 0;
    }
    @media (max-width: 480px) {
      .content { padding: 24px 20px; }
      .header { padding: 36px 16px; }
      .footer { padding: 16px 20px; }
      .code { font-size: 48px; letter-spacing: 8px; }
      .header h1 { font-size: 26px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email</h1>
      <p>Shelter Lab - University Marketplace</p>
    </div>
    <div class="content">
      <p class="greeting">Welcome to Shelter Lab!</p>
      <p class="instruction">To complete your university email verification, please use the verification code below:</p>
      
      <div class="code-container">
        <span class="code-label">Your Verification Code</span>
        <div class="code">${otp}</div>
        <div class="expiry-notice">⏱️ This code expires in 15 minutes</div>
      </div>

      <p class="action-text">Enter this code in your browser to verify your university email address and unlock all Shelter Lab features.</p>

      <div class="security-note">
        <strong>🔒 Security Notice</strong>
        Never share this code with anyone. Shelter Lab support will never ask for your verification code.
      </div>

      <div class="divider"></div>
      
      <p class="instruction" style="margin: 16px 0 8px 0; font-size: 14px;">
        <strong>Didn't request this code?</strong> You can safely ignore this email or contact our support team.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">&copy; 2026 Shelter Lab. All rights reserved.</p>
      <p class="footer-text">University Marketplace for Student Trading</p>
    </div>
  </div>
</body>
</html>`
}
