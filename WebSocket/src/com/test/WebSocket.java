package com.test;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/websocket")
public class WebSocket {

	static Map<String, Session> sessions 	= new ConcurrentHashMap<String, Session>();
	String LOGIN							= "login";
	String OFFER							= "offer";
	String ANSWER							= "answer";

	String BOARDCAST 						= "boardcast";
	String SINGLE 							= "single";
	
	String sendType							= null;
	@OnOpen
	public void handleOpen(Session session) {
	}
	
	@OnMessage
	public void handleMessage (Session session, String message) {
		
		System.out.println("message : " + message);
		
		String[]	messages 	= message.split("#_#");
		String		method		= messages[1];
		String		from		= messages[2];
		String		to			= messages[3];
		String		data		= messages[4];
		sendType				= messages[0];
		
		if (LOGIN.equals(method))
		{
			System.out.println("LOGIN - " + from);
			sessions.put(from, session);
			
			sendMessage(session, from, LOGIN + "#_#" + from);
			
			return;
		}
		else if (OFFER.equals(method))
		{
			sendMessage(session, to, method + "#_#" + from + "#_#" + to + "#_#" + data);
		}
		else if (ANSWER.equals(method))
		{
			sendMessage(session, to, method + "#_#" + from + "#_#" + to + "#_#" + data);
		}
		else
		{
			sendMessage(session, to, method + "#_#" + from + "#_#" + to + "#_#" + data);
		}
	}
	
	
	public void sendMessage (Session session, String id, String message) {
		
		if (BOARDCAST.equals(sendType))
			sendBoardCastMessage(session, message);
		else if (SINGLE.equals(sendType))
			sendSingleMessage(id, message);
		
	}
	
	public void sendBoardCastMessage (Session session, String message) {
		for (String key : sessions.keySet())			
		{
			if (sessions.get(key).getId().equals(session.getId()))
				continue;
			
			try {
				System.out.println("전파_이벤트 전달 - 사용자 : " + key + " 정보 : " + message);
				
				Thread.sleep(200);
				
				sessions.get(key).getAsyncRemote().sendText(message);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
	
	public void sendSingleMessage (String id, String message)
	{
		try
		{
			System.out.println("개인_이벤트 전달 - 사용자 : " + id + " 정보 : " + message);
			
			Thread.sleep(400);
			
			sessions.get(id).getAsyncRemote().sendText(message);
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		
	}
	
	@OnClose
	public void handClose(Session session) {
		
		sessions.remove(session.getId());
		
		System.out.println("client is now disconnected...");
	}
	
	@OnError
	public void handleError(Throwable t) {
		System.out.println("client error");
		t.printStackTrace();
	}
	
}
