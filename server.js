const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Раздаем статические файлы из корневой папки
app.use(express.static(path.join(__dirname, './')));

// Для всех маршрутов отдаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Neon Rush Turbo Racers server running on port ${port}`);
});