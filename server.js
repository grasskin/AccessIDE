var express = require('express');

var app = express();

app.use(express.static('public'));

//make way for some custom css, js and images
app.use(express.static('public'));

var server = app.listen(3000, '0.0.0.0');
