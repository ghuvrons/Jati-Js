var WebSocket = require('websocket').w3cwebsocket;

class Jati {
  constructor(base_url) {
    this.base_url = base_url;
    this.ws = null;
    this.isConnected = false;
    this.reconnecting = null;
    this.isClose = false;
    this._events = {};
    this._emit_queue = [];
    this.connect();
  }
  connect(){
    console.log("connecting")
    this.ws = new WebSocket(this.base_url);
    let _jati = this;
    this.ws.addEventListener('open', function (event) {
      _jati.isConnected = true;
      while (_jati._emit_queue.length > 0) {
        this.send(_jati._emit_queue.shift())
      }
      _jati.onConnected();
    });

    this.ws.addEventListener('error', function (event) {
      this.ws.close();
      setTimeout(_jati.connect(), 1000);
    });
    
    this.ws.addEventListener('close', function (event) {
      _jati.isConnected = false;
      if(!this.isClose)
        _jati.connect();
    });

    // Listen for messages
    this.ws.addEventListener('message', function (event) {
      _jati.onEvent(event.data);
    });
  }

  onConnected(){
    console.log("connected")
  }

  onEvent(msg){
    let _msg = JSON.parse(msg);
    if(_msg.status != 200){
      return;
    }
    if(this._events[_msg.respond] != undefined){
      this._events[_msg.respond](_msg.data)
    }
  }

  on(event, _func){
    this._events[event] = _func
  }
  
  emit(event, data){
    if(this.isConnected){
      this.ws.send(JSON.stringify({
        request: event,
        data: data
      }))
    }else{
      this._emit_queue.push(JSON.stringify({
        request: event,
        data: data
      }))
    }
  }
  close(){
    this._events = {};
    this._emit_queue = [];
    this.isClose = true;
    if(this.ws != null)
      this.ws.close();
  }
}

export default Jati;