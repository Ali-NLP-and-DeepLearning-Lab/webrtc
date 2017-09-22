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
	
	this.CHAT_CHANNEL = 'chatChannel';
	this.FILE_CHANNEL = 'fileChannel';
	this.FILE_SIGNAL_CHANNEL = 'fileSignalChannel';
	
	this.SELF_VIDEO_ID = 'self';
	
	this.loginID = '';
	this.roomID = '';
	this.selfVideoElement;
	this.peerVideoElements = new Array();
	
	this.config = config;
	this.pcConfig = pcConfig;
	this.sdpConfig = sdpConfig;
	this.channelList = {};
	this.localStream = {};
	this.signalingChannel = new SignalingChannel(this);
	this.dataChannelEventHandler = new JDataChannelEventHandler(this);
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
	
	this.channelList[id].sendOffer(id);
	
	
};

JWebRtcManager.prototype.sendAnswer = function (id) {
	
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

JWebRtcManager.prototype.logout = function (loginID, callback) {
	
	var message = {
			loginID : loginID,
			callback : callback
	}
	
	this.signalingChannel.send(this.LOGOUT, message);
	
	this.loginID = '';
	
}

JWebRtcManager.prototype.join = function (roomID, callback) {
	
	this.roomID = roomID;
	
	var data = {
			roomID : roomID,
			callback : callback
	};
	
	this.signalingChannel.send(this.ATTEND, data);
}

JWebRtcManager.prototype.exit = function (callback) {
	
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

JWebRtcManager.prototype.destroyChannelList = function () {

	for (var key in this.channelList) {
		for (var type in this.channelList[key].dataChannel) {
			this.channelList[key].dataChannel[type].close();
		}
		this.channelList[key].rtcChannel.close();
		delete this.channelList[key]; 
	}
	
}

JWebRtcManager.prototype.sendMessage = function (method, message, receverID) {
	
	this.signalingChannel.send(method, message, receverID);
};

JWebRtcManager.prototype.sendChat = function (dataMessage) {

	var requestData		= {
			type		: 'chat',
			chatMessage : dataMessage
	}
	
	for (var key in this.channelList)
	{
		this.channelList[key].dataChannel[this.CHAT_CHANNEL].send(JSON.stringify(requestData));
	}
	
};

JWebRtcManager.prototype.sendFile = function (file, progressElement, callback) {
	
	if (file == null || file.size == 0)
	{
		alert('FILE IS EMPTY');
		return;
	}
	var _this = this;
	var fileBuffer = [];
	var fileSize = 0;
	var result = 'success';
	
	progressElement.max = file.size;
	
	var startFileMessage = {
		type : 'file',
		fileSize : file.size,
		fileName : file.name,
		state : 'start'
	}
	
	for (var key in _this.channelList)
	{
		_this.channelList[key].dataChannel[_this.FILE_SIGNAL_CHANNEL].send(JSON.stringify(startFileMessage));
	}
	
	console.log('%c LOCAL -> FILE SEND START', 'color:#000066');
	
	var fileWorker = new Worker("fileReader.js")
	
	fileWorker.postMessage(file);
	fileWorker.onmessage = function (evt) 
	{
		if (typeof evt.data === 'string')
		{
			if (evt.data === _this.EXIT)
			{
				var fileListElement = document.getElementById('fileList');
				var fileElement = document.createElement('a');
				var received = new Blob(fileBuffer);
				
				fileBuffer = [];
				
				fileElement.href = URL.createObjectURL(received);
				fileElement.download = file.name;
				fileElement.innerHTML = file.name;
				fileElement.style.display = 'block';
				fileElement.style.height = '26px';
				fileElement.target = '_blank';
				
				fileListElement.appendChild(fileElement);
				
				var endFileMessage = {
						type : 'file',
						fileSize : file.size,
						fileName : file.name,
						state : 'end'
					}
				
				progressElement.value = 0;
				console.log('%c LOCAL -> FILE SEND END', 'color:#000066');
				callback(result);
				fileWorker.terminate();
				return;
			}
		}
		
		for (var key in _this.channelList)
		{
			fileBuffer.push(evt.data);
			_this.channelList[key].dataChannel[_this.FILE_CHANNEL].send(evt.data);
			console.log(evt.data.byteLength);
			progressElement.value += evt.data.byteLength
		}
		
	}
	
	fileWorker.onclose = function (evt) {
		console.log(evt);
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