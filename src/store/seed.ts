import type { Task } from './types';

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const RAW_TASKS: Omit<Task, 'id' | 'done'>[] = [
  { name: 'Répondre aux mails',     day: 'lun', week: 'current', end: null,  endWeek: null, prio: 2 },
  { name: 'Cours de sport',         day: 'lun', week: 'current', end: null,  endWeek: null, prio: 1 },
  { name: 'Brief design client',    day: 'mar', week: 'current', end: 'ven', endWeek: 'current', prio: 3 },
  { name: 'Réserver le resto',      day: 'mar', week: 'current', end: null,  endWeek: null, prio: 1 },
  { name: 'Rendu maquette V1',      day: 'mer', week: 'current', end: null,  endWeek: null, prio: 3 },
  { name: 'Appeler le dentiste',    day: 'mer', week: 'current', end: null,  endWeek: null, prio: 2 },
  { name: 'Faire les courses',      day: 'mer', week: 'current', end: null,  endWeek: null, prio: 1 },
  { name: 'Lessive',                day: 'mer', week: 'current', end: null,  endWeek: null, prio: 1 },
  { name: 'RDV banque',             day: 'jeu', week: 'current', end: null,  endWeek: null, prio: 2 },
  { name: 'Lecture chapitre 3',     day: 'jeu', week: 'current', end: 'dim', endWeek: 'current', prio: 1 },
  { name: 'Préparer anniv Léo',     day: 'ven', week: 'current', end: null,  endWeek: null, prio: 3 },
  { name: 'Yoga 18h',               day: 'ven', week: 'current', end: null,  endWeek: null, prio: 1 },
  { name: 'Vide-grenier',           day: 'sam', week: 'current', end: null,  endWeek: null, prio: 1 },
  { name: 'Ménage à fond',          day: 'dim', week: 'current', end: null,  endWeek: null, prio: 2 },
  { name: 'Prep semaine prochaine', day: 'dim', week: 'current', end: null,  endWeek: null, prio: 1 },
  // Quelques tâches S+1 d'exemple
  { name: 'Réunion kick-off',       day: 'lun', week: 'next',    end: null,  endWeek: null, prio: 3 },
  { name: 'Commander fournitures',  day: 'mer', week: 'next',    end: null,  endWeek: null, prio: 1 },
  { name: 'Bilan mensuel',          day: 'ven', week: 'next',    end: null,  endWeek: null, prio: 2 },
];

const RAW_DONE: Omit<Task, 'id' | 'done'>[] = [
  { name: 'Aller à la poste',   day: 'lun', week: 'current', end: null, endWeek: null, prio: 1 },
  { name: 'Acheter cadeau Léo', day: 'mar', week: 'current', end: null, endWeek: null, prio: 2 },
  { name: 'Mail au comptable',  day: 'mar', week: 'current', end: null, endWeek: null, prio: 2 },
];

export function makeSeedState() {
  return {
    tasks: RAW_TASKS.map(t => ({ ...t, id: newId(), done: false as const })),
    done:  RAW_DONE.map(t  => ({ ...t, id: newId(), done: true  as const })),
  };
}
