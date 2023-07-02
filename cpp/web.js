const initialProgram =
  `#include <iostream>

int main() {
  std::cout << "Hello, CppCon!\n";
}`;

// Golden Layout
let layout = null;

function initLayout () {
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
              value: initialProgram
            },
          },
          {
            type: 'stack',
            content: [ {
              type: 'component',
              componentName: 'terminal',
              componentState: { fontSize: 18 },
            }, {
              type: 'component',
              componentName: 'canvas',
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

  layout.registerComponent( 'canvas', CanvasComponent );
  layout.init();
}

$( '#run' ).on( 'click', e => run( editor ) );
initLayout();