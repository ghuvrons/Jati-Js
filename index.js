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
    this.ws = new WebSocket(this.base_url);
    let _jati = this;
    this.ws.addEventListener('open', function (event) {
      // Listen for messages
      this.addEventListener('message', function (event) {
        _jati.onEvent(event.data);
      });

      this.addEventListener('close', function (event) {
        _jati.isConnected = false;
          if(!_jati.isClose)
            _jati.connect();
      });

      _jati.isConnected = true;
      while (_jati._emit_queue.length > 0) {
        this.send(_jati._emit_queue.shift())
      }
      _jati.onConnected();
    });

    this.ws.addEventListener('error', function (event) {
      this.close();
      setTimeout(_jati.connect(), 1000);
    });
  }

  onConnected(){
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
  
  emit(event, data = null){
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