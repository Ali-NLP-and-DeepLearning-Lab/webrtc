var configuration 	= {'iceServers':[{urls:'stun:stun1.l.google.com:19302'},
	{
		urls: 'turn:192.158.29.39:3478?transport=udp',
		credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
		username: '28224511:1379330808'
	}]};
var	pcConstraints	= {'optional': [{'dtlsSrtpKeyAgreement': true}, {'rtpDataChannels': true}, {'googIPv6':false}]};
var	sdpConstraints	= {'mozDontOfferDataChannel': true, 'offerToReceiveAudio':true, 'offerToReceiveVideo':true};

var loginID = '';
var roomID = '';

function sendMessage (method, message) {
	
	var data = {
		'method' : method,
		'message' : message
	}
	
	signalingChannel.send(data);
	
};

function login () {
	
	var loginCallback = function (result) {
		document.getElementById('logArea').value += 'LOGIN ' + result.result + '  : ' + loginID + '\n';
	}
	
	loginID = guid();
	manager.login(loginID, loginCallback);
	
	document.getElementById('logout').disabled = false;
	document.getElementById('login').disabled = true;
}

function logout () {
	
	manager.exit();
	
	var logoutCallback = function (result) {
		document.getElementById('logArea').value += 'LOG OUT ' + result.result + '  : ' + loginID + '\n';	
	}	 
	
	manager.logout(loginID, logoutCallback);
	
	document.getElementById('login').disabled = false;
	document.getElementById('logout').disabled = true;
	
}

function attend () {
	
	var attendCallback = function (result) {
		document.getElementById('logArea').value += 'ATTEND ' + result.roomID + ' ' + result.result + ' : ' + loginID + '\n';
	};
	
	var roomElement 	= document.getElementById('room');
	roomID				= roomElement.value;
	
	manager.join(roomID, attendCallback);
	
	document.getElementById('attend').disabled = true;
	document.getElementById('exit').disabled = false;
	document.getElementById('sendChat').disabled = false;
}

function exit () {
	
	var  exitCallback = function (result) {
		document.getElementById('logArea').value += 'EXIT ' + result.roomID + ' ' + result.result + ' : ' + loginID + '\n';
	}
	
	manager.exit(exitCallback);
	
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
	
	manager.sendChat(chatElement.value);
	
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
	
	var sendProgressElement = document.getElementById('sendProgress');
	var fileElement = document.getElementById('file');
	var file = fileElement.files[0];
	
	var fileCallback = function (result) {
		document.getElementById('logArea').value += 'FILE SEND FINISHED : ' + result + '\n';
		fileElement.value = '';
	}
	
	manager.sendFile(file, sendProgressElement, fileCallback);
	
}

// 실행
var manager = new JWebRtcManager(configuration, pcConstraints, sdpConstraints); 
manager.init('selfVideoArea', ['peerVideo1', 'peerVideo2', 'peerVideo3']);