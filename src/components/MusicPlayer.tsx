import { useState, useEffect, useRef, useCallback } from 'react';

interface Track {
  id: number;
  name: string;
  artist: string;
  file: string;
}

const TRACKS: Track[] = [
  { id: 1, name: 'Got It Made',  artist: 'Møme, Ricky Ducati', file: '/todotape/music/track-01.mp3' },
  { id: 2, name: 'Nightcall',    artist: 'Kavinsky',            file: '/todotape/music/track-02.mp3' },
  { id: 3, name: 'TRACK 03',     artist: 'Artiste',             file: '/todotape/music/track-03.mp3' },
  { id: 4, name: 'TRACK 04',     artist: 'Artiste',             file: '/todotape/music/track-04.mp3' },
];

export function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [curIdx, setCurIdx]     = useState(0);
  const [volume, setVolume]     = useState(0.6);
  const [progress, setProgress] = useState(0);
  const [bars, setBars]         = useState<number[]>(Array(16).fill(2));

  const audioRef   = useRef<HTMLAudioElement>(null);
  const animRef    = useRef<number>(0);
  const playingRef = useRef(false);

  const track = TRACKS[curIdx];

  useEffect(() => { playingRef.current = playing; }, [playing]);

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
    const onTime = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd  = () => setCurIdx(i => (i + 1) % TRACKS.length);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setBars(playingRef.current
        ? Array(16).fill(0).map(() => Math.random() * 22 + 4)
        : Array(16).fill(2)
      );
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playingRef.current) {
      a.pause(); setPlaying(false);
    } else {
      try { await a.play(); setPlaying(true); }
      catch { setPlaying(false); }
    }
  }, []);

  const goToTrack = useCallback((idx: number) => {
    if (idx === curIdx) { togglePlay(); return; }
    playingRef.current = true;
    setPlaying(true);
    setCurIdx(idx);
  }, [curIdx, togglePlay]);

  const prev = useCallback(() => {
    playingRef.current = true; setPlaying(true);
    setCurIdx(i => (i - 1 + TRACKS.length) % TRACKS.length);
  }, []);

  const next = useCallback(() => {
    playingRef.current = true; setPlaying(true);
    setCurIdx(i => (i + 1) % TRACKS.length);
  }, []);

  const seekPill = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div className={`music-player ${playing ? 'is-playing' : ''}`}>

        {/* Panel tracklist (au dessus de la pill) */}
        {expanded && (
          <div className="mp-panel">
            <div className="mp-viz">
              {bars.map((h, i) => <div key={i} className="mp-viz-bar" style={{ height: `${h}px` }} />)}
            </div>
            <div className="mp-tracklist">
              {TRACKS.map((t, i) => (
                <button key={t.id} className={`mp-track-item ${i === curIdx ? 'active' : ''}`}
                  onClick={() => goToTrack(i)}>
                  <span className="mp-track-num">0{t.id}</span>
                  <span className="mp-track-name-list">{t.name}</span>
                  <span className="mp-track-artist-list">{t.artist}</span>
                  {i === curIdx && playing && <span className="mp-playing-dot">▶</span>}
                </button>
              ))}
            </div>
            <div className="mp-vol-row">
              <span className="mp-vol-icon">♪</span>
              <input type="range" min="0" max="1" step="0.01" value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="mp-vol-slider" />
              <span className="mp-vol-val">{Math.round(volume * 100)}</span>
            </div>
          </div>
        )}

        {/* Pill principale */}
        <div className="mp-pill">
          <div className="mp-logo">TODOTAPE FM</div>
          <div className="mp-sep" />

          {/* Infos piste + progress — clic pour ouvrir panel */}
          <div className="mp-center" onClick={() => setExpanded(e => !e)}>
            <div className="mp-track-title">
              {playing ? track.name : 'Tap pour jouer'}
            </div>
            <div className="mp-track-sub">
              {playing ? track.artist : '♪ synthwave'}
            </div>
            <div className="mp-prog-line" onClick={seekPill}>
              <div className="mp-prog-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mp-dot" />

          {/* Contrôles */}
          <div className="mp-controls">
            <button className="mp-btn" onClick={prev} aria-label="Précédent">⏮</button>
            <button className="mp-btn mp-btn-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? '■' : '▶'}
            </button>
            <button className="mp-btn" onClick={next} aria-label="Suivant">⏭</button>
          </div>
        </div>

      </div>
    </>
  );
}
