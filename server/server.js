"use strict";

var webSocketsServerPort = 1337;

var webSocketServer = require('websocket').server;
var http = require('https');
var fs = require('fs');
var controller = require('./rtcController.js');
var rtcCtrl = controller();

var options = {
	key : fs.readFileSync(' -- KEY -- '),
	cert : fs.readFileSync(' -- CERT -- ')
}

var server = http.createServer (options, function (request, response) {});

server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort) ;
});

var wsServer = new webSocketServer({
	httpServer : server
});

wsServer.on('request', function (request) {
	
	var connection = request.accept(null, request.origin);
	
	connection.on('message', function (message) {

		rtcCtrl.invoke(message.utf8Data, connection);
		
	});
	
	connection.on('close', function (connection) {
		
		console.log((new Date()) + " peer" + connection.remoteAddress + "disconneted");
		
	});
	
});
