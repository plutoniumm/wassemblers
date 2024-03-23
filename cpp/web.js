let layout = null;

async function initLayout () {
  const start = await fetch( 'examples/03_mbrot.cc' ).then( r => r.text() );

  layout = new Layout( {
    configKey: 'layoutConfig',
    defaultLayoutConfig: {
      settings: {
        showCloseIcon: false,
        showPopoutIcon: false,
      },
      content: [ {
        type: 'row',
        content: [
          {
            type: 'component',
            componentName: 'editor',
            componentState: {
              fontSize: 18,
              value: start
            },
          },
          {
            type: 'stack',
            content: [ {
              type: 'component',
              componentName: 'terminal',
              componentState: { fontSize: 18 },
            } ]
          }
        ]
      } ]
    }
  } );

  layout.on( 'initialised', event => {
    // Editor stuff
    editor.commands.addCommand( {
      name: 'run',
      bindKey: { win: 'Ctrl+Enter', mac: 'Command+Enter' },
      exec: run
    } );
  } );
  layout.init();
}

document.querySelector( '#run' ).addEventListener( 'click', e => run( editor ) );
initLayout();