import type { Task } from './types';

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function makeSeedState() {
  return {
    tasks: [] as Task[],
    done:  [] as Task[],
  };
}
