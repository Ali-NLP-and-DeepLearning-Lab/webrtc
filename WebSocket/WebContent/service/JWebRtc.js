function JWebRtc (manager, id) {
	
	var _this = this;
	
	this.manager = manager;
	this.userId = id;
	this.dataChannel = {};
	
	this.rtcChannel = new RTCPeerConnection(manager.config, manager.pcConfig);
	this.dataChannel[manager.CHAT_CHANNEL] = this.rtcChannel.createDataChannel(manager.CHAT_CHANNEL);
	this.dataChannel[manager.FILE_CHANNEL] = this.rtcChannel.createDataChannel(manager.FILE_CHANNEL);
	this.dataChannel[manager.FILE_SIGNAL_CHANNEL] = this.rtcChannel.createDataChannel(manager.FILE_SIGNAL_CHANNEL);
	this.dataChannel[manager.GEO_LOCATION_CHANNEL] = this.rtcChannel.createDataChannel(manager.GEO_LOCATION_CHANNEL);
	
	this.dataChannel[manager.FILE_CHANNEL].binaryType = 'arraybuffer';
	
	this.rtcChannel.addStream(manager.localStream);
	this.rtcChannel.onicecandidate = function (evt) {
		console.log('%c LOCAL -> CREATE : ICE CANDIDATE', 'color:#FF00CC');
		console.log('%c SERVER SEND -> ICE CANDIDATE', 'color:#FF00CC')
		
		var	requestData = {
			candidate : evt.candidate,
		}
			
		manager.sendSignalMessage(manager.ICE_CANDIDATE, requestData, id);
	};
	
	this.rtcChannel.onaddstream 
	
	= function (event) {
		console.log('%c SERVER RECEIVED -> STREAM', 'color:#0066FF');
		manager.setVideoStream(id, event.stream); // setVideo
	};
	
	this.rtcChannel.ontrack = function (event) {
		console.log('%c SERVER RECEIVED -> TRACK', 'color:#0066FF');
		console.log(event);
	};
	
	this.rtcChannel.ondatachannel = function (event) {
		
		var channel = event.channel;
		
		if (channel.label === 'fileChannel')
			channel.binaryType = 'arraybuffer';
		
		channel.onopen = function (event) {
			console.log('%c DATA CHANNEL OPEN : ' + channel.label, 'color:#000066');
		};
		
		channel.onbufferedamountlow = function (evt) {
			console.log('%c DATA BUFFERED MOUNTLOW : ' + channel.label);
			console.log(evt);
		};
		
		channel.onmessage = function (evt) {
			manager.dataChannelEventHandler.invoke(evt)
		};
	};
	
};

JWebRtc.prototype.sendOffer = function (id) {
	
	var _this = this;
	
	this.rtcChannel.createOffer(_this.sdpConfig).then(function (offer) {
		console.log('%c LOCAL -> CREATE : OFFER', 'color:#FF9900');
		console.log('%c LOCAL -> SET : LOCAL DESCRIPTION', 'color:#FF9900');
		
		_this.rtcChannel.setLocalDescription(offer);
	})
	.then(function () {
		
		var requestData = _this.rtcChannel.localDescription;
		
		console.log('%c SERVER SEND -> OFFER', 'color:#FF9900');
		_this.manager.sendSignalMessage(_this.manager.OFFER, requestData, id);
	}).catch(function (error) {
		alert(error);
	});
	
};

JWebRtc.prototype.sendAnswer = function (id) {
	
	var _this = this;
	
	this.rtcChannel.createAnswer().then(function (answer) {
		console.log('%c LOCAL -> CREATE : ANSWER', 'color:#FF9900');
		console.log('%c LOCAL -> SET : LOCAL DESCRIPTION', 'color:#FF9900');
		return _this.rtcChannel.setLocalDescription(answer);
	}).then(function () {
		
		var requestData = _this.rtcChannel.localDescription;
		
		console.log('%c SERVER SEND -> ANSWER', 'color:#FF9900');
		_this.manager.sendSignalMessage(_this.manager.ANSWER, requestData, id);
		
	}).catch(function (error) {
		alert(error);
	});
	
};

