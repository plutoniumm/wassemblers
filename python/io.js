function get ( url, options = {} ) {
  const res = fetch( url, options );
  const contentType = res.headers?.get( 'content-type' );
  if ( contentType ) {
    if ( contentType.includes( 'application/json' ) ) {
      return res.then( r => r.json() );
    } else if ( contentType.includes( 'text/html' ) ) {
      return res.then( r => r.text() );
    } else {
      return res.then( r => r.blob() );
    }
  } else {
    return res.then( r => r.text() );
  }
};

function post ( url, data, options = {} ) {
  options.method = 'POST';
  options.body = JSON.stringify( data );
  options.headers = {
    'Content-Type': 'application/json'
  };
  return get( url, options );
};

function delete_ ( url, options = {} ) {
  options.method = 'DELETE';
  return get( url, options );
};

function put ( url, data, options = {} ) {
  options.method = 'PUT';
  options.body = JSON.stringify( data );
  options.headers = {
    'Content-Type': 'application/json'
  };
  return get( url, options );
};

const $ = ( s ) => document.querySelector( s );

const pkg_in = $( '#packages' );
const tag = $( 'py-config' );

const parse = ( text ) => text.trim()
  .split( ',' )
  .map( p => p.trim() )
  .filter( p => p.length > 0 );

function updatePackages () {
  let packages = parse( pkg_in.value );
  // set to url
  let url = new URL( window.location.href );
  url.searchParams.set( 'packages', packages.join( ',' ) );
  window.history.pushState( {}, '', url );
  window.location.reload();
};
pkg_in.addEventListener( 'change', updatePackages );
// onload set py-config
let packages = new URLSearchParams( window.location.search ).get( 'packages' ) || [];
if ( packages.length > 0 ) {
  packages = parse( packages );
  pkg_in.value = packages.join( ', ' );
  packages = `\n {\n"packages": ${ JSON.stringify( packages ) }\n}`;
  tag.innerHTML = packages;
}