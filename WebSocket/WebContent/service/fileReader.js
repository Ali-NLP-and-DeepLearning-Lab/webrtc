<<<<<<< HEAD
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
=======
self.onmessage = function (e) {
	
	console.log('webworker onmessage');
	
	var file = e.data;
	
	console.log(file);
	
	var fileReader = new FileReader();
	
	fileReader.onloadstart = function (e) {
		console.log('onloadstart');
		console.log(e);
	}
	
	fileReader.onprogress = function (e) {
		console.log('onprogress');
		console.log(e);
	}


	fileReader.onload = function (e) {
		console.log('onload');
		console.log(e);
	}
	
	fileReader.onerror = function (e) {
		console.log('onerror');
		console.log(e);
	}
	
	fileReader.onabort = function (e) {
		console.log('onabort');
		console.log(e);
	}
	
	fileReader.onloadend = function (e) {
		console.log('onloaded');
		console.log(e);
>>>>>>> branch 'master' of https://github.com/YounHyunJun/webrtc.git
		postMessage(e.srcElement.result);
	}
	
	fileReader.readAsDataURL(file);
	
}