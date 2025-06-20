const express = require('express');
const app = express();
const PORT = 3050;

app.get('/hello', (req, res) => {
  res.send('Hello World! Test server is working.');
});

app.get('/test', (req, res) => {
  res.send('<h1>Test Route Working</h1><p>Server is responding correctly.</p>');
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Try: http://localhost:3050/hello');
  console.log('Try: http://localhost:3050/test');
});
