function LocationManager (serviceManager, mapElement) {
	this.serviceManager = serviceManager;
	this.mapElement = mapElement;
	this.locations = [];
	this.map = {};
	this.markers = {};
	this.movingMarkers = {};
};

LocationManager.prototype.getGeoLocation = function (callback) {
	
	navigator.geolocation.getCurrentPosition(callback, function (failuer) {
		console.log(failuer);
	})
	
};

LocationManager.prototype.setMyLocation = function () {
	
	var _this = this;
	
	var showMyLocation = function (location) {
		
		var myLocation = {
				id : _this.serviceManager.loginID,
				lat : location.coords.latitude,
				lng : location.coords.longitude
		}
		
		_this.map = new google.maps.Map(_this.mapElement, {
			zoom : 14,
			center : myLocation 
		});
		
		_this.markers[myLocation.id] = new google.maps.Marker({
			position: myLocation,
			map : _this.map,
			label : myLocation.id
		});
		
		setTimeout(_this.movingMyLocation.bind(_this), 2000);
	};
	
	this.getGeoLocation(showMyLocation);
};

LocationManager.prototype.movingMyLocation = function () {
	
	var _this = this;
	
	var showMyLocation = function (location) {
		
		var myLocation = {
				id : _this.serviceManager.loginID,
				lat : location.coords.latitude,
				lng : location.coords.longitude
		}
		
		if (_this.markers[myLocation.id])
			_this.markers[myLocation.id].setPosition(myLocation);
		
		_this.serviceManager.sendDataChannel(_this.serviceManager.GEO_LOCATION_CHANNEL, JSON.stringify(myLocation));
		_this.movingMarkers[myLocation.id] = setTimeout(_this.movingMyLocation.bind(_this), 1000);
	};
	
	this.getGeoLocation(showMyLocation);
};

LocationManager.prototype.showLocation = function (location) {
	
	if (this.markers[location.id] == null)
	{
		this.markers[location.id] = new google.maps.Marker({
			position: location,
			map : this.map,
			label : location.id
		});
		
		return;
	}
	
	this.markers[location.id].setPosition(location);
	
};

