const express = require('express');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3000;

// Настраиваем Google Sheets API с секретиками
const credentials = {
  web: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
  },
};
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Устанавливаем refresh_token из секретика
const tokens = {
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
};
oAuth2Client.setCredentials(tokens);

app.use(express.json());
app.use(express.static('build')); // Это чтобы твоя игра загружалась

// Этот кусочек кода нужен для авторизации в Google
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log('Токены получены:', tokens);
    res.send('Авторизация успешна! Можешь закрыть эту вкладку и вернуться в квиз! :3');
  } catch (error) {
    console.error('Ошибка OAuth:', error);
    res.status(500).send('Ошибка авторизации, попробуй снова, милашка! 🐾');
  }
});

// Этот кусочек отправляет тебя на страницу авторизации Google
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
    prompt: 'consent',
  });
  res.redirect(authUrl);
});

// Это нужно, чтобы твоя игра работала правильно
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'build' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});