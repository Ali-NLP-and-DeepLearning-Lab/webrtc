function SignalingChannel (manager) {
 	
 	var RESPONSE = 'response';
 	var EVENT = 'event';
 	
 	this.manager = manager;
 	this.socket = new WebSocket("wss://devcloud.uprism.com:1337");
 	this.packetMap = {};
 	var _this = this;
 	
 	this.socket.onopen = function () {
 		console.log('%c WEBSOCKET OPEN', 'color:#000066');
 	}
 
 	this.socket.onclose = function () {
 		console.log('%c WEBSOCKET CLOSE', 'color:#BF7373');
 	}
 	
 	this.socket.onmessage = function (evt) {
 		
 		var result;
 		
 		try
 		{
 			result = JSON.parse(evt.data);
 		}
 		catch (parseError)
 		{
 			console.log(evt);
 			console.err(parseError);
 			alert('SOCKET ON MESSAGE ERROR (JSON Parse)');
 		}
 		
 		if (result.type === RESPONSE)
 		{
 			var requestData 	= _this.packetMap[result.packetID].message;
 			
 			if (requestData.callback != null && typeof requestData.callback == 'function')
 				requestData.callback(result);
 			
 			delete _this.packetMap[result.packetID];
 		}
		else if (result.type === EVENT)
		{
			_this.manager.signalingEventHandler.invoke(result);
		}
	}
}
 
SignalingChannel.prototype.send = function (method, message, receiverID) {
 
 	if (typeof message !== 'object')
 	{
 		alert('send Data is not Object');
 		return;
 	}
 	
 	var packetID 	= guid();
 	var requestData = {
 			method : method,
 			senderID : this.manager.loginID,
 			receiverID : receiverID,
 			packetID : packetID,
 			type : 'request',
 			message : message
 	}
 	
 //	console.info('SERVER SEND  : ' + JSON.stringify(requestData))
 	this.packetMap[packetID] = requestData;
 	this.socket.send(JSON.stringify(requestData));
 }
 
SignalingChannel.prototype.guid = function guid() {
  
	function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	return s4() + s4() + '' + s4() + '' + s4() + '' +
	    s4() + '' + s4() + s4() + s4();
}