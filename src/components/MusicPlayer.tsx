import { useState, useEffect, useRef, useCallback } from 'react';
import { TRACKS } from './tracks';

type RepeatMode = 'none' | 'one' | 'all';

export function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [curIdx, setCurIdx]     = useState(0);
  const [volume, setVolume]     = useState(0.6);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [repeat, setRepeat]     = useState<RepeatMode>('none');

  const audioRef   = useRef<HTMLAudioElement>(null);
  const animRef    = useRef<number>(0);
  const playingRef = useRef(false);
  const repeatRef  = useRef<RepeatMode>('none');

  const track = TRACKS[curIdx];

  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = track.file;
    a.volume = volume;
    a.load();
    if (playingRef.current) {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [curIdx]); // eslint-disable-line

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      setElapsed(Math.floor(a.currentTime));
    };
    const onMeta = () => setDuration(Math.floor(a.duration || 0));
    const onEnd  = () => {
      const r = repeatRef.current;
      if (r === 'one') { a.currentTime = 0; a.play().catch(() => {}); }
      else if (r === 'all') { setCurIdx(i => (i + 1) % TRACKS.length); }
      else {
        setCurIdx(i => {
          if (i + 1 < TRACKS.length) return i + 1;
          setPlaying(false); playingRef.current = false; return i;
        });
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  useEffect(() => {
    const animate = () => { animRef.current = requestAnimationFrame(animate); };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playingRef.current) { a.pause(); setPlaying(false); }
    else { try { await a.play(); setPlaying(true); } catch { setPlaying(false); } }
  }, []);

  const goToTrack = useCallback((idx: number) => {
    if (idx === curIdx) { togglePlay(); return; }
    playingRef.current = true; setPlaying(true); setCurIdx(idx);
  }, [curIdx, togglePlay]);

  const prev = useCallback(() => {
    playingRef.current = true; setPlaying(true);
    setCurIdx(i => (i - 1 + TRACKS.length) % TRACKS.length);
  }, []);

  const next = useCallback(() => {
    playingRef.current = true; setPlaying(true);
    setCurIdx(i => (i + 1) % TRACKS.length);
  }, []);

  const cycleRepeat = () =>
    setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none');

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const fmt = (s: number) =>
    Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);

  const repeatLabel = repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '↩';

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      {/* ── Overlay fond sombre ── */}
      {expanded && (
        <div className="mp-overlay" onClick={() => setExpanded(false)} />
      )}

      {/* ── Popup 80% hauteur ── */}
      {expanded && (
        <div className="mp-popup" onClick={e => e.stopPropagation()}>

          {/* Croix fermeture */}
          <button className="mp-popup-close" onClick={() => setExpanded(false)} aria-label="Fermer">✕</button>

          {/* Piste en cours */}
          <div className="mp-popup-now">
            <div className="mp-popup-track">{track.name}</div>
            <div className="mp-popup-artist">{track.artist}</div>
          </div>

          {/* Barre de progression */}
          <div className="mp-popup-prog" onClick={seek}>
            <div className="mp-popup-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="mp-popup-times">
            <span>{fmt(elapsed)}</span>
            <span>{duration > 0 ? fmt(duration) : '—'}</span>
          </div>

          {/* Contrôles */}
          <div className="mp-popup-ctrls">
            <button
              className={`mp-popup-btn mp-repeat-btn ${repeat !== 'none' ? 'active' : ''}`}
              onClick={cycleRepeat} title="Répéter"
            >
              {repeatLabel}
            </button>
            <button className="mp-popup-btn" onClick={prev}>⏮</button>
            <button className="mp-popup-btn mp-popup-play" onClick={togglePlay}>
              {playing ? '■' : '▶'}
            </button>
            <button className="mp-popup-btn" onClick={next}>⏭</button>
          </div>

          {/* Volume */}
          <div className="mp-popup-vol">
            <span className="mp-vol-lbl">—</span>
            <input type="range" min="0" max="1" step="0.01" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="mp-vol-slider" />
            <span className="mp-vol-lbl">♪</span>
          </div>

          {/* Tracklist */}
          <div className="mp-popup-list-title">
            {repeat === 'one' ? '🔂 RÉPÉTER CETTE PISTE' : repeat === 'all' ? '🔁 RÉPÉTER LA PLAYLIST' : 'À SUIVRE'}
          </div>
          <div className="mp-popup-list">
            {TRACKS.map((t, i) => (
              <button key={t.id}
                className={`mp-popup-item ${i === curIdx ? 'active' : ''}`}
                onClick={() => goToTrack(i)}
              >
                <span className="mpi-num">0{t.id}</span>
                <div className="mpi-info">
                  <div className="mpi-name">{t.name}</div>
                  <div className="mpi-artist">{t.artist}</div>
                </div>
                {i === curIdx && playing && <span className="mpi-play">▶</span>}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* ── Pill (toujours visible, tout cliquable pour ouvrir) ── */}
      <div className={`music-player ${playing ? 'is-playing' : ''}`}>
        <div className="mp-pill" onClick={() => setExpanded(e => !e)}>
          <div className="mp-logo">TODOTAPE FM</div>
          <div className="mp-sep" />
          <div className="mp-center">
            <div className="mp-track-title">{playing ? track.name : 'Tap pour jouer'}</div>
            <div className="mp-track-sub">{playing ? track.artist : '♪ synthwave'}</div>
            <div className="mp-prog-line">
              <div className="mp-prog-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mp-dot" />
          <div className="mp-controls" onClick={e => e.stopPropagation()}>
            <button className="mp-btn" onClick={prev}>⏮</button>
            <button className="mp-btn mp-btn-play" onClick={togglePlay}>
              {playing ? '■' : '▶'}
            </button>
            <button className="mp-btn" onClick={next}>⏭</button>
          </div>
        </div>
      </div>
    </>
  );
}
