module.exports = function () {
	
	var _connectionList = {};
	
	var _packetID,
		_method,
		_type,
		_requestData,
		_senderID,
		_receiverID;
		
	var METHOD_LOGIN = 'login',
		METHOD_LOGOUT = 'logout',
		METHOD_OFFER = 'offer',
		METHOD_ANSWER = 'answer',
		METHOD_ATTEND = 'attend',
		METHOD_ICE_CANDIDATE = 'icecandidate',
		METHOD_EXIT = 'exit',
		METHOD_INVITE = 'invite';
	
	var _init,
		_invoke,
		_login,
		_logout,
		_offer,
		_answer,
		_attend,
		_iceCandidate,
		_exit,
		_sendMessage;

	var _getConnectionData,
		_getEventData,
		_getResponseData;
	
	
	_init = function () {
		
	};
	
	_invoke = function (requestData, connection) {
		
		// try Catch 처리 필요
		var data = JSON.parse(requestData);
		
		_packetID		= data.packetID;
		_method 		= data.method;
		_type			= data.type;
		_requestMessage	= data.message;
		_senderID		= data.senderID;
		_receiverID 	= data.receiverID;
		
		switch (_method) 
		{
			case METHOD_LOGIN:
				_login(connection);
				break;
			case METHOD_LOGOUT:
				_logout(_requestMessage);
				break;
			case METHOD_OFFER:
			case METHOD_ANSWER:
				_sendReceiver(_requestMessage);
				break;
			case METHOD_ATTEND:
				_attend(_requestMessage);
				break;
			case METHOD_ICE_CANDIDATE:
				_iceCandidate(_requestMessage);
				break;
			case METHOD_EXIT:
				_exit(_requestMessage);
				break;
			default:
				break;
		}
		
	};
	
	_login = function (connection) {
		
		_connectionList[_senderID] = _getConnectionData(connection);
		var responseMessage = _getResponseData(true);
		_sendMessage(_senderID, JSON.stringify(responseMessage));
	};
	
	_logout = function (requestData) {
		
		var responseMessage = _getResponseData(true);
		
		_sendMessage(_senderID, JSON.stringify(responseMessage));
		
		delete _connectionList[_senderID];
		
	};
	
	_sendReceiver = function (requestData) {
		
		var responseMessage = _getEventData(true);
		responseMessage.message = requestData;
		_sendMessage(_receiverID, JSON.stringify(responseMessage));
		
	};
	
	_attend = function (requestData) {
		
		var roomID = requestData.roomID;
		var eventMessage = _getEventData(true);
		var responseMessage = _getResponseData(true);
		
		_connectionList[_senderID].roomID = roomID;
		responseMessage.roomID = roomID;
		eventMessage.method = METHOD_INVITE;
		
		_sendMessage(_senderID, JSON.stringify(responseMessage));
		_sendRoomBoardCast(roomID, JSON.stringify(eventMessage));
		
	};
	
	_iceCandidate = function (requestData) {
		var eventMessage = _getEventData(true);
		eventMessage.message = requestData;
		_sendMessage(_receiverID, JSON.stringify(eventMessage));
	};
	
	_exit = function (requestData) {
		
		var roomID = requestData.roomID;
		var eventMessage = _getEventData(true);
		var responseMessage = _getResponseData(true);
		
		responseMessage.roomID = roomID;
		
		_sendMessage(_senderID, JSON.stringify(responseMessage));
		_sendRoomBoardCast(roomID, JSON.stringify(eventMessage));
		
		_connectionList[_senderID].roomID = '';
	};
	
	_getConnectionData = function (connection) {
		
		return {
			connection : connection,
			roomID : '',
			message : ''
		}
		
	};
	
	_getEventData = function (isSuccess) {
		
		var result;
		
		if (isSuccess)
			result = 'success';
		else
			result = 'fail';
		
		return {
			type : 'event',
			result : result,
			method : _method,
			senderID : _senderID,
			receiverID : _receiverID,
			message : ''
		}
		
	};
	
	_getResponseData = function (isSuccess) {
		
		var result;
		
		if (isSuccess)
			result = 'success';
		else
			result = 'fail';
		
		return {
			type : 'response',
			packetID : _packetID,
			result : result,
			method : _method,
			senderID : _senderID,
			receiverID : _receiverID,
			message : ''
		}
		
	};
	
	_sendMessage = function (id, message) {
		console.log('id -> ' + id + ' -> message ' + message);
		_connectionList[id].connection.sendUTF(message);
	};
	
	_sendRoomBoardCast = function (roomID, message) {
		
		for (var connectedID in _connectionList)
		{
			if (connectedID == _senderID)
				continue;
			
			if (_connectionList[connectedID].roomID == roomID)
			{
				_sendMessage(connectedID, message);
			}
		}
	};
	
	return {
		invoke : _invoke
	};
};
