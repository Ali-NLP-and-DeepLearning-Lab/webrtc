## Web RTC (RealTime Communication)

- 활용 사례 코드 정리

1. Server Node JS
2. Web Client

- Node JS 는 시그널링 서버의 역할을 하며 모든 클라이언트는 Mesh 형태로 통신한다.
- 영상 채널과 데이터 채널이 존재하며 데이터 채널을 통해 채팅 및 위치 정보들을 주고 받는다.

### WebRTC 사용방법

WebRTC 는 MediaStream, RTCPeerConnection, RTCDataChannel API 를 제공합니다.

javascript 를 이용해 브라우저에서 하드웨어를 접근하려면 각 브라우저에서 API 를 제공해주어야 합니다.
마이크와 비디오 장치에 접근할 수 있는 API 가 MediaStream 이라는 함수 객체입니다.

RTCPeerConnection 은 시그널링 서버를 통해 얻은 메타정보를 바탕으로 피어간 미디어를 전달하는 통로의 역할을 합니다.

