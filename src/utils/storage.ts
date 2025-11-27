import { Prototype } from '../types';

const STORAGE_KEY = 'prototypes';

export const getPrototypes = (): Prototype[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePrototype = (prototype: Prototype): void => {
  const prototypes = getPrototypes();
  const index = prototypes.findIndex(p => p.id === prototype.id);

  if (index >= 0) {
    prototypes[index] = { ...prototype, updatedAt: new Date().toISOString() };
  } else {
    prototypes.push(prototype);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
};

export const getPrototype = (id: string): Prototype | undefined => {
  const prototypes = getPrototypes();
  return prototypes.find(p => p.id === id);
};

export const deletePrototype = (id: string): void => {
  const prototypes = getPrototypes();
  const filtered = prototypes.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
