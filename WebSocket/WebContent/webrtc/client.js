(function () {
	
	window.connectionWs = new WebSocket('ws://127.0.0.1:1337');
	
	connectionWs.onopen = function () {
	
		console.log('ws onopen');
		
	};
	
	connectionWs.onmessage = function (message) {
		
		try
		{
			var json = JSON.parse(message.data);
		}
		catch (e)
		{
			console.err(e);
		}
		
		return;
	};
	
	connectionWs.onerror = function () {
		console.log('error');
	};
	
})();

function sendMessage () {
	window.connectionWs.send('test');
}
