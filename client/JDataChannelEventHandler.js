function JDataChannelEventHandler (serviceManager) {
	
	this.serviceManager = serviceManager;
	
	this.CHATTING = 'chat';
	this.FILE = 'file';
	
	this.FILE_TRANSPORT_START = 'start';
	this.FILE_TRANSPORT_END = 'end';
	
	this.receiveBuffer = [];
	this.receivedSize = 0;
	this.receivedFileName = '';
	this.receivedFileSize = 0;
	
	this.receiveProgressElement = document.getElementById('receiveProgress');
	
}

JDataChannelEventHandler.prototype.invoke = function (event) {
	
	switch (event.target.label) {
		case this.serviceManager.CHAT_CHANNEL:
			
			var eventData = JSON.parse(event.data); 
			
			console.log('%c DATA CHANNEL RECEIVED -> CHATTING', 'color:#000066');
			
			var chatAreaElement 	= document.getElementById('chatArea');
			chatAreaElement.innerHTML += eventData.chatMessage + '\n';
			
			break;
		case this.serviceManager.FILE_CHANNEL:
			
			var fileListElement = document.getElementById('fileList');
			var fileElement = document.createElement('a');
			
			this.receiveBuffer.push(event.data);
			this.receivedSize += event.data.byteLength;
			this.receiveProgressElement.value = this.receivedSize; 
			
			if (this.receivedSize === this.receivedFileSize)
			{
				var received = new Blob(this.receiveBuffer);
				this.receiveBuffer = [];
				
				fileElement.href = URL.createObjectURL(received);
				fileElement.download = this.receivedFileName;
				fileElement.innerHTML = this.receivedFileName;
				fileElement.style.display = 'block';
				fileElement.style.height = '26px';
				fileElement.target = '_blank';
				
				console.log('%c DATA CHANNEL RECEIVED -> FILE END : ' + this.receivedFileName + '/' + (this.receivedSize / 1024) + 'KByte', 'color:#000066');
				this.receivedFileName = '';
				this.receivedFileSize = 0;
				this.receiveProgressElement.value = 0;
			}
			
			fileListElement.appendChild(fileElement);
			break;
		case this.serviceManager.FILE_SIGNAL_CHANNEL:
			
			var eventData = JSON.parse(event.data);
			
			if (eventData.state == this.FILE_TRANSPORT_START) {
				console.log('%c DATA CHANNEL RECEIVED -> FILE START : ' + eventData.fileName + '/' + (eventData.fileSize / 1024) + 'KByte', 'color:#000066');
				
				this.receivedFileName = eventData.fileName;
				this.receivedFileSize = eventData.fileSize;
				this.receiveProgressElement.max = eventData.fileSize;
			}
			break;
		case this.serviceManager.GEO_LOCATION_CHANNEL:
			
			var eventData = JSON.parse(event.data);
			
			var locationManager = this.serviceManager.locationManager;
			
			locationManager.showLocation(eventData);
			
			break;
		default:
			break;
	}
	
}