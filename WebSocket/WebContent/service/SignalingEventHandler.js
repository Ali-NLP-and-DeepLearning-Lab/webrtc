function SignalingEventHandler () {
	
	this.OFFER = 'offer';
	this.ANSWER = 'answer';
	this.LOGIN = 'login';
	this.LOGOUT = 'logout';
	this.ATTEND = 'attend';
	this.EXIT = 'exit';
	this.INVITE = 'invite'
	
}
 
SignalingEventHandler.prototype.invoke = function (event) {

	switch (event.method) {
	case this.LOGIN:
	case this.LOGOUT:
	case this.OFFER:
	case this.ANSWER:
	case this.INVITE:
	case this.ATTEND:
	case this.EXIT:
		
		break;
	default:
		break;
	}
	 
}
 
 