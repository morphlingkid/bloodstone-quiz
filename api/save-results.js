const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async (req, res) => {
  console.log('Получен запрос на /api/save-result:', req.body);
  if (req.method !== 'POST') {
    console.log('Метод не POST, возвращаем 405');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { name, score, dateTime } = req.body;

  if (!name || !score || !dateTime) {
    console.log('Отсутствуют обязательные поля:', { name, score, dateTime });
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    console.log('Инициализация Google Spreadsheet...');
    const doc = new GoogleSpreadsheet('1MJPzSjXdG37m6T3RN_ZwfpBltJBYDQm3vx8gbB24VNM');
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    console.log('Загрузка информации о документе...');
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    console.log('Добавление строки в таблицу...');
    await sheet.addRow({ Name: name, Score: score, DateTime: dateTime });

    console.log('Данные успешно сохранены!');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения в Google Sheets:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};