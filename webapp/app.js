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

app.all('/user/*?', function(request, response, next) {
    response.contentType('json');
    next();
});

app.get('/user/list', function(request, response) {
    response.send({title: 'user list'});
});

app.post('/user/create', function(request, response) {
    response.send({title: 'user created'});
});

app.get('/user/read/:id([0-9]+)', function(request, response) {
    response.send({
        title: 'user with id ' + request.params.id + ' found'
    });
});

app.get('/user/update/:id([0-9]+)', function(request, response) {
    response.send({
        title: 'user with id ' + request.params.id + ' updated'
    });
});

app.get('/user/delete/:id([0-9]+)', function(request, response) {
    response.send({
        title: 'user with id ' + request.params.id + ' deleted'
    });
});


server.listen(3000);
console.log(
    'Express server listening on port %d in %s mode',
    server.address().port, app.settings.env
);
