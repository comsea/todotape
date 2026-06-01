import { useState, useEffect, useRef, useCallback } from 'react';

interface Track {
  id: number;
  name: string;
  artist: string;
  file: string;
}

const TRACKS: Track[] = [
  { id: 1, name: 'Got It Made', artist: 'Møme, Ricky Ducati', file: '/todotape/music/Mome-GotIt.mp3' },
  { id: 2, name: 'Nightcall', artist: 'Kavinsky', file: '/todotape/music/Kavinsky-Nightcall.mp3' },
  { id: 3, name: 'TRACK 03', artist: 'Artiste', file: '/todotape/music/track-03.mp3' },
  { id: 4, name: 'TRACK 04', artist: 'Artiste', file: '/todotape/music/track-04.mp3' },
];

export function MusicPlayer() {
  const [expanded, setExpanded]   = useState(false);
  const [playing, setPlaying]     = useState(false);
  const [curIdx, setCurIdx]       = useState(0);
  const [volume, setVolume]       = useState(0.6);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [elapsed, setElapsed]     = useState(0);
  const [bars, setBars]           = useState<number[]>(Array(20).fill(2));
  const audioRef  = useRef<HTMLAudioElement>(null);
  const animRef   = useRef<number>(0);

  const track = TRACKS[curIdx];

  // Mise à jour barre de progression
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const update = () => {
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      setElapsed(Math.floor(a.currentTime));
      setDuration(Math.floor(a.duration || 0));
    };
    a.addEventListener('timeupdate', update);
    a.addEventListener('loadedmetadata', update);
    a.addEventListener('ended', () => next());
    return () => {
      a.removeEventListener('timeupdate', update);
      a.removeEventListener('loadedmetadata', update);
    };
  }, [curIdx]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Chargement nouvelle piste
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = track.file;
    a.load();
    if (playing) a.play().catch(() => {});
  }, [curIdx]);

  // Visualiseur animé
  useEffect(() => {
    const animate = () => {
      if (playing) {
        setBars(prev => prev.map(() => Math.random() * 28 + 4));
      } else {
        setBars(Array(20).fill(2));
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }, [playing]);

  const prev = useCallback(() => {
    setCurIdx(i => (i - 1 + TRACKS.length) % TRACKS.length);
  }, []);

  const next = useCallback(() => {
    setCurIdx(i => (i + 1) % TRACKS.length);
  }, []);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * a.duration;
  };

  const fmt = (s: number) =>
    Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div className={`music-player ${expanded ? 'is-expanded' : ''} ${playing ? 'is-playing' : ''}`}>

        {/* ── Version réduite (toujours visible) ── */}
        <div className="mp-mini" onClick={() => setExpanded(e => !e)}>
          <div className="mp-mini-left">
            <div className={`mp-mini-dot ${playing ? 'playing' : ''}`} />
            <span className="mp-mini-name">{playing ? track.name : 'TODOTAPE FM'}</span>
          </div>
          <div className="mp-mini-right">
            <button
              className="mp-mini-play"
              onClick={e => { e.stopPropagation(); togglePlay(); }}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '■' : '▶'}
            </button>
            <span className="mp-mini-chevron">{expanded ? '▼' : '▲'}</span>
          </div>
        </div>

        {/* ── Version étendue ── */}
        {expanded && (
          <div className="mp-full">
            {/* Visualiseur */}
            <div className="mp-viz">
              {bars.map((h, i) => (
                <div key={i} className="mp-viz-bar" style={{ height: `${h}px` }} />
              ))}
            </div>

            {/* Info piste */}
            <div className="mp-track-info">
              <div className="mp-track-name">{track.name}</div>
              <div className="mp-track-artist">{track.artist}</div>
            </div>

            {/* Progress */}
            <div className="mp-progress" onClick={seek}>
              <div className="mp-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="mp-times">
              <span>{fmt(elapsed)}</span>
              <span>{duration > 0 ? fmt(duration) : '—'}</span>
            </div>

            {/* Contrôles */}
            <div className="mp-controls">
              <button className="mp-btn" onClick={prev}>⏮</button>
              <button className="mp-btn mp-btn-play" onClick={togglePlay}>
                {playing ? '■' : '▶'}
              </button>
              <button className="mp-btn" onClick={next}>⏭</button>
            </div>

            {/* Volume */}
            <div className="mp-volume">
              <span className="mp-vol-icon">♪</span>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="mp-vol-slider"
              />
              <span className="mp-vol-val">{Math.round(volume * 100)}</span>
            </div>

            {/* Tracklist */}
            <div className="mp-tracklist">
              {TRACKS.map((t, i) => (
                <button
                  key={t.id}
                  className={`mp-track-item ${i === curIdx ? 'active' : ''}`}
                  onClick={() => { setCurIdx(i); if (!playing) togglePlay(); }}
                >
                  <span className="mp-track-num">0{t.id}</span>
                  <span className="mp-track-title">{t.name}</span>
                  {i === curIdx && playing && <span className="mp-playing-dot">▶</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
