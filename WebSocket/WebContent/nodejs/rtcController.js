module.exports = function () {
	
	var _connecitonList = {};
	
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
		METHOD_EXIT = 'exit';
	
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
		
		_connecitonList[_senderID] = _getConnectionData(connection);
		var responseMessage = _getResponseData(true);
		_sendMessage(_senderID, JSON.stringify(responseMessage));
	};
	
	_logout = function (requestData) {
		
		var responseMessage = _getResponseData(true);
		
		delete _connecitonList[_senderID];
		
		_sendMessage(_senderID, JSON.stringify(responseMessage));
		
	};
	
	_sendReceiver = function (requestData) {
		
		var responseMessage = _getEventData(true);
		_sendMessage(_receiverID, JSON.stringify(responseMessage));
	};
	
	_attend = function (requestData) {
		
		var roomID = requestData.roomID;
		var eventMessage = _getEventData(true);
		var responseMessage = _getResponseData(true);
		
		_sendMessage(_senderID, JSON.stringify(eventMessage));
		_sendRoomBoardCast(roomID, JSON.stringify(responseMessage));
		
	};
	
	_iceCandidate = function (requestData) {
		var eventMessage = _getEventMessage(true);
		sendMessage(_receiverID, JSON.stringify(eventData));
	};
	
	_exit = function (requestData) {
		
		var roomID = requestData.roomID;
		var eventMessage = _getEventData(true);
		
		_sendRoomBoardCast(roomID, eventMessage);
		
		_connecitonList[senderID].roomID = '';
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
			result = true;
		else
			result = false;
		
		return {
			type : 'event',
			result : result,
			senderID : _senderID,
			receiverID : _receiverID,
			message : ''
		}
		
	};
	
	_getResponseData = function (isSuccess) {
		
		var result;
		
		if (isSuccess)
			result = true;
		else
			result = false;
		
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
		_connecitonList[id].connection.sendUTF(message);
	};
	
	_sendRoomBoardCast = function (roomID, message) {
		
		for (var connectedID in _connecitonList)
		{
			if (connectedID == _senderID)
				continue;
			
			if (clients[connectedID].roomID == roomID)
			{
				eventData.receiver	= key;
				sendMessage(key, JSON.stringify(eventData));
			}
		}
	};
	
	return {
		invoke : _invoke
	};
};
