import { Prototype } from '../types';
import { supabase } from './supabase';

// Fallback to localStorage if Supabase is not configured
const STORAGE_KEY = 'prototypes';
const USE_LOCAL_STORAGE = !supabase;

// Local storage fallback functions
const getPrototypesLocal = (): Prototype[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const savePrototypeLocal = (prototype: Prototype): void => {
  const prototypes = getPrototypesLocal();
  const index = prototypes.findIndex(p => p.id === prototype.id);

  if (index >= 0) {
    prototypes[index] = { ...prototype, updatedAt: new Date().toISOString() };
  } else {
    prototypes.push(prototype);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
};

const deletePrototypeLocal = (id: string): void => {
  const prototypes = getPrototypesLocal();
  const filtered = prototypes.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Supabase functions
export const getPrototypes = async (): Promise<Prototype[]> => {
  if (USE_LOCAL_STORAGE) {
    return getPrototypesLocal();
  }

  try {
    const { data, error } = await supabase
      .from('prototypes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prototypes:', error);
      return getPrototypesLocal(); // Fallback to localStorage
    }

    // Transform database records to Prototype format
    return (data || []).map((record: any) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      primaryColor: record.primary_color,
      logoUrl: record.logo_url,
      logoUploadMode: record.logo_upload_mode,
      steps: record.steps,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching prototypes:', error);
    return getPrototypesLocal(); // Fallback to localStorage
  }
};

export const savePrototype = async (prototype: Prototype): Promise<void> => {
  if (USE_LOCAL_STORAGE) {
    savePrototypeLocal(prototype);
    return;
  }

  try {
    const { error } = await supabase
      .from('prototypes')
      .upsert({
        id: prototype.id,
        name: prototype.name,
        description: prototype.description,
        primary_color: prototype.primaryColor,
        logo_url: prototype.logoUrl,
        logo_upload_mode: prototype.logoUploadMode,
        steps: prototype.steps,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Error saving prototype:', error);
      savePrototypeLocal(prototype); // Fallback to localStorage
    }
  } catch (error) {
    console.error('Error saving prototype:', error);
    savePrototypeLocal(prototype); // Fallback to localStorage
  }
};

export const getPrototype = async (id: string): Promise<Prototype | undefined> => {
  if (USE_LOCAL_STORAGE) {
    const prototypes = getPrototypesLocal();
    return prototypes.find(p => p.id === id);
  }

  try {
    const { data, error } = await supabase
      .from('prototypes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching prototype:', error);
      const prototypes = getPrototypesLocal();
      return prototypes.find(p => p.id === id);
    }

    if (!data) return undefined;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      primaryColor: data.primary_color,
      logoUrl: data.logo_url,
      logoUploadMode: data.logo_upload_mode,
      steps: data.steps,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching prototype:', error);
    const prototypes = getPrototypesLocal();
    return prototypes.find(p => p.id === id);
  }
};

export const deletePrototype = async (id: string): Promise<void> => {
  if (USE_LOCAL_STORAGE) {
    deletePrototypeLocal(id);
    return;
  }

  try {
    const { error } = await supabase
      .from('prototypes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prototype:', error);
      deletePrototypeLocal(id); // Fallback to localStorage
    }
  } catch (error) {
    console.error('Error deleting prototype:', error);
    deletePrototypeLocal(id); // Fallback to localStorage
  }
};
