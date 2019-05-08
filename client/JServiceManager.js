function JServiceManager (option) {
	
	// REQUEST TYPE
	this.LOGIN = 'login';
	this.LOGOUT = 'logout';
	this.ATTEND = 'attend';
	this.EXIT = 'exit';
	this.INVITE = 'invite';
	this.OFFER = 'offer';
	this.ANSWER = 'answer';
	this.ICE_CANDIDATE = 'icecandidate';
	
	this.CHAT_CHANNEL = 'chatChannel';
	this.FILE_CHANNEL = 'fileChannel';
	this.FILE_SIGNAL_CHANNEL = 'fileSignalChannel';
	this.GEO_LOCATION_CHANNEL = 'geolocationChannel';
	
	this.SELF_VIDEO_ID = 'self';
	
	this.loginID = '';
	this.roomID = '';
	this.selfVideoElement;
	this.peerVideoElements = new Array();
	
	this.config = option.config == null ? this.getRtcConfig() : option.config;
	this.pcConfig = option.pcConfig == null ? this.getPeerConnectionConfig() : option.pcConfig;
	this.sdpConfig = option.sdpConfig == null ? this.getSDPConfig() : option.sdpConfig;
	this.channelList = {};
	this.localStream = {};
	this.fileManager = new FileManager(this, option.progressElement);
	this.signalingChannel = new SignalingChannel(this);
	this.locationManager = new LocationManager(this, option.mapElement);
	this.dataChannelEventHandler = new JDataChannelEventHandler(this);
	this.signalingEventHandler = new JSignalingEventHandler(this);
	
}

JServiceManager.prototype.init = function (selfVideoElementId, peerVideoElementIds) {
	
	if (selfVideoElementId == null || typeof selfVideoElementId !== 'string')
	{
		console.err('confirm fist PARAMETER');
		return;
	}
	
	if (peerVideoElementIds == null || typeof peerVideoElementIds !== 'object' || peerVideoElementIds.length <= 0)
	{
		console.err('confirm second peer PARAMETER');
		return;
	}
	
	var selfVideoElement = document.getElementById(selfVideoElementId);
	
	for (var i = 0 ; i < peerVideoElementIds.length ; i++) {
		
		var peerElement = document.getElementById(peerVideoElementIds[i]);
		
		if (peerElement == null)
		{
			alert('PeerVideoID is not matched (No Element)');
			return;
		}
		
		var peerData = {
				isUse : false,
				element : peerElement 
		}
		
		this.peerVideoElements.push(peerData);
	}
	
	if (selfVideoElement == null)
	{
		alert('make selfVideoElement !')
		return;
	}
	
	this.selfVideoElement = selfVideoElement;
	this.getSelfMedia();
};

JServiceManager.prototype.getPeerVideoElement = function () {
	
	var peerElements = this.peerVideoElements;
	
	for (var i = 0; i < peerElements.length ; i++)
	{
		if (!peerElements[i].isUse)
			return peerElements[i].element;
		
	}
	
}

JServiceManager.prototype.createChannel = function (id) {

	this.channelList[id] = new JWebRtc(this, id);
	
};

JServiceManager.prototype.sendOffer = function (id) {
	
	this.channelList[id].sendOffer(id);
	
	
};

JServiceManager.prototype.sendAnswer = function (id) {
	
	this.channelList[id].sendAnswer(id);
	
};

JServiceManager.prototype.getSelfMedia = function () {

	var _this = this;
	
	navigator.mediaDevices.getUserMedia({'video' : true, 'audio' : true}).then(function (stream) {
		
		_this.localStream = stream;
		_this.makeVideo(_this.SELF_VIDEO_ID, _this.selfVideoElement);
		_this.setVideoStream(_this.SELF_VIDEO_ID, stream);
		
	}).catch(function (err) {
		console.log(err);
	});
	
};

JServiceManager.prototype.makeVideo  = function (id, parentElement) {

	var videoElement 		= document.createElement('video');
	
	videoElement.id				= 'video-' + id;
	videoElement.style.width 	= '100%';
	videoElement.style.height 	= '100%';
	videoElement.autoplay		= true;
	videoElement.muted			= true;
	
	parentElement.appendChild(videoElement);
	
}

