function JSignalingEventHandler (jWebRtcManager) {
	
	this.jWebRtcManager = jWebRtcManager;
	
}
 
JSignalingEventHandler.prototype.invoke = function (responseData) {
	
	switch (responseData.method) {
		case this.jWebRtcManager.ICE_CANDIDATE:
			this.iceCandidateEvent(responseData);
			break;
		case this.jWebRtcManager.OFFER:
			this.offerEvent(responseData);
			break;
		case this.jWebRtcManager.ANSWER:
			this.answerEvent(responseData);
			break;
		case this.jWebRtcManager.INVITE:
			this.inviteEvent(responseData);
			break;
		case this.jWebRtcManager.EXIT:
			this.exitEvent(responseData);
			break;
		default:
			break;
	}
}

JSignalingEventHandler.prototype.iceCandidateEvent = function (responseData) {
	
	var iceData = responseData.message;
	var peerID = responseData.senderID;

	console.log('%c SERVER RECEIVED -> ICE CANDIDATE :: %c SENDER ID[' + peerID + ']', 'color:#9900CC','color:#444444');
	
	if (iceData.candidate == undefined || iceData.candidate == null || iceData.candidate == 'null')
	{
		console.info('%c CANDIDATE IS NULL !!', 'color:#FF00CC');
		return;
	}
	
	this.jWebRtcManager.addIceCandidateEvent(peerID ,iceData.candidate);
}

JSignalingEventHandler.prototype.offerEvent = function (responseData) {
	
	var peerID = responseData.senderID;
	
	console.log('%c SERVER RECEIVED -> OFFER :: %c SENDER ID[' + peerID + ']', 'color:#FF9900','color:#444444');
	
	this.jWebRtcManager.makeVideo(peerID, this.jWebRtcManager.getPeerVideoElement());
	this.jWebRtcManager.createChannel(peerID);
	this.jWebRtcManager.setRemoteDescription(peerID, responseData.message);
	this.jWebRtcManager.sendAnswer(peerID);
	
}

JSignalingEventHandler.prototype.answerEvent = function (responseData) {
	
	var peerID		= responseData.senderID;
	
	console.log('%c SERVER RECEIVED -> ANSWER :: %c SENDER ID[' + peerID + ']', 'color:#FF9900','color:#444444');
	
	this.jWebRtcManager.setRemoteDescription(peerID, responseData.message);
	
}

JSignalingEventHandler.prototype.inviteEvent = function (responseData) {
	
	var id		= responseData.senderID;
	
	console.log('%c SERVER RECEIVED -> INVITE :: %c CALLER ID[' + id + ']', 'color:#FF9900','color:#444444');
	
	this.jWebRtcManager.makeVideo(id, this.jWebRtcManager.getPeerVideoElement());
	this.jWebRtcManager.createChannel(id);
	this.jWebRtcManager.sendOffer(id);
	
}

JSignalingEventHandler.prototype.exitEvent = function (responseData) {
	
	var peerID = responseData.senderID;
	
	console.log('%c SERVER RECEIVED -> EXIT :: %c USER ID [' + peerID + ']', 'color:#FF9900','color:#444444');
	
	this.jWebRtcManager.destroyChannelList();
	
	var exitVideoElement = document.getElementById('video-' + peerID);
	exitVideoElement.parentNode.removeChild(exitVideoElement);
	
}