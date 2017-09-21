function JWebRtc (manager, id) {
	
	var DATA_CHANNEL = 'dataChannel';
	
	this.manager = manager;
	this.userId = id;
	
	this.rtcChannel = new RTCPeerConnection(manager.config, manager.pcConfig);
	this.dataChannel = this.rtcChannel.createDataChannel(DATA_CHANNEL);
	
	this.rtcChannel.addStream(manager.localStream);
	this.rtcChannel.onicecandidate = function (evt) {
		console.log('%c LOCAL -> CREATE : ICE CANDIDATE', 'color:#FF00CC');
		console.log('%c SERVER SEND -> ICE CANDIDATE', 'color:#FF00CC')
		
		console.log(evt);
		
		var	requestData = {
			candidate : evt.candidate,
			senderID : manager.loginID,
			receiverID : id
		}
			
		manager.sendMessage(manager.ICE_CANDIDATE, requestData);
	};
	
	this.rtcChannel.onaddstream = function (event) {
		console.log('%c SERVER RECEIVED -> STREAM', 'color:#0066FF');
		manager.setVideoStream(id, event.stream); // setVideo
	};
	
	this.rtcChannel.ontrack = function (event) {
		console.log('%c SERVER RECEIVED -> TRACK', 'color:#0066FF');
		console.log(event);
	};
	
	this.rtcChannel.ondatachannel = function (event) {
		
		var channel = event.channel;
		
		channel.onopen = function (event) {
			console.log('%c DATA CHANNEL OPEN', 'color:#000066');
		};
		
		channel.onbufferedamountlow = function (evt) {
			
			console.log('onbufferedamountlow');
			console.log(evt);
			
		};
		
		channel.onmessage = function (evt) {
			
			var result;
			
			try
			{
				result = JSON.parse(evt.data);
			}
			catch (parseError)
			{
				console.info(e);
				console.err(parseError);
				alert('SOCKET ON MESSAGE ERROR (JSON Parse)');
			}
			
			manager.dataChannelEventHandler.invoke(result)
		};
	};
	
};

JWebRtc.prototype.sendOffer = function (id) {
	
	var _this = this;
	
	this.rtcChannel.createOffer(_this.sdpConfig).then(function (offer) {
		console.log('%c LOCAL -> CREATE : OFFER', 'color:#FF9900');
		console.log('%c LOCAL -> SET : LOCAL DESCRIPTION', 'color:#FF9900');
		
		console.log(offer);
		
		_this.rtcChannel.setLocalDescription(offer);
	})
	.then(function () {
		
		var requestData = {
			data : _this.rtcChannel.localDescription,
			senderID : _this.manager.loginID,
			receiverID : id
		}
		
		console.log('%c SERVER SEND -> OFFER', 'color:#FF9900');
		_this.manager.sendMessage(_this.manager.OFFER, requestData);
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
		
		var requestData = {
			data : _this.rtcChannel.localDescription,
			senderID :  _this.manager.loginID,
			receiverID : id
		}
		
		console.log('%c SERVER SEND -> ANSWER', 'color:#FF9900');
		_this.manager.sendMessage(_this.manager.ANSWER, requestData);
		
	}).catch(function (error) {
		alert(error);
	});
	
};