JServiceManager.prototype.setVideoStream = function (id, stream) {
	
	var videoElement 	= document.getElementById('video-' + id);
	
	if (videoElement == null)
	{
		console.err('videoElement is NULL');
		return;
	}
	
	
	videoElement.srcObject = stream;
	
};

JServiceManager.prototype.setRemoteDescription = function (id, sdp) {
	
	var peerConnection = this.channelList[id].rtcChannel;
	
	console.log('%c LOCAL -> SET : REMOTE DESCRIPTION' ,'color:#FF9900');
	
	peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
}

JServiceManager.prototype.addIceCandidateEvent = function (id, candidate) {
	
	var peerConnection = this.channelList[id].rtcChannel;
	
	console.log('%c LOCAL -> ADD ICE CANDIDATE' ,'color:#FF00CC');
	
	peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	
};

JServiceManager.prototype.login = function (loginID, callback) {
	
	this.loginID = loginID;
	
	var message = {
			loginID : loginID,
			callback : callback
	}
	
	this.signalingChannel.send(this.LOGIN, message);
}

JServiceManager.prototype.logout = function (loginID, callback) {
	
	var message = {
			loginID : loginID,
			callback : callback
	}
	
	this.signalingChannel.send(this.LOGOUT, message);
	
	this.loginID = '';
	
}

JServiceManager.prototype.join = function (roomID, callback) {
	
	this.roomID = roomID;
	
	var data = {
			roomID : roomID,
			callback : callback
	};
	
	this.signalingChannel.send(this.ATTEND, data);
}

JServiceManager.prototype.exit = function (callback) {
	
	if (this.roomID === null || this.roomID.length === 0)
	{
		console.log('no roomID');
		return;
	}
	
	this.destroyChannelList();
	
	var data = {
			roomID : this.roomID,
			callback : callback
	};
	
	this.signalingChannel.send(this.EXIT, data);
	
	this.roomID = '';
}

JServiceManager.prototype.destroyChannelList = function () {

	for (var key in this.channelList) {
		for (var type in this.channelList[key].dataChannel) {
			this.channelList[key].dataChannel[type].close();
		}
		this.channelList[key].rtcChannel.close();
		delete this.channelList[key]; 
	}
	
}

JServiceManager.prototype.sendSignalMessage = function (method, message, receverID) {
	
	this.signalingChannel.send(method, message, receverID);
};

JServiceManager.prototype.sendChat = function (dataMessage) {

	var requestData		= {
			type		: 'chat',
			chatMessage : dataMessage
	}
	
	this.sendDataChannel(this.CHAT_CHANNEL, JSON.stringify(requestData));
};

JServiceManager.prototype.sendDataChannel = function (channelType, requestData) {
	
	for (var channelID in this.channelList)
	{
		this.channelList[channelID].dataChannel[channelType].send(requestData);
	}
	
};

JServiceManager.prototype.sendFile = function (file, callback) {
	
	if (file == null || file.size == 0)
	{
		alert('FILE IS EMPTY');
		return;
	}
	
	this.fileManager.sendFile(file, callback);
};

JServiceManager.prototype.setMyLocation = function () {
	this.locationManager.setMyLocation();
}

JServiceManager.prototype.shareLocation = function () {
	this.locationManager.shareLocation();
}

JServiceManager.prototype.guid = function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}

JServiceManager.prototype.getRtcConfig = function () {

	return 	{
		'iceServers' : [{urls:'stun:stun1.l.google.com:19302'},
			{
				urls: 'turn:192.158.29.39:3478?transport=udp',
				credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
				username: '28224511:1379330808'
			}]
	};
	
}

JServiceManager.prototype.getPeerConnectionConfig = function () {
	
	return {'optional': [{'dtlsSrtpKeyAgreement': true}, {'rtpDataChannels': true}, {'googIPv6':false}]};
	
}

JServiceManager.prototype.getSDPConfig = function () {
	
	return {'mozDontOfferDataChannel': true, 'offerToReceiveAudio':true, 'offerToReceiveVideo':true};
	
}
