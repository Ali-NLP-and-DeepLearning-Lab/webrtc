 self.onmessage = function (e) {
	
	var file = e.data;
	var chunkSize = 16384;
	
	var sliceFile = function (offset) {
		
		var reader = new FileReader();
		
		reader.onload = function (e) {
			postMessage(e.target.result);
			
			if (file.size > offset + e.target.result.byteLength) {
				setTimeout(sliceFile, 0, offset + chunkSize);
			}
			else
			{
				console.log('%c FILE READER -> FILE LOAD END', 'color:#000066');
				postMessage('exit');
			}
		}
		
		reader.onerror = function (e) {
			console.log('%c FILE READER -> ERROR : ' + file.name , 'color:#000066');
		}
		
		var slice = file.slice(offset, offset + chunkSize);
		reader.readAsArrayBuffer(slice);
	}
	
	sliceFile(0);
}