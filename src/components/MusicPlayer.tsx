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

type RepeatMode = 'none' | 'one' | 'all';

export function MusicPlayer() {
  const [expanded, setExpanded]     = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [curIdx, setCurIdx]         = useState(0);
  const [volume, setVolume]         = useState(0.6);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [elapsed, setElapsed]       = useState(0);
  const [bars, setBars]             = useState<number[]>(Array(16).fill(2));
  const [repeat, setRepeat]         = useState<RepeatMode>('none');

  const audioRef   = useRef<HTMLAudioElement>(null);
  const animRef    = useRef<number>(0);
  const playingRef = useRef(false);
  const repeatRef  = useRef<RepeatMode>('none');

  const track = TRACKS[curIdx];

  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  // Chargement piste
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

  // Événements audio
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
      if (r === 'one') {
        // Répéter la même piste
        a.currentTime = 0;
        a.play().catch(() => {});
      } else if (r === 'all') {
        // Passer à la suivante, boucle sur la playlist
        setCurIdx(i => (i + 1) % TRACKS.length);
      } else {
        // Passer à la suivante, s'arrêter en fin de playlist
        setCurIdx(i => {
          if (i + 1 < TRACKS.length) return i + 1;
          setPlaying(false);
          playingRef.current = false;
          return i;
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

  // Visualiseur
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

  const cycleRepeat = () => {
    setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none');
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const fmt = (s: number) =>
    Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);

  const repeatLabel = repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '↩';
  const repeatTitle = repeat === 'none' ? 'Répéter : désactivé' : repeat === 'all' ? 'Répéter : playlist' : 'Répéter : piste';

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div className={`music-player ${playing ? 'is-playing' : ''}`}>

        {/* Sheet (remonte depuis la bannière) */}
        {expanded && (
          <div className="mp-sheet" onClick={e => e.stopPropagation()}>
            {/* Poignée */}
            <div className="mp-sheet-handle" onClick={() => setExpanded(false)}>
              <div className="mp-sheet-bar" />
            </div>

            {/* Piste en cours */}
            <div className="mp-sheet-now">
              <div className="mp-sheet-track">{track.name}</div>
              <div className="mp-sheet-artist">{track.artist}</div>
            </div>

            {/* Barre de progression */}
            <div className="mp-sheet-prog" onClick={seek}>
              <div className="mp-sheet-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="mp-sheet-times">
              <span>{fmt(elapsed)}</span>
              <span>{duration > 0 ? fmt(duration) : '—'}</span>
            </div>

            {/* Contrôles + répétition */}
            <div className="mp-sheet-ctrls">
              <button
                className={`mp-sheet-btn mp-repeat-btn ${repeat !== 'none' ? 'active' : ''}`}
                onClick={cycleRepeat}
                title={repeatTitle}
              >
                {repeatLabel}
              </button>
              <button className="mp-sheet-btn" onClick={prev}>⏮</button>
              <button className="mp-sheet-btn mp-sheet-play" onClick={togglePlay}>
                {playing ? '■' : '▶'}
              </button>
              <button className="mp-sheet-btn" onClick={next}>⏭</button>
              <button className="mp-sheet-btn mp-vol-btn" title="Volume">
                ♪
              </button>
            </div>

            {/* Volume */}
            <div className="mp-sheet-vol">
              <span className="mp-vol-icon">—</span>
              <input type="range" min="0" max="1" step="0.01" value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="mp-vol-slider" />
              <span className="mp-vol-icon">♪</span>
            </div>

            {/* Liste des pistes */}
            <div className="mp-sheet-next-title">
              {repeat === 'one' ? '🔂 RÉPÉTER CETTE PISTE' : repeat === 'all' ? '🔁 RÉPÉTER LA PLAYLIST' : 'À SUIVRE'}
            </div>
            <div className="mp-sheet-list">
              {TRACKS.map((t, i) => (
                <button key={t.id} className={`mp-sheet-item ${i === curIdx ? 'active' : ''}`}
                  onClick={() => goToTrack(i)}>
                  <span className="msi-num">0{t.id}</span>
                  <div className="msi-info">
                    <div className="msi-name">{t.name}</div>
                    <div className="msi-artist">{t.artist}</div>
                  </div>
                  {i === curIdx && playing && <span className="msi-play">▶</span>}
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Overlay pour fermer */}
        {expanded && (
          <div className="mp-overlay" onClick={() => setExpanded(false)} />
        )}

        {/* Pill principale */}
        <div className="mp-pill">
          <div className="mp-logo">TODOTAPE FM</div>
          <div className="mp-sep" />
          <div className="mp-center" onClick={() => setExpanded(e => !e)}>
            <div className="mp-track-title">{playing ? track.name : 'Tap pour jouer'}</div>
            <div className="mp-track-sub">{playing ? track.artist : '♪ synthwave'}</div>
            <div className="mp-prog-line">
              <div className="mp-prog-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mp-dot" />
          <div className="mp-controls">
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
