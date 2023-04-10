const express = require('express');
const webshot = require('webshot-node');
const FormData = require('form-data');
const fs = require('fs');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const port = 80;
const url = 'https://api.telegram.org/bot';
const apiToken = '6051950004:AAFyeSVw-Fg37hACEYI0fJDy_ccHzCzO5Kc';
// Configurations
app.use(bodyParser.json());

const renderMarks = marks => {
  return marks
    .map(
      subject => `
          <tr>
              <th>${subject.subject_code}</th>
              <td>${subject.external}</td>
              <td>${subject.internal}</td>
              <td>${subject.external + subject.internal}</td>
              <td>${subject.is_passed ? 'P' : 'F'}</td>
          </tr>
      `
    )
    .join('\n');
};

const getStyles = () => {
  return `
    <style>
      .result {
        border-collapse: collapse;
        text-align: left;
        margin-top: 50px;
        width: 720px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
              'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      }

      .result th {
        background-color: #c1d2e2 !important;
        border: 1px #1e2ab7 solid !important;
        font-size: 13px !important;
        color: #000000 !important;
        border-collapse: collapse !important;
        border-spacing: 0px !important;
        text-align: left !important;
        padding: 5px 15px;
        word-break: keep-all;
        white-space: nowrap;
      }

      .result td {
        border: 1px #1e2ab7 solid !important;
        border-spacing: 0px !important;
        vertical-align: middle;
        font-size: 13px;
        font-family: verdana;
        font-weight: normal;
        height: 20px;
        padding: 7px;
        background: #e6e8ff;
      }

      .title {
        font-weight: 600;
        font-size: 25px;
        margin: 50px;
        text-align: center;
      }

      .input {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .form {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .required {
        color: red;
      }

      #pin {
        margin: 0 0 0 20px;
        padding: 3px;
        border-radius: 4px;
        border: 1px solid #ccc;
        color: #555;
        font-size: 14px;
        line-height: 1.42857143;
      }
    </style>
  `;
};

const generateHtml = student => {
  return `
    ${getStyles()}
    <div class="titleContainer">
      <h1 class="title">1st Sem Results</h1>
    </div>
    <table class="result" border="1" cellpadding="0" width="60%" align="center">
        <tbody>
            <tr>
                <th>PIN</th>
                <td colspan="5">${student.pin}</td>
            </tr>
            <tr>
                <th>Name</th>
                <td colspan="5">${student.name}</td>
            </tr>
            <tr>
                <th><b>Paper</b></th>
                <td><b>External</b></td>
                <td><b>Internal</b></td>
                <td><b>Total</b></td>
                <td><b>Status</b></td>
            </tr>
            ${renderMarks(student.marks)}
            <tr>
                <th>Grand Total</th>
                <td colspan="5">
                  ${student.marks.reduce(
                    (total, sub) => total + sub.external + sub.internal,
                    0
                  )}
                </td>
            </tr>
            <tr>
                <th>Result</th>
                <td colspan="5">${
                  student.marks.every(sub => sub.is_passed) ? 'PASS' : 'FAIL'
                }</td>
            </tr>
        </tbody>
    </table>`;
};

// Endpoints
app.post('/', (req, res) => {
  const chatId = req.body.message.chat.id;
  const sentMessage = req.body.message.text;

  axios
    .get('https://abhilashkasula.github.io/results-demo/results.json')
    .then(res => res.data)
    .then(data => {
      const student = data.sem_1.find(
        student => student.pin.toLowerCase() === sentMessage.toLowerCase()
      );

      if (!student) {
        axios
          .post(`${url}${apiToken}/sendMessage`, {
            chat_id: chatId,
            text: 'No record found!',
          })
          .then(resp => res.status(200).send(resp))
          .catch(err => res.send(err));
        return;
      }

      const html = generateHtml(student);
      webshot(html, 'results.png', {siteType: 'html'}, err => {
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('photo', fs.createReadStream('results.png'));
        form.append('caption', student.pin);
        axios
          .post(`${url}${apiToken}/sendPhoto`, form, {
            headers: form.getHeaders(),
          })
          .then(response => {
            res.status(200).send(response);
          })
          .catch(error => {
            res.send(error);
          });
      });
    });
});

// Listening
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
