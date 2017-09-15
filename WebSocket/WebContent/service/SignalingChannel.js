function SignalingChannel () {
	
	this.socket = new WebSocket("wss://devcloud.uprism.com:1337");
	
	this.socket.onopen = function () {
		console.log('WebSocket is open');
	}

	this.socket.onclose = function () {
		console.log('WebSocket is close');
	}
	
	this.socket.onmessage = function (e) {
		
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
		
		this.invokeEvent(result)
	}
}

SignalingChannel.prototype.send = function (data) {
	console.log('send Data : ' + data);
	
	this.socket.send(data);
}