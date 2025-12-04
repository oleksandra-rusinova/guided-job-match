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
    if (!supabase) {
      return getPrototypesLocal();
    }
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

export const savePrototype = async (prototype: Prototype): Promise<{ success: boolean; error?: string; data?: Prototype }> => {
  if (USE_LOCAL_STORAGE) {
    savePrototypeLocal(prototype);
    return { success: true, data: prototype };
  }

  try {
    if (!supabase) {
      savePrototypeLocal(prototype);
      return { success: true, data: prototype };
    }

    // Check if prototype exists to determine if it's an insert or update
    const { data: existing } = await supabase
      .from('prototypes')
      .select('id')
      .eq('id', prototype.id)
      .single();

    const isUpdate = !!existing;

    // Prepare the data object
    const prototypeData: any = {
      id: prototype.id,
      name: prototype.name,
      description: prototype.description,
      primary_color: prototype.primaryColor,
      logo_url: prototype.logoUrl || null,
      logo_upload_mode: prototype.logoUploadMode,
      steps: prototype.steps,
      updated_at: new Date().toISOString(),
    };

    // Include created_at only for new prototypes
    if (!isUpdate && prototype.createdAt) {
      prototypeData.created_at = prototype.createdAt;
    }

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('prototypes')
      .upsert(prototypeData, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving prototype to Supabase:', error);
      // Fallback to localStorage
      savePrototypeLocal(prototype);
      return { success: false, error: error.message, data: prototype };
    }

    console.log(`Prototype ${isUpdate ? 'updated' : 'created'} successfully:`, data?.id);
    
    // Transform and return the saved prototype for local state update
    const savedPrototype: Prototype = {
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
    
    return { success: true, data: savedPrototype };
  } catch (error: any) {
    console.error('Error saving prototype:', error);
    // Fallback to localStorage
    savePrototypeLocal(prototype);
    return { success: false, error: error?.message || 'Unknown error occurred', data: prototype };
  }
};

export const getPrototype = async (id: string): Promise<Prototype | undefined> => {
  if (USE_LOCAL_STORAGE) {
    const prototypes = getPrototypesLocal();
    return prototypes.find(p => p.id === id);
  }

  try {
    if (!supabase) {
      const prototypes = getPrototypesLocal();
      return prototypes.find(p => p.id === id);
    }
    
    // Use the anon key client which should work for public reads if RLS allows
    console.log('Fetching prototype from Supabase with ID:', id);
    const { data, error } = await supabase
      .from('prototypes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching prototype:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        id: id
      });
      
      // For public access, if RLS blocks the query, we'll get an error
      // Don't fallback to localStorage for public users as it won't have the data
      // Return undefined to indicate the prototype wasn't found or access denied
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        // No rows found - prototype doesn't exist
        console.log('Prototype not found in database (no rows)');
        return undefined;
      }
      
      // Check for RLS/permission errors
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('RLS policy blocking access to prototype. Check your Supabase RLS policies to allow public SELECT.');
        return undefined;
      }
      
      // For other errors, still return undefined
      // The caller should handle this appropriately
      return undefined;
    }

    if (!data) {
      console.log('No data returned from Supabase query');
      return undefined;
    }

    console.log('Prototype loaded successfully:', data.id);
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
    console.error('Exception while fetching prototype:', error);
    // Don't fallback to localStorage for public users
    return undefined;
  }
};

export const updatePrototype = async (
  id: string,
  updates: Partial<Omit<Prototype, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string; data?: Prototype }> => {
  if (USE_LOCAL_STORAGE) {
    const prototypes = getPrototypesLocal();
    const index = prototypes.findIndex(p => p.id === id);
    if (index >= 0) {
      const updated = {
        ...prototypes[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      prototypes[index] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
      return { success: true, data: updated };
    }
    return { success: false, error: 'Prototype not found' };
  }

  try {
    if (!supabase) {
      const prototypes = getPrototypesLocal();
      const index = prototypes.findIndex(p => p.id === id);
      if (index >= 0) {
        const updated = {
          ...prototypes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        prototypes[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
        return { success: true, data: updated };
      }
      return { success: false, error: 'Prototype not found' };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map Prototype fields to database columns
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.primaryColor !== undefined) updateData.primary_color = updates.primaryColor;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    if (updates.logoUploadMode !== undefined) updateData.logo_upload_mode = updates.logoUploadMode;
    if (updates.steps !== undefined) updateData.steps = updates.steps;

    const { data, error } = await supabase
      .from('prototypes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prototype:', error);
      // Fallback to localStorage
      const prototypes = getPrototypesLocal();
      const index = prototypes.findIndex(p => p.id === id);
      if (index >= 0) {
        const updated = {
          ...prototypes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        prototypes[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
        return { success: false, error: error.message, data: updated };
      }
      return { success: false, error: error.message };
    }

    console.log('Prototype updated successfully:', data?.id);
    
    // Transform and return the updated prototype for local state update
    const updatedPrototype: Prototype = {
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
    
    return { success: true, data: updatedPrototype };
  } catch (error: any) {
    console.error('Error updating prototype:', error);
    return { success: false, error: error?.message || 'Unknown error occurred' };
  }
};

export const deletePrototype = async (id: string): Promise<void> => {
  if (USE_LOCAL_STORAGE) {
    deletePrototypeLocal(id);
    return;
  }

  try {
    if (!supabase) {
      deletePrototypeLocal(id);
      return;
    }
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
