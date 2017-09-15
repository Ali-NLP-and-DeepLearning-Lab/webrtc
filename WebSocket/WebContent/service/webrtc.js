var pcMap 			= {};
var dataChannelMap	= {};
var configuration 	= {'iceServers':[{urls:'stun:stun1.l.google.com:19302'},
	{
		urls: 'turn:192.158.29.39:3478?transport=udp',
		credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
		username: '28224511:1379330808'
	}]};
var	pcConstraints	= {'optional': [{'dtlsSrtpKeyAgreement': true}, {'rtpDataChannels': true}, {'googIPv6':false}]};
var	sdpConstraints	= {'mozDontOfferDataChannel': true, 'offerToReceiveAudio':true, 'offerToReceiveVideo':true};
var signalingChannel = new WebSocket("wss://127.0.0.1:1337"); 
var localStream = null;

var loginID = '';
var roomID = '';

var ICE_CANDIDATE = 'icecandidate';
var OFFER = 'offer';
var ANSWER = 'answer';
var LOGIN = 'login';
var LOGOUT = 'logout';
var ATTEND = 'attend';
var EXIT = 'exit';
var INVITE = 'invite'
	
var BOARDCAST = 'boardcast';
var SINGLE = 'single';

var DATA_CHANNEL = 'dataChannel';

function makeVideo(id) {
	
	var videoElement 		= document.createElement('video');
	var videoCellElement 	= document.getElementById('videoCell');
	videoCellElement.appendChild(videoElement);
	
	videoElement.id				= 'video-' + id;
	videoElement.style.width 	= '80px';
	videoElement.style.height 	= '80px';
	videoElement.autoplay		= true;
	
}

function makePeerConnection (id) {
	
	pcMap[id] = new RTCPeerConnection(configuration, pcConstraints);
	
	pcMap[id].addStream(localStream);
	
	pcMap[id].onicecandidate = function (evt) {
		console.log('genereate  ICE_CANDIDATE');
		sendMessage(BOARDCAST, ICE_CANDIDATE ,loginID, 'null', JSON.stringify({"candidate" : evt.candidate}));
	}
	pcMap[id].onaddstream = function (event) {
		console.log('onaddStream Event Received');
		setVideo(id, event.stream);
	}
	pcMap[id].ontrack = function (event) {
		console.log('ontrack Event Received');
		console.log(event);
	}
	
	pcMap[id].ondatachannel = function (event) {
		
		console.log('ondatachannel  Event Received');
		console.log(event);
		
		var channel = event.channel;
		
		channel.onopen = function (event) {
			console.log('data channel answer open')
		}
		
		channel.onmessage = function (event) {
			console.log('data Channel answer Message');
			console.log(event.data);
			
			var dataResult = JSON.parse(event.data);
			
			if (dataResult.type == 'chat')
			{
				var chatAreaElement 	= document.getElementById('chatArea');
				chatAreaElement.innerHTML += dataResult.chatMessage + '\n';
			}
			else if (dataResult.type == 'file')
			{
				console.log('data Channel Message File Data');
				console.log(dataResult.fileData);
				
				var fileListElement = document.getElementById('fileList');
				var fileElement = document.createElement('a');
				fileElement.href = dataResult.fileData;
				fileElement.innerHTML = dataResult.fileName;
				fileElement.style.display = 'block';
				fileElement.style.height = '26px';
				fileElement.target = '_blank';
				fileElement.download = dataResult.fileName;
				
				fileListElement.appendChild(fileElement);
			}
		};
		
	};
	
	dataChannelMap[id] = pcMap[id].createDataChannel(DATA_CHANNEL);
	
	dataChannelMap[id].onopen = function (event) {
		console.log('data Channel offer open');
	}
	
	dataChannelMap[id].onmessage = function (event) {
		console.log('data Channel offer Message');
		console.log(event.data);
	}
};

signalingChannel.onopen = function () {
	console.log('WebSocket is open');
}

signalingChannel.onclose = function () {
	console.log('WebSocket is close');
}

signalingChannel.onmessage = function (evt) {
	
	console.log('ON MESSAGE');
	console.log(evt);
	
	var message = JSON.parse(evt.data);
	var method 	= message.method;
	var fromID	= message.from;
	var toID	= message.to;
	
	if (method == LOGIN)
	{
		document.getElementById('logArea').value += 'FROM SERVER : LOGIN COMPLETE';
	}
	else if (method == ANSWER)
	{
		var signal 	= JSON.parse(message.data);
		
		document.getElementById('logArea').value += 'FROM SERVER : SDP ANSWER Receive';
		console.log(pcMap[fromID]);
		
		pcMap[fromID].setRemoteDescription(new RTCSessionDescription(signal));
	} 
	else if (method == OFFER)
	{
		var signal 	= JSON.parse(message.data);
		
		document.getElementById('logArea').value += 'FROM SERVER : SDP OFFER Receive';
		makeVideo(fromID);
		makePeerConnection(fromID);
		
		pcMap[fromID].setRemoteDescription(new RTCSessionDescription(signal));
		
		pcMap[fromID].createAnswer().then(function (answer) {
			return pcMap[fromID].setLocalDescription(answer);
		}).then(function () {
			
			sendMessage(SINGLE, ANSWER, loginID, fromID, JSON.stringify(pcMap[fromID].localDescription));
			
		}).catch(function (error) {
			alert(error);
		});
	}
	else if (method == ICE_CANDIDATE)
	{
		var signal 	= JSON.parse(message.data);
		
		document.getElementById('logArea').value += 'SERVER FROM : ADD ICE CANDIDTE - ' + fromID;
		console.log(signal);
		
		if (signal.candidate == undefined || signal.candidate == null || signal.candidate == 'null')
		{
			console.info('CANDIDATE IS NULL !!');
			return;
		}
		
		pcMap[fromID].addIceCandidate(new RTCIceCandidate(signal.candidate));
	}
	else if (method == INVITE)
	{
		var signal 	= JSON.parse(message.data);
		
		document.getElementById('logArea').value += 'SERVER FROM : INVITE - ' + fromID;
		
		makeVideo(fromID);
		makePeerConnection(fromID);
		createOffer(fromID);
		
		pcMap[fromID].room = signal.roomID;
	}
	else if (method == EXIT)
	{
		var signal 	= JSON.parse(message.data);
		
		document.getElementById('logArea').value += 'SERVER FROM : EXIT - ' + fromID;
		
		dataChannelMap[fromID].close();
		pcMap[fromID].close();
		
		var exitVideoElement = document.getElementById('video-' + fromID);
		exitVideoElement.parentNode.removeChild(exitVideoElement);
		
		delete dataChannelMap[fromID];
		delete pcMap[fromID];
	}
}

