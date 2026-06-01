// ── Modifie CE fichier pour changer tes pistes ──────────────────
// Je ne toucherai JAMAIS ce fichier dans mes mises à jour.

export interface Track {
  id: number;
  name: string;
  artist: string;
  file: string;
}

export const TRACKS: Track[] = [
  { id: 1, name: 'Got It Made', artist: 'Møme, Ricky Ducati', file: '/todotape/music/track-01.mp3' },
  { id: 2, name: 'Nightcall', artist: 'Kavinsky', file: '/todotape/music/track-02.mp3' },
  { id: 3, name: 'Midnight', artist: 'Neon Medusa', file: '/todotape/music/track-03.mp3' },
  { id: 4, name: 'After Dark', artist: 'Mr.Kitty', file: '/todotape/music/track-04.mp3' },
];
