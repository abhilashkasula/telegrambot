const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const { reply } = require('./telegram');
const port = 80;
const url = 'https://api.telegram.org/bot';
const apiToken = '6051950004:AAFyeSVw-Fg37hACEYI0fJDy_ccHzCzO5Kc';
// Configurations
app.use(bodyParser.json());

// Endpoints
app.post('/', (req, res) => {
  const chatId = req.body.message.chat.id;
  const messageReceived = req.body.message.text;

  axios
    .post(`${url}${apiToken}/sendMessage`, {
      chat_id: chatId,
      text: reply(messageReceived),
    })
    .then(resp => res.status(200).send(resp))
    .catch(err => res.send(err));
});

// Listening
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
