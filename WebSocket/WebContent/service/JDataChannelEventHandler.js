function JDataChannelEventHandler () {
	
	this.CHATTING = 'chat';
	this.FILE = 'file';
	
}

JDataChannelEventHandler.prototype.invoke = function (event) {
	
	switch (event.type) {
		case this.CHATTING:
			
			console.log('%c DATA CHANNEL RECEIVED -> CHATTING', 'color:#000066');
			
			var chatAreaElement 	= document.getElementById('chatArea');
			chatAreaElement.innerHTML += event.chatMessage + '\n';
			
			break;
		case this.FILE:
			console.log('%c DATA CHANNEL RECEIVED -> FILE', 'color:#000066');
			
			var fileListElement = document.getElementById('fileList');
			var fileElement = document.createElement('a');
			
			fileElement.href = event.fileData;
			fileElement.innerHTML = event.fileName;
			fileElement.style.display = 'block';
			fileElement.style.height = '26px';
			fileElement.target = '_blank';
			fileElement.download = event.fileName;
			
			fileListElement.appendChild(fileElement);
			break;
	default:
		break;
	}
	
}