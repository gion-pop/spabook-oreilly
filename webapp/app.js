/**
 * Created by gion on 3/13/15.
 */

"use strict";

var http = require('http'),
    express = require('express'),

    app = express(),
    server = http.createServer(app);


app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/static'));
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});


app.get('/', function(request, response) {
    response.redirect('/spa.html');
});


server.listen(3000);
console.log(
    'Express server listening on port %d in %s mode',
    server.address().port, app.settings.env
);
