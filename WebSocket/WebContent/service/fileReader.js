 self.onmessage = function (e) {
	
	var file = e.data;
	
	var fileReader = new FileReader();
	
	fileReader.onloadstart = function (e) {
	}
	
	fileReader.onprogress = function (e) {
	}


	fileReader.onload = function (e) {
	}
	
	fileReader.onerror = function (e) {
	}
	
	fileReader.onabort = function (e) {
	}
	
	fileReader.onloadend = function (e) {
		postMessage(e.srcElement.result);
	}
	
	fileReader.readAsDataURL(file);
	
}