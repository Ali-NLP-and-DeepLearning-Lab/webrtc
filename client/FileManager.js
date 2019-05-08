function FileManager (serviceManager, progressElement) {
	
	this.serviceManager = serviceManager;
	this.progressElement = progressElement;
	this.localBuffer = [];
	this.fileWorkerList = [];
	this.localSize = 0;
	
	this.SUCCESS = 'success';
	this.EXIT = 'exit';
	this.START = 'start';
	this.END = 'end';
	
}

FileManager.prototype.sendFile = function (file, callback) {
	
	var _FILE_SIGNAL_CHANNEL = this.serviceManager.FILE_SIGNAL_CHANNEL;
	var _this = this;
	
	this.progressElement.max = file.size;
	console.log('%c LOCAL -> FILE SEND START', 'color:#000066');
	this.serviceManager.sendDataChannel(_FILE_SIGNAL_CHANNEL, JSON.stringify(this.getRequestData(file.size, file.name, this.START)));
	
	var fileEndCallback = function (workerID) {
		
		var received = new Blob(_this.localBuffer);
		
		console.log('%c LOCAL -> FILE SEND END', 'color:#000066');
		_this.serviceManager.sendDataChannel(_FILE_SIGNAL_CHANNEL, JSON.stringify(_this.getRequestData(file.size, file.name, this.END)));
		
		var callbackData = {
				blob : received,
				result : _this.SUCCESS
		}
		
		callback(callbackData);
		
		_this.fileWorkerList[workerID].terminate();
		_this.progressElement.value = 0;
		_this.localBuffer = [];
		
		delete _this.fileWorkerList[workerID];
		
	};
	
	this.getLocalFile(file, fileEndCallback);
	
};

FileManager.prototype.getLocalFile = function (file, endFileCallback) {
	
	var fileWorker = new Worker('fileReader.js');
	var _this = this;
	var _workerID = this.serviceManager.guid();
	var _FILE_CHANNEL = this.serviceManager.FILE_CHANNEL;
	
	fileWorker.postMessage(file);
	
	fileWorker.onmessage = function (evt) 
	{
		if (typeof evt.data === 'string')
		{
			if (evt.data === _this.EXIT)
			{
				endFileCallback(_workerID);
				return;
			}
		}
		
		_this.localBuffer.push(evt.data);
		_this.serviceManager.sendDataChannel(_FILE_CHANNEL, evt.data);
		
		console.log(evt.data.byteLength);
		
		_this.progressElement.value += evt.data.byteLength;
	}
	

	fileWorker.onclose = function (evt) {
		console.log(evt);
	}
	
	this.fileWorkerList[_workerID] = fileWorker;
	
};

FileManager.prototype.getRequestData = function (size, name, state) {
	
	return {
		type : 'file',
		fileSize : size,
		fileName : name,
		state : state
	}
	
}
