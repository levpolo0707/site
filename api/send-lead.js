export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, route, cargo, message } = req.body || {};

    const text =
`Новая заявка с сайта ГРЭК
Имя: ${name || '-'}
Телефон: ${phone || '-'}
Маршрут: ${route || '-'}
Груз: ${cargo || '-'}
Комментарий: ${message || '-'}`;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const TO_EMAIL = process.env.TO_EMAIL || 'GREK0708@bk.ru';

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !RESEND_API_KEY) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text
      })
    });

    if (!tgResponse.ok) {
      const tgError = await tgResponse.text();
      return res.status(500).json({ error: 'Telegram send failed', details: tgError });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: 'Новая заявка с сайта ГРЭК',
        html: `
          <h2>Новая заявка с сайта ГРЭК</h2>
          <p><strong>Имя:</strong> ${name || '-'}</p>
          <p><strong>Телефон:</strong> ${phone || '-'}</p>
          <p><strong>Маршрут:</strong> ${route || '-'}</p>
          <p><strong>Груз:</strong> ${cargo || '-'}</p>
          <p><strong>Комментарий:</strong> ${message || '-'}</p>
        `
      })
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      return res.status(500).json({ error: 'Email send failed', details: emailError });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Send failed', details: error.message });
  }
}
