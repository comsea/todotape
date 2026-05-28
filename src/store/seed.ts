import type { Task } from './types';

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const RAW_TASKS: Omit<Task, 'id' | 'done'>[] = [
  { name: 'Répondre aux mails',     day: 'lun', end: null,  prio: 2 },
  { name: 'Cours de sport',         day: 'lun', end: null,  prio: 1 },
  { name: 'Brief design client',    day: 'mar', end: 'ven', prio: 3 },
  { name: 'Réserver le resto',      day: 'mar', end: null,  prio: 1 },
  { name: 'Rendu maquette V1',      day: 'mer', end: null,  prio: 3 },
  { name: 'Appeler le dentiste',    day: 'mer', end: null,  prio: 2 },
  { name: 'Faire les courses',      day: 'mer', end: null,  prio: 1 },
  { name: 'Lessive',                day: 'mer', end: null,  prio: 1 },
  { name: 'RDV banque',             day: 'jeu', end: null,  prio: 2 },
  { name: 'Lecture chapitre 3',     day: 'jeu', end: 'dim', prio: 1 },
  { name: 'Préparer anniv Léo',     day: 'ven', end: null,  prio: 3 },
  { name: 'Yoga 18h',               day: 'ven', end: null,  prio: 1 },
  { name: 'Vide-grenier',           day: 'sam', end: null,  prio: 1 },
  { name: 'Ménage à fond',          day: 'dim', end: null,  prio: 2 },
  { name: 'Prep semaine prochaine', day: 'dim', end: null,  prio: 1 },
];

const RAW_DONE: Omit<Task, 'id' | 'done'>[] = [
  { name: 'Aller à la poste',   day: 'lun', end: null, prio: 1 },
  { name: 'Acheter cadeau Léo', day: 'mar', end: null, prio: 2 },
  { name: 'Mail au comptable',  day: 'mar', end: null, prio: 2 },
];

export function makeSeedState() {
  return {
    tasks: RAW_TASKS.map(t => ({ ...t, id: newId(), done: false as const })),
    done:  RAW_DONE.map(t  => ({ ...t, id: newId(), done: true  as const })),
  };
}
