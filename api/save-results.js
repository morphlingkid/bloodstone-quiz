const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { name, score, dateTime } = req.body;

  if (!name || !score || !dateTime) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    // Инициализация Google Spreadsheet
    const doc = new GoogleSpreadsheet('1MJPzSjXdG37m6T3RN_ZwfpBltJBYDQm3vx8gbB24VNM');
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Первый лист (Sheet1)

    await sheet.addRow({ Name: name, Score: score, DateTime: dateTime });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};