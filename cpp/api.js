const sleep = t => new Promise( ( r, _ ) => setTimeout( r, t ) );

function debounceLazy ( f, ms ) {
  let waiting = 0;
  let running = false;

  const wait = async () => {
    ++waiting;
    await sleep( ms );
    return --waiting === 0;
  };

  const wrapped = async ( ...args ) => {
    if ( await wait() ) {
      while ( running )
        await wait();

      running = true;
      try {
        await f( ...args );
      } finally {
        running = false;
      }
    }
  };
  return wrapped;
}

let editor;
const term = document.querySelector( '#term' );

const run = debounceLazy( editor => api.compileLinkRun( editor.getValue() ), 100 );
const setKeyboard = name => editor.setKeyboardHandler( `ace/keyboard/${ name }` );

class WorkerAPI {
  constructor () {
    this.nextResponseId = 0;
    this.responseCBs = new Map();
    this.worker = new Worker( 'worker.js' );
    const channel = new MessageChannel();
    this.port = channel.port1;
    this.port.onmessage = this.onmessage.bind( this );

    const remotePort = channel.port2;
    this.worker.postMessage(
      { id: 'constructor', data: remotePort },
      [ remotePort ]
    );
  }

  terminate () {
    this.worker.terminate();
  }

  async compileToAssembly ( options ) {
    const responseId = this.nextResponseId++;
    const responsePromise = new Promise( ( resolve, reject ) => {
      this.responseCBs.set( responseId, { resolve, reject } );
    } );
    this.port.postMessage( {
      id: 'compileToAssembly',
      responseId,
      data: options
    } );
    return await responsePromise;
  }

  compileLinkRun ( contents ) {
    this.port.postMessage( {
      id: 'compileLinkRun', data: contents
    } );
  }

  onmessage ( event ) {
    switch ( event.data.id ) {
      case 'write':
        term.innerHTML += event.data.data;
        break;

      case 'compileToAssembly': {
        const responseId = event.data.responseId;
        const promise = this.responseCBs.get( responseId );
        if ( promise ) {
          this.responseCBs.delete( responseId );
          promise.resolve( event.data.data );
        }
        break;
      }
    }
  }
}

const api = new WorkerAPI();

async function initLayout () {
  const start = await fetch( 'mbrot.cc' ).then( r => r.text() );

  editor = ace.edit( 'editor' );
  editor.session.setMode( 'ace/mode/c_cpp' );
  editor.setKeyboardHandler( 'ace/keyboard/sublime' );
  editor.setValue( start );
  editor.clearSelection();
}

document.querySelector( '#run' )
  .addEventListener( 'click', e => run( editor ) );
initLayout();