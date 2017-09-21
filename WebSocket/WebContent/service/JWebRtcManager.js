function JWebRtcManager (config, pcConfig, sdpConfig) {
	
	// REQUEST TYPE
	this.LOGIN = 'login';
	this.LOGOUT = 'logout';
	this.ATTEND = 'attend';
	this.EXIT = 'exit';
	this.INVITE = 'invite';
	this.OFFER = 'offer';
	this.ANSWER = 'answer';
	this.ICE_CANDIDATE = 'icecandidate';
	
	this.SELF_VIDEO_ID = 'self';
	
	this.loginID;
	this.roomID;
	this.selfVideoElement;
	this.peerVideoElements = new Array();
	
	this.config = config;
	this.pcConfig = pcConfig;
	this.sdpConfig = sdpConfig;
	this.channelList = {};
	this.localStream = {};
	this.signalingChannel = new SignalingChannel(this);
	this.dataChannelEventHandler = new JDataChannelEventHandler();
	this.signalingEventHandler = new JSignalingEventHandler(this);
	
}

JWebRtcManager.prototype.init = function (selfVideoElementId, peerVideoElementIds) {
	
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

JWebRtcManager.prototype.getPeerVideoElement = function () {
	
	var peerElements = this.peerVideoElements;
	
	for (var i = 0; i < peerElements.length ; i++)
	{
		if (!peerElements[i].isUse)
			return peerElements[i].element;
		
	}
	
}

JWebRtcManager.prototype.createChannel = function (id) {

	this.channelList[id] = new JWebRtc(this, id);
	
};

JWebRtcManager.prototype.sendOffer = function (id) {
	
	document.getElementById('logArea').value += 'EXECUTE CREATE OFFER : ' + id + '\n';
	
	this.channelList[id].sendOffer(id);
	
	
};

JWebRtcManager.prototype.sendAnswer = function (id) {
	
	document.getElementById('logArea').value += 'EXECUTE CREATE ANSWER : ' + id + '\n';
	
	this.channelList[id].sendAnswer(id);
	
};

JWebRtcManager.prototype.getSelfMedia = function () {

	var _this = this;
	
	navigator.mediaDevices.getUserMedia({'video' : true, 'audio' : true}).then(function (stream) {
		
		_this.localStream = stream;
		_this.makeVideo(_this.SELF_VIDEO_ID, _this.selfVideoElement);
		_this.setVideoStream(_this.SELF_VIDEO_ID, stream);
		
	}).catch(function (err) {
		console.log(err);
	});
	
};

JWebRtcManager.prototype.makeVideo  = function (id, parentElement) {

	var videoElement 		= document.createElement('video');
	
	videoElement.id				= 'video-' + id;
	videoElement.style.width 	= '100%';
	videoElement.style.height 	= '100%';
	videoElement.autoplay		= true;
	videoElement.muted			= true;
	
	parentElement.appendChild(videoElement);
	
}

JWebRtcManager.prototype.setVideoStream = function (id, stream) {
	
	var videoElement 	= document.getElementById('video-' + id);
	
	if (videoElement == null)
	{
		console.err('videoElement is NULL');
		return;
	}
	
	
	videoElement.srcObject = stream;
	
};

JWebRtcManager.prototype.setRemoteDescription = function (id, sdp) {
	
	var peerConnection = this.channelList[id].rtcChannel;
	
	console.log('%c LOCAL -> SET : REMOTE DESCRIPTION' ,'color:#FF9900');
	
	peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
}

JWebRtcManager.prototype.addIceCandidateEvent = function (id, candidate) {
	
	var peerConnection = this.channelList[id].rtcChannel;
	
	console.log('%c LOCAL -> ADD ICE CANDIDATE' ,'color:#FF00CC');
	
	peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	
};

JWebRtcManager.prototype.login = function (loginID, callback) {
	
	this.loginID = loginID;
	
	var message = {
			loginID : loginID,
			callback : callback
	}
	
	this.signalingChannel.send(this.LOGIN, message);
}

JWebRtcManager.prototype.join = function (roomID, callback) {
	
	this.roomID = roomID;
	
	var data = {
			roomID : roomID,
			callback : callback
	};
	
	this.signalingChannel.send(this.ATTEND, data);
}

JWebRtcManager.prototype.sendChat = function (dataMessage) {

	var requestData		= {
			chatMessage : dataMessage,
			type		: 'chat'
	}
	
	for (var key in this.channelList)
	{
		this.channelList[key].dataChannel.send(JSON.stringify(requestData));
	}
	
};


JWebRtcManager.prototype.exit = function (roomID, callback) {

	this.destroyChannelList();
	
	var data = {
			roomID : roomID,
			callback : callback
	};
	
	this.signalingChannel.send(this.EXIT, data);
}

JWebRtcManager.prototype.destroyChannelList = function () {

	for (var key in this.channelList)
	{
		this.channelList[key].dataChannel.close();
		this.channelList[key].rtcChannel.close();
		delete this.channelList[key]; 
	}
	
}

JWebRtcManager.prototype.sendMessage = function (method, message) {
	
	this.signalingChannel.send(method, message);
};

JWebRtcManager.prototype.sendFile = function (file) {
	
	if (file === null)
	{
		alert('FILE IS EMPTY');
		return;
	}
	
	var fileWorker = new Worker("fileReader.js")
	var _this = this;
	
	fileWorker.postMessage(file);
	
	fileWorker.onmessage = function (e) 
	{
		var dataMessage = {
				type : 'file',
				fileData : e.data,
				fileName : file.name
		}
		
		for (var key in _this.channelList)
		{
			_this.channelList[key].dataChannel.send(JSON.stringify(dataMessage));
		}
		
		var fileListElement = document.getElementById('fileList');
		var fileElement = document.createElement('a');
		
		fileElement.href = e.data;
		fileElement.innerHTML = file.name;
		fileElement.style.display = 'block';
		fileElement.style.height = '26px';
		fileElement.target = '_blank';
		fileElement.download = file.name;
		
		fileListElement.appendChild(fileElement);
	}
	
};

SignalingChannel.prototype.guid = function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}