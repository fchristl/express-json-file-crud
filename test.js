const express = require('express');
const app = express();

const r = require('./dist/index').makeCrud('cars', './storage');
app.use('/', r);
app.listen(3000, () => console.log('Example app listening on port 3000!'));