/**
 * YouTube embed proxy — World Monitor style.
 * Serves HTML page with YT.Player for reliable embed (autoplay, mute, postMessage).
 */

function sanitizeVideoId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = sanitizeVideoId(searchParams.get('videoId'));

  if (!videoId) {
    return new Response('Missing or invalid videoId', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const autoplay = searchParams.get('autoplay') === '1' ? 1 : 0;
  const mute = searchParams.get('mute') !== '0' ? 1 : 0;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden}
#player{width:100%;height:100%}
#play-overlay{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,0.4)}
#play-overlay svg{width:72px;height:72px;opacity:0.9}
#play-overlay.hidden{display:none}
</style>
</head>
<body>
<div id="play-overlay"><svg viewBox="0 0 68 48"><path fill="#fff" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.06 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.79 0 24 0 24s.06 10.21 1.48 15.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.94-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.21 68 24 68 24s-.06-10.21-1.48-15.26z"/><path fill="#f00" d="M45 24L27 14v20"/></svg></div>
<div id="player"></div>
<script>
var tag=document.createElement('script');
tag.src='https://www.youtube.com/iframe_api';
document.head.appendChild(tag);
var player,overlay=document.getElementById('play-overlay'),started=false;
function hideOverlay(){overlay.classList.add('hidden')}
function onYouTubeIframeAPIReady(){
  player=new YT.Player('player',{
    videoId:'${videoId}',
    host:'https://www.youtube.com',
    playerVars:{autoplay:${autoplay},mute:${mute},playsinline:1,rel:0,controls:1,modestbranding:1},
    events:{
      onReady:function(){if(${autoplay}===1)player.playVideo()},
      onStateChange:function(e){if(e.data===1||e.data===3){hideOverlay();started=true}}
    }
  });
}
overlay.addEventListener('click',function(){
  if(player&&player.playVideo){player.playVideo();player.unMute();hideOverlay()}
});
setTimeout(function(){if(!started)overlay.classList.remove('hidden')},3000);
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors 'self' https://lebanonmonitor-production.up.railway.app http://localhost:3000",
    },
  });
}
