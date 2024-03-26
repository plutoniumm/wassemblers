const $ = ( str ) => document.querySelector( str );
document.addEventListener( "DOMContentLoaded", function () {
  if ( !WebAssembly || !WebAssembly.instantiate ) {
    throw new Error( "WebAssembly required" );
  };

  let cmds = {};
  const exec = ( wasm, args ) => new Promise( ( res, rej ) => {
    const go = new Go();
    go.exit = res;
    go.argv = go.argv.concat( args || [] );

    WebAssembly.instantiate( wasm, go.importObject )
      .then( r => go.run( r.instance ) );
  } );

  const getBuf = ( path ) => fetch( path )
    .then( r => r.arrayBuffer() )
    .then( b => new Uint8Array( b ) );

  Promise.all( [
    "prebuilt/runtime.a",
    "prebuilt/internal/bytealg.a",
    "prebuilt/internal/cpu.a",
    "prebuilt/runtime/internal/atomic.a",
    "prebuilt/runtime/internal/math.a",
    "prebuilt/runtime/internal/sys.a",
  ]
    .map( ( path ) => getBuf( path ).then( b => writeFS( path, b ) ) )
    .concat( [ "compile", "link" ].map( ( cmd ) =>
      getBuf( "cmd/" + cmd + ".wasm" ).then( b => cmds[ cmd ] = b ),
    ) ),
  ).then( () => {
    const decoder = new TextDecoder( "utf-8" );
    const encoder = new TextEncoder( "utf-8" );

    writeFS(
      "/importcfg",
      encoder.encode( "packagefile runtime=prebuilt/runtime.a" )
    );

    writeFS(
      "/importcfg.link",
      encoder.encode(
        "packagefile command-line-arguments=main.a\n" +
        "packagefile runtime=prebuilt/runtime.a\n" +
        "packagefile internal/bytealg=prebuilt/internal/bytealg.a\n" +
        "packagefile internal/cpu=prebuilt/internal/cpu.a\n" +
        "packagefile runtime/internal/atomic=prebuilt/runtime/internal/atomic.a\n" +
        "packagefile runtime/internal/math=prebuilt/runtime/internal/math.a\n" +
        "packagefile runtime/internal/sys=prebuilt/runtime/internal/sys.a",
      ),
    );

    playground( {
      codeEl: "#code",
      outputEl: "#output",
      runEl: "#run",
      transport: {
        Run: ( body, output ) => {
          $( "#run" ).setAttribute( "disabled", true );

          writeFS( "/main.go", body );
          output( { Kind: "start" } );
          goStderr = ( buf ) => output( {
            Kind: "stderr", Body: decoder.decode( buf ),
          } );
          goStdout = ( buf ) => output( {
            Kind: "stdout", Body: decoder.decode( buf ),
          } );

          exec( cmds[ "compile" ], [
            "-p", "main", "-complete", "-dwarf=false", "-pack",
            "-importcfg", "importcfg", "main.go",
          ] )
            .then( c => c || exec( cmds[ "link" ], [
              "-importcfg", "importcfg.link", "-buildmode=exe", "main.a",
            ] ) )
            .then( c => c || exec( readFS( "a.out" ) ) )
            .then( c => output( {
              Kind: "end", Body: c ? "status " + c : undefined,
            } ) )
            .catch( ( err ) => output( {
              Kind: "end", Body: "wasm error: " + ( err.message || "'?'" ),
            } ) )
            .finally( () =>
              $( "#run" ).removeAttribute( "disabled" ),
            );

          return {
            Kill: () => { },
          };
        },
      },
    } );

    $( "#run" ).value = "Run";
    $( "#run" ).removeAttribute( "disabled" );
  } );
} );