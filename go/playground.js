function SocketTransport () {
  "use strict";

  var id = 0;
  var outputs = {};
  var started = {};
  var websocket;
  if ( window.location.protocol == "http:" ) {
    websocket = new WebSocket( "ws://" + window.location.host + "/socket" );
  } else if ( window.location.protocol == "https:" ) {
    websocket = new WebSocket( "wss://" + window.location.host + "/socket" );
  }

  websocket.onclose = function () {
    console.log( "websocket connection closed" );
  };

  websocket.onmessage = function ( e ) {
    var m = JSON.parse( e.data );
    var output = outputs[ m.Id ];
    if ( output === null ) return;
    if ( !started[ m.Id ] ) {
      output( { Kind: "start" } );
      started[ m.Id ] = true;
    }
    output( { Kind: m.Kind, Body: m.Body } );
  };

  function send ( m ) {
    websocket.send( JSON.stringify( m ) );
  }

  return {
    Run: function ( body, output, options ) {
      var thisID = id + "";
      id++;
      outputs[ thisID ] = output;
      send( { Id: thisID, Kind: "run", Body: body, Options: options } );
      return {
        Kill: function () {
          send( { Id: thisID, Kind: "kill" } );
        },
      };
    },
  };
}

function PlaygroundOutput ( el ) {
  "use strict";

  return function ( write ) {
    if ( write.Kind == "start" ) {
      el.innerHTML = "";
      return;
    }

    var cl = "system";
    if ( write.Kind == "stdout" || write.Kind == "stderr" ) cl = write.Kind;

    var m = write.Body;
    if ( write.Kind == "end" ) {
      m = "\nProgram exited" + ( m ? ": " + m : "." );
    }

    if ( m.indexOf( "IMAGE:" ) === 0 ) {
      // TODO(adg): buffer all writes before creating image
      var url = "data:image/png;base64," + m.substr( 6 );
      var img = document.createElement( "img" );
      img.src = url;
      el.appendChild( img );
      return;
    }

    // ^L clears the screen.
    var s = m.split( "\x0c" );
    if ( s.length > 1 ) {
      el.innerHTML = "";
      m = s.pop();
    }

    m = m.replace( /&/g, "&amp;" );
    m = m.replace( /</g, "&lt;" );
    m = m.replace( />/g, "&gt;" );

    var needScroll = el.scrollTop + el.offsetHeight == el.scrollHeight;

    var span = document.createElement( "span" );
    span.className = cl;
    span.innerHTML = m;
    el.appendChild( span );

    if ( needScroll ) el.scrollTop = el.scrollHeight - el.offsetHeight;
  };
}

( function () {
  function lineHighlight ( error ) {
    var regex = /prog.go:([0-9]+)/g;
    var r = regex.exec( error );
    while ( r ) {
      var lines = $( ".lines div" );
      lines[ r[ 1 ] - 1 ].classList.add( "lineerror" );
      r = regex.exec( error );
    }
  }
  function highlightOutput ( wrappedOutput ) {
    return function ( write ) {
      if ( write.Body ) lineHighlight( write.Body );
      wrappedOutput( write );
    };
  }

  function lineClear () {
    const el = $( ".lineerror" );
    if ( el )
      el.classList.remove( "lineerror" );
  }

  // opts is an object with these keys
  //  codeEl - code editor element
  //  outputEl - program output element
  //  runEl - run button element
  //  toysEl - toys select element (optional)
  //  enableVet - enable running vet and displaying its errors
  function playground ( opts ) {
    var transport = opts[ "transport" ];
    var running;

    var outdiv = $( opts.outputEl );
    outdiv.innerHTML = "";
    var output = document.createElement( "pre" );
    outdiv.appendChild( output );

    function body () {
      return $( opts.codeEl ).value;
    }

    function loading () {
      lineClear();
      if ( running ) running.Kill();
      console.log( output );
      output.classList.remove( "error" );
      output.innerText = "Waiting for remote server...";
    }
    function run () {
      loading();
      running = transport.Run(
        body(),
        highlightOutput( PlaygroundOutput( output ) ),
      );
    }

    $( opts.runEl ).onclick = run;
  }

  window.playground = playground;
} )();
