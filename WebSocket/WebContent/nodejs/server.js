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
	
//	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	
	var connection = request.accept(null, request.origin);
	
//	console.log((new Date()) + ' Connection accepted');
	
	connection.on('message', function (message) {

		control(message.utf8Data, connection);
		
	});
	
	connection.on('close', function (connection) {
		
		console.log((new Date()) + " peer" + connection.remoteAddress + "disconneted");
		
	});
	
});

function control (data, connection)
{
	console.log('-- Receive Data --')
	console.log(data);
	
	var message = JSON.parse(data);
	
	var method 		= message.method;
	var fromID		= message.from;
	var toID		= message.to;
	var data		= message.message;
	sendType		= message.type;
	
	var resultData	= {
			'method' : method,
			'from' : fromID,
			'toID' : toID,
			'data' : data
	}
	
	switch (method)
	{
		case 'login':
			clients[fromID] = {};
			clients[fromID].roomID		= '';
			clients[fromID].connection 	= connection; 
			
			resultData.data = 'login ok';
			sendMessage(fromID, JSON.stringify(resultData));
			break;
		case 'logout':
			resultData.data = 'logout ok';
			sendMessage(fromID, JSON.stringify(resultData));
			
			delete clients[fromID];
			break;
		case 'offer':
		case 'answer':
			sendMessage(toID, JSON.stringify(resultData));
			break;
		case 'attend':
			var room				= JSON.parse(data);
			resultData.method		= 'invite';
			var attendRoomID 		= room.roomID;
			
			clients[fromID].roomID 	= attendRoomID;
			
			for (var key in clients)
			{
				if (key == fromID)
					continue;
				
				if (clients[key].roomID == attendRoomID)
				{
					sendMessage(key, JSON.stringify(resultData));
				}
			}
			break;
		case 'exit':
			var room				= JSON.parse(data);
			var attendRoomID 		= room.roomID;
			
			for (var key in clients)
			{
				console.log('fromID : ' + fromID + ' / key : ' + key + ' key room ID : ' + clients[key].roomID);
				
				if (key == fromID)
					continue;
				
				if (clients[key].roomID == attendRoomID)
				{
					sendMessage(key, JSON.stringify(resultData));
				}
			}
			
			clients[fromID].roomID = '';
			
			console.log(clients);
			break;
		default:
			sendMessage(fromID, JSON.stringify(resultData));
			break;
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
		
		clients[key].connection.sendUTF(data);
	}
}

function sendSingleMessage(id, data)
{
	console.log('-- Send Data --')
	console.log('to : ' + id + '   data : ' + data);
	
	clients[id].connection.sendUTF(data);
}
