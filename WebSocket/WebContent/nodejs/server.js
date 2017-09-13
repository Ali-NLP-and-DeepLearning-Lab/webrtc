"use strict";

process.title = 'test';

var webSocketsServerPort = 1337;

var webSocketServer = require('websocket').server;
var http = require('https');
var fs = require('fs');

var history = [];
var clients = {};
var sendType = '';

var options = {
	key : fs.readFileSync('devcloud.uprism.com_20170524CRJP.key.pem'),
	cert : fs.readFileSync('devcloud.uprism.com_20170524CRJP.crt.pem')
}

var server = http.createServer (options, function (request, response) {});

server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort) ;
});

var wsServer = new webSocketServer({
	httpServer : server
});

wsServer.on('request', function (request) {
	
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	
	var connection = request.accept(null, request.origin);
	
	console.log((new Date()) + ' Connection accepted');
	
	connection.on('message', function (message) {

		console.log(message.utf8Data);
		console.log('\n')
		control(message.utf8Data, connection);
		
	});
	
	connection.on('close', function (connection) {
		
		console.log((new Date()) + " peer" + conection.remoteAddress + "disconneted");
		
	});
	
});

function control (data, connection)
{
	var messages 	= data.split('#_#');
	var method 		= messages[1];
	var fromID		= messages[2];
	var toID		= messages[3];
	var data		= messages[4];
	sendType		= messages[0];
	var resData		= method + '#_#' + fromID + '#_#' + toID + '#_#' + data;
	
	
	if ('login' === method)
	{
		console.log('LOGIN - ' + fromID);
		clients[fromID] = connection;
		
		sendMessage(fromID, method + '#_#' + fromID);
	}
	else if ('offer' === method || 'answer' === method)
	{
		sendMessage(toID, resData);
	}
	else
	{
		sendMessage(fromID, resData);
	}
	
}

function sendMessage (id, data)
{
	if (sendType === 'boardcast')
		sendBoardCastMessage(id, data);
	else if (sendType === 'single')
		sendSingleMessage(id, data);
}

function sendBoardCastMessage(id, data)
{
	for (var key in clients)
	{
		if (key == id)
			continue;
		
		clients[key].sendUTF(data);
	}
}

function sendSingleMessage(id, data)
{
	clients[id].sendUTF(data);
}