function sendMessage (type, method, from, to, message) {
	
	var data = {
		'type' : type,
		'method' : method,
		'from' : from,
		'to' : to,
		'message' : message
	}
	
	document.getElementById('logArea').value += 'TO SERVER : SEND MESSAGE - ' + JSON.stringify(data);
	signalingChannel.send(JSON.stringify(data));
	
};
function createOffer (peerID) { 
	document.getElementById('logArea').value += 'EXECUTE CREATE OFFER : ' + peerID;
	pcMap[peerID].createOffer(sdpConstraints).then(function (offer) {
		pcMap[peerID].setLocalDescription(offer);
	})
	.then(function () {
		console.log(pcMap[peerID].localDescription);
		sendMessage(SINGLE, OFFER, loginID, peerID, JSON.stringify(pcMap[peerID].localDescription));
	});
}

function setVideo (id, stream) {
	
	var videoElement 	= document.getElementById('video-' + id);
	videoElement.srcObject = stream;
	
};

function getSelfMedia (id) {
	
	navigator.mediaDevices.getUserMedia({'video' : true, 'audio' : true}).then(function (stream) {
		
		console.log('GET Media Tracks');
		console.log(stream.getTracks());
		
		localStream = stream;
		makeVideo(id)
		setVideo(id, stream);
		
	}).catch(function (err) {
		console.log(err);
		alert(err);
	});
	
};

function login () {
	loginID = guid();

	sendMessage(SINGLE, LOGIN, loginID, 'null', 'null');
	
	document.getElementById('logout').disabled = false;
	document.getElementById('login').disabled = true;
	
	document.getElementById('logArea').value += 'LOGIN : ' + loginID;
}

function logout () {
	exit();
	sendMessage(SINGLE, LOGOUT, loginID, null, null);
	document.getElementById('login').disabled = false;
	document.getElementById('logout').disabled = true;
	
	document.getElementById('logArea').value += 'LOGOUT : ' + loginID;
}

function attend () {
	
	document.getElementById('logArea').value += 'ATTEND : ' + roomID;
	
	var roomElement 	= document.getElementById('room');
	roomID				= roomElement.value;
	
	var data 			= {
			roomID : roomID
	};
	
	sendMessage(SINGLE, ATTEND, loginID, 'null', JSON.stringify(data));
	
	document.getElementById('attend').disabled = true;
	document.getElementById('exit').disabled = false;
	document.getElementById('sendChat').disabled = false;
}

function exit () {
	
	document.getElementById('logArea').value += 'EXIT : ' + roomID;
	
	var data 			= {
			roomID : roomID
	};
	
	sendMessage(SINGLE, EXIT, loginID, null, JSON.stringify(data));
	
	for (var key in dataChannelMap)
	{
		dataChannelMap[key].close();
		delete dataChannelMap[key];
	}
	
	for (var key in pcMap)
	{
		pcMap[key].close();
		delete pcMap[key]; 
	}
	
	var videoElements = document.getElementsByTagName('video');
	
	for (var i = 0 ; i < videoElements.length; i++)
	{
		if (i == 0)
			continue;
		
		videoElements[i].parentNode.removeChild(videoElements[i]);
	}
	
	roomID = '';
	
	document.getElementById('attend').disabled = false;
	document.getElementById('exit').disabled = true;
	document.getElementById('sendChat').disabled = true;
}

function sendChat () {
	var chatElement 		= document.getElementById('chat');
	
	var dataMessage			= {
			chatMessage : chatElement.value,
			type		: 'chat'
	}
	
	for (var key in dataChannelMap)
	{
		dataChannelMap[key].send(JSON.stringify(dataMessage));
	}
	
	var chatAreaElement 	= document.getElementById('chatArea');
	chatAreaElement.innerHTML += chatElement.value + '\n';
	
	chatElement.value = '';
}

function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}

function sendFile() {
	
	var fileWorker = new Worker("fileReader.js")
	var fileElement = document.getElementById('file');
	var file = fileElement.files[0];
	
	fileWorker.postMessage(file);
	
	fileWorker.onmessage = function (e) 
	{
		var dataMessage = {
				type : 'file',
				fileData : e.data,
				fileName : file.name
		}
		
		for (var key in dataChannelMap)
		{
			dataChannelMap[key].send(JSON.stringify(dataMessage));
		}
	}
}

// 실행
getSelfMedia('self');
