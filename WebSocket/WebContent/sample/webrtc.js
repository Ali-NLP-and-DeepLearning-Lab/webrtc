var pcMap 			= {};
var dataChannelMap	= {};
var configuration 	= {'iceServers':[{urls:'stun:stun1.l.google.com:19302'},
	{
		urls: 'turn:192.158.29.39:3478?transport=udp',
		credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
		username: '28224511:1379330808'
	}]};
var	pcConstraints	= {'optional': [{'dtlsSrtpKeyAgreement': true}, {'rtpDataChannels': false}, {'googIPv6':false}]};
var	sdpConstraints	= {'mozDontOfferDataChannel': true, 'offerToReceiveAudio':true, 'offerToReceiveVideo':true};
var signalingChannel = new WebSocket("wss://127.0.0.1:1337");
//var signalingChannel = new WebSocket("wss://devcloud.uprism.com:9105/ws/websocket");
var localStream = null;
var loginID = '';

var DATA_CHANNEL = 'dataChannel'; 

function makeVideo(id) {
	
	var videoElement 		= 	document.createElement('video');
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
			
			var chatAreaElement 	= document.getElementById('chatArea');
			chatAreaElement.innerHTML += event.data + '\n';
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
	
	var message = evt.data.split('#_#');
	var method 	= message[0];
	var fromID	= message[1];
	var toID	= message[2];
	
	if (message[1] === 'undefined' || message[1] === 'null')
	{
		console.err('ID is EMPTY');
		return;
	}
	
	if (method == LOGIN)
	{
		console.log('LOGIN - CREATE PEER CONNECTION : ' + fromID);
		makeVideo(fromID);
		makePeerConnection(fromID);
		createOffer(fromID);
		
	}
	else if (method == ANSWER)
	{
		var signal 	= JSON.parse(message[3]);
		
		console.info('SDP ANSWER Receive');
		console.log(pcMap[fromID]);
		
		pcMap[fromID].setRemoteDescription(new RTCSessionDescription(signal));
	} 
	else if (method == OFFER)
	{
		var signal 	= JSON.parse(message[3]);
		
		console.info('SDP OFFER Receive');
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
		var signal 	= JSON.parse(message[3]);
		
		console.log('ADD ICE CANDIDTE : ' + fromID);
		console.log(signal);
		
		if (signal.candidate == undefined || signal.candidate == null || signal.candidate == 'null')
		{
			console.info('CANDIDATE IS NULL !!');
			return;
		}
		
		pcMap[fromID].addIceCandidate(new RTCIceCandidate(signal.candidate));
	}
}

function sendMessage (type, method, from, to, message) {
	
	signalingChannel.send(type + "#_#" + method + '#_#' + from + "#_#" + to + '#_#' + message);
	
};
function createOffer (peerID) { 
	console.info('Invoke CREATE OFFER : ' + peerID);
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
	console.info('LOGIN 성공 : ' + loginID);
	sendMessage(SINGLE, LOGIN, loginID, 'null', 'null');
}

function sendChat () {
	var chatElement 		= document.getElementById('chat');
	
	for (var key in dataChannelMap)
	{
		dataChannelMap[key].send(chatElement.value);
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

// 실행
getSelfMedia('self');
