self.importScripts( 'shared.js' );

let api;
let port;
let ctx2d;

const apiOptions = {
  readBuffer: ( f ) => fetch( f ).then( r => r.arrayBuffer() ),
  async compileStreaming ( filename ) {
    const response = fetch( filename + ".wasm" );

    if ( WebAssembly.compileStreaming )
      return WebAssembly.compileStreaming( response );
    else
      return WebAssembly.compile(
        await response.then( r => r.arrayBuffer() )
      )
  },

  hostWrite ( data ) {
    port.postMessage( { id: 'write', data } );
  }
};

let currentApp = null;

const onAnyMessage = async event => {
  switch ( event.data.id ) {
    case 'constructor':
      port = event.data.data;
      port.onmessage = onAnyMessage;
      api = new API( apiOptions );
      break;

    case 'compileToAssembly': {
      const responseId = event.data.responseId;
      let output = null;
      let transferList;
      try {
        output = await api.compileToAssembly( event.data.data );
      } finally {
        port.postMessage( {
          id: 'compileToAssembly',
          responseId,
          data: output
        },
          transferList
        );
      }
      break;
    }

    case 'compileLinkRun':
      if ( currentApp ) {
        console.log( 'First, disallowing rAF from previous app.' );
        // Stop running rAF on the previous app, if any.
        currentApp.allowRequestAnimationFrame = false;
      }
      currentApp = await api.compileLinkRun( event.data.data );
      console.log( `finished compileLinkRun. currentApp = ${ currentApp }.` );
      break;
  }
};

self.onmessage = onAnyMessage;
