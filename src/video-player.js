const PLAY_ICON='<svg class="homeVideoIconPlay" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72c0 .79.87 1.29 1.55.88l10.79-6.86a1.03 1.03 0 0 0 0-1.76L9.55 4.26A1.03 1.03 0 0 0 8 5.14z"/></svg>';
const REPLAY_ICON='<svg class="homeVideoIconReplay" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>';
const VIDEO_SRC='media/fixou-apresentacao.mp4';

export function homeVideoFigure(){
  return `<figure class="homeVideo" data-reveal style="--reveal-delay:100ms" aria-label="Vídeo de apresentação do FIXOU"><div class="homeVideoFrame"><video class="homeVideoMedia" id="fixouPresentacao" data-src="${VIDEO_SRC}" poster="assets/fixou-apresentacao-poster.jpg" preload="none" playsinline width="1280" height="720"></video><button class="homeVideoPlay" type="button" data-action="video-play" aria-label="Reproduzir o vídeo de apresentação do FIXOU"><span class="homeVideoPlayIcon" aria-hidden="true">${PLAY_ICON}${REPLAY_ICON}</span><span class="homeVideoPlayLabel">Assistir ao vídeo</span></button></div></figure>`;
}

function applyPreview(root,video,button,label){
  const ended=video.ended;
  root.classList.remove('is-started');
  root.classList.toggle('is-ended',ended);
  video.controls=false;
  video.style.pointerEvents='none';
  button.setAttribute('aria-label',ended?'Reproduzir o vídeo novamente':'Reproduzir o vídeo de apresentação do FIXOU');
  if(label)label.textContent=ended?'Assistir novamente':'Assistir ao vídeo';
}

function applyPlaying(root,video){
  root.classList.add('is-started');
  root.classList.remove('is-ended');
  video.controls=true;
  video.style.pointerEvents='auto';
}

export function initVideoPlayer(){
  const root=document.querySelector('.homeVideo');
  if(!root)return;
  const video=root.querySelector('video');
  const button=root.querySelector('.homeVideoPlay');
  if(!video||!button)return;
  const label=root.querySelector('.homeVideoPlayLabel');
  video.addEventListener('play',()=>applyPlaying(root,video));
  video.addEventListener('ended',()=>applyPreview(root,video,button,label));
  video.addEventListener('loadedmetadata',()=>{if(video.paused&&!video.ended)applyPreview(root,video,button,label);});
  applyPreview(root,video,button,label);
}

export function toggleVideoPlayback(){
  const video=document.querySelector('.homeVideo video');
  if(!video)return;
  if(!video.getAttribute('src')&&video.dataset.src){
    video.setAttribute('src',video.dataset.src);
    video.load();
  }
  if(video.ended)video.currentTime=0;
  if(video.paused){const promise=video.play();if(promise&&typeof promise.catch==='function')promise.catch(()=>{});}
  else video.pause();
}
