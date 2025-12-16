import { Prototype, Step, Element } from '../types';
import { supabase } from './supabase';
import { 
  getAllFromStore, 
  saveToStore, 
  deleteFromStore, 
  saveAllToStore,
  isIndexedDBAvailable 
} from './indexedDB';

// Use IndexedDB if available (much larger storage capacity), otherwise fallback to localStorage
const USE_INDEXED_DB = isIndexedDBAvailable();
const STORAGE_KEY = 'prototypes';
const PROTOTYPES_STORE = 'prototypes';
const USE_LOCAL_STORAGE = !supabase && !USE_INDEXED_DB;

// Helper function to check if a string is a base64 data URL
const isBase64DataUrl = (str: string | undefined): boolean => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/') || str.startsWith('data:');
};

// Helper function to compress base64 images to reduce storage size
// Added timeout to prevent hanging on large images
const compressImage = async (dataUrl: string, maxWidth: number = 1200, quality: number = 0.7, timeoutMs: number = 10000): Promise<string> => {
  // Check if image is already small enough (less than 500KB base64)
  // Base64 is ~33% larger than binary, so 500KB base64 ≈ 375KB binary
  const base64Size = dataUrl.length;
  const estimatedBinarySize = (base64Size * 3) / 4;
  if (estimatedBinarySize < 500 * 1024) {
    console.log(`[compressImage] Image is already small (${Math.round(estimatedBinarySize / 1024)}KB), skipping compression`);
    return dataUrl;
  }
  
  return new Promise((resolve) => {
    let resolved = false;
    
    // Timeout handler - if compression takes too long, use original image
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[compressImage] Image compression timed out, using original image');
        resolve(dataUrl);
      }
    }, timeoutMs);
    
    try {
      const img = new Image();
      img.onload = () => {
        if (resolved) return; // Already resolved by timeout
        
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions if image is too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Prevent canvas from being too large (browser limits)
          const MAX_CANVAS_SIZE = 16384; // Most browsers limit to 16k pixels
          if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
            const scale = Math.min(MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height);
            width = width * scale;
            height = height * scale;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG for better compression (unless it's PNG with transparency)
            const outputFormat = dataUrl.includes('image/png') && canvas.toDataURL('image/png').includes('data:image/png') 
              ? 'image/png' 
              : 'image/jpeg';
            const compressed = canvas.toDataURL(outputFormat, quality);
            clearTimeout(timeoutId);
            if (!resolved) {
              resolved = true;
              resolve(compressed);
            }
          } else {
            clearTimeout(timeoutId);
            if (!resolved) {
              resolved = true;
              console.warn('Canvas context unavailable, using original image');
              resolve(dataUrl); // Fallback if canvas context unavailable
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          if (!resolved) {
            resolved = true;
            console.warn('Error compressing image:', error);
            resolve(dataUrl); // Fallback on compression error
          }
        }
      };
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        if (!resolved) {
          resolved = true;
          console.warn('Error loading image for compression:', error);
          resolve(dataUrl); // Fallback on error - always resolve, never reject
        }
      };
      img.src = dataUrl;
    } catch (error) {
      clearTimeout(timeoutId);
      if (!resolved) {
        resolved = true;
        console.warn('Error in compressImage:', error);
        resolve(dataUrl); // Always resolve, never reject to prevent save failures
      }
    }
  });
};

// Helper function to compress images in element configs recursively
const compressConfigImages = async (config: any): Promise<any> => {
  if (!config) return config;
  
  try {
    const processValue = async (value: any, depth: number = 0): Promise<any> => {
      // Prevent infinite recursion
      if (depth > 10) {
        console.warn('Max recursion depth reached in compressConfigImages');
        return value;
      }
      
      if (value === null || value === undefined) {
        return value;
      }
      
      // Compress base64 images
      if (typeof value === 'string' && isBase64DataUrl(value)) {
        try {
          console.log(`[compressConfigImages] Compressing image at depth ${depth}...`);
          const compressed = await compressImage(value);
          console.log(`[compressConfigImages] Image compressed at depth ${depth}`);
          return compressed;
        } catch (error) {
          console.warn(`[compressConfigImages] Failed to compress image at depth ${depth}, using original:`, error);
          return value;
        }
      }
      
      if (Array.isArray(value)) {
        // Use Promise.allSettled to prevent one failure from stopping all processing
        const results = await Promise.allSettled(
          value.map((item, index) => {
            try {
              return processValue(item, depth + 1);
            } catch (error) {
              console.warn(`[compressConfigImages] Error processing array item ${index} at depth ${depth}:`, error);
              return Promise.resolve(item); // Return original item on error
            }
          })
        );
        // Extract successful results, fallback to original on failure
        return results.map((result, index) => 
          result.status === 'fulfilled' ? result.value : value[index]
        );
      }
      
      if (typeof value === 'object') {
        const processed: any = {};
        const keys = Object.keys(value);
        console.log(`[compressConfigImages] Processing object with ${keys.length} keys at depth ${depth}`);
        
        // Process all keys in parallel but handle errors individually
        const results = await Promise.allSettled(
          keys.map(async (key) => {
            try {
              const processedValue = await processValue(value[key], depth + 1);
              return { key, value: processedValue };
            } catch (error) {
              console.warn(`[compressConfigImages] Error processing key "${key}" at depth ${depth}:`, error);
              return { key, value: value[key] }; // Return original value on error
            }
          })
        );
        
        // Build processed object from results
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            processed[result.value.key] = result.value.value;
          } else {
            processed[keys[index]] = value[keys[index]]; // Fallback to original
          }
        });
        
        return processed;
      }
      
      return value;
    };
    
    console.log('[compressConfigImages] Starting config compression...');
    const result = await processValue(config);
    console.log('[compressConfigImages] Config compression completed');
    return result;
  } catch (error) {
    console.error('[compressConfigImages] Error processing config, using original:', error);
    return config;
  }
};

// Compress images in a prototype before saving
const compressPrototypeImages = async (prototype: Prototype): Promise<Prototype> => {
  const startTime = Date.now();
  console.log('[compressPrototypeImages] Starting image compression...');
  
  try {
    // Compress logo if it's base64
    let compressedLogoUrl = prototype.logoUrl;
    if (prototype.logoUrl && isBase64DataUrl(prototype.logoUrl)) {
      try {
        console.log('[compressPrototypeImages] Compressing logo...');
        compressedLogoUrl = await compressImage(prototype.logoUrl);
        console.log('[compressPrototypeImages] Logo compressed');
      } catch (error) {
        console.warn('[compressPrototypeImages] Failed to compress logo:', error);
      }
    }
    
    // Compress step images and element config images
    console.log(`[compressPrototypeImages] Compressing ${prototype.steps.length} steps...`);
    const compressedSteps = await Promise.allSettled(
      prototype.steps.map(async (step: Step, stepIndex: number) => {
        try {
          // Compress step image
          let compressedStepImageUrl = step.imageUrl;
          if (step.imageUrl && isBase64DataUrl(step.imageUrl)) {
            try {
              console.log(`[compressPrototypeImages] Compressing step ${stepIndex} image...`);
              compressedStepImageUrl = await compressImage(step.imageUrl);
              console.log(`[compressPrototypeImages] Step ${stepIndex} image compressed`);
            } catch (error) {
              console.warn(`[compressPrototypeImages] Failed to compress step ${stepIndex} image:`, error);
            }
          }
          
          // Compress element config images
          console.log(`[compressPrototypeImages] Compressing ${step.elements.length} elements in step ${stepIndex}...`);
          const compressedElements = await Promise.allSettled(
            step.elements.map(async (element: Element, elementIndex: number) => {
              try {
                if (element.config) {
                  const compressedConfig = await compressConfigImages(element.config);
                  return { ...element, config: compressedConfig };
                }
                return element;
              } catch (error) {
                console.warn(`[compressPrototypeImages] Failed to compress element ${elementIndex} in step ${stepIndex}:`, error);
                return element; // Return original element on error
              }
            })
          );
          
          // Extract successful compressions
          const successfulElements = compressedElements.map(result => 
            result.status === 'fulfilled' ? result.value : step.elements[compressedElements.indexOf(result)]
          );
          
          return {
            ...step,
            imageUrl: compressedStepImageUrl,
            elements: successfulElements,
          };
        } catch (error) {
          console.warn(`[compressPrototypeImages] Error processing step ${stepIndex}:`, error);
          return step; // Return original step on error
        }
      })
    );
    
    // Extract successful compressions
    const successfulSteps = compressedSteps.map((result, index) => 
      result.status === 'fulfilled' ? result.value : prototype.steps[index]
    );
    
    const endTime = Date.now();
    console.log(`[compressPrototypeImages] Compression completed in ${endTime - startTime}ms`);
    
    return {
      ...prototype,
      logoUrl: compressedLogoUrl,
      steps: successfulSteps,
    };
  } catch (error) {
    console.error('[compressPrototypeImages] Error compressing prototype images, using original:', error);
    return prototype;
  }
};

// Migrate existing localStorage data to IndexedDB on first use
const migrateToIndexedDB = async (): Promise<void> => {
  if (!USE_INDEXED_DB) return;
  
  try {
    // Check if migration is needed
    const hasLocalStorageData = localStorage.getItem(STORAGE_KEY);
    if (!hasLocalStorageData) return;
    
    // Check if IndexedDB already has data
    const indexedDBPrototypes = await getAllFromStore<Prototype>(PROTOTYPES_STORE);
    if (indexedDBPrototypes.length > 0) {
      // Already migrated
      return;
    }
    
    console.log('Migrating prototypes from localStorage to IndexedDB...');
    const localStorageData = localStorage.getItem(STORAGE_KEY);
    if (localStorageData) {
      const prototypes = JSON.parse(localStorageData);
      if (prototypes.length > 0) {
        await saveAllToStore(PROTOTYPES_STORE, prototypes);
        console.log(`Migrated ${prototypes.length} prototypes to IndexedDB`);
        // Optionally clear localStorage after migration (commented out for safety)
        // localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('Error migrating prototypes to IndexedDB:', error);
  }
};

// Local storage fallback functions
const getPrototypesLocal = (): Prototype[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// IndexedDB functions
const getPrototypesIndexedDB = async (): Promise<Prototype[]> => {
  try {
    if (!USE_INDEXED_DB) return [];
    await migrateToIndexedDB(); // Migrate on first access
    return await getAllFromStore<Prototype>(PROTOTYPES_STORE);
  } catch (error) {
    console.error('Error reading prototypes from IndexedDB:', error);
    return [];
  }
};

const savePrototypeIndexedDB = async (prototype: Prototype): Promise<void> => {
  try {
    console.log('[savePrototypeIndexedDB] Starting save process...');
    // Compress images before saving to reduce storage size
    console.log('[savePrototypeIndexedDB] Compressing images...');
    const compressedPrototype = await compressPrototypeImages(prototype);
    console.log('[savePrototypeIndexedDB] Images compressed, saving to IndexedDB...');
    const toSave = { ...compressedPrototype, updatedAt: new Date().toISOString() };
    
    await saveToStore(PROTOTYPES_STORE, toSave);
    console.log('[savePrototypeIndexedDB] Successfully saved to IndexedDB');
  } catch (error: any) {
    console.error('[savePrototypeIndexedDB] Error saving prototype to IndexedDB:', error);
    throw error;
  }
};

const savePrototypeLocal = async (prototype: Prototype): Promise<void> => {
  try {
    console.log('[savePrototypeLocal] Starting save process...');
    // Compress images before saving to reduce storage size
    console.log('[savePrototypeLocal] Compressing images...');
    const compressedPrototype = await compressPrototypeImages(prototype);
    console.log('[savePrototypeLocal] Images compressed, saving to localStorage...');
    
    const prototypes = getPrototypesLocal();
    const index = prototypes.findIndex(p => p.id === compressedPrototype.id);

    if (index >= 0) {
      prototypes[index] = { ...compressedPrototype, updatedAt: new Date().toISOString() };
    } else {
      prototypes.push(compressedPrototype);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        // Try to clean up old prototypes and retry
        console.warn('Storage quota exceeded, attempting cleanup...');
        const sorted = prototypes.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        // Keep only the 10 most recent prototypes
        const toKeep = sorted.slice(0, 10);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toKeep));
          // If cleanup worked, try saving again
          const newPrototypes = getPrototypesLocal();
          const newIndex = newPrototypes.findIndex(p => p.id === compressedPrototype.id);
          if (newIndex >= 0) {
            newPrototypes[newIndex] = { ...compressedPrototype, updatedAt: new Date().toISOString() };
          } else {
            newPrototypes.push(compressedPrototype);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrototypes));
          console.log('Successfully saved after cleanup');
        } catch (retryError) {
          throw new Error('Storage quota exceeded. Please delete some prototypes or clear browser storage to free up space.');
        }
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Error saving prototype to localStorage:', error);
    throw error;
  }
};

const deletePrototypeIndexedDB = async (id: string): Promise<void> => {
  try {
    await deleteFromStore(PROTOTYPES_STORE, id);
  } catch (error) {
    console.error('Error deleting prototype from IndexedDB:', error);
    throw error;
  }
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
  
  if (USE_INDEXED_DB && !supabase) {
    return await getPrototypesIndexedDB();
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
      // Fallback to IndexedDB or localStorage
      if (USE_INDEXED_DB) {
        return await getPrototypesIndexedDB();
      }
      return getPrototypesLocal();
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
    // Fallback to IndexedDB or localStorage
    if (USE_INDEXED_DB) {
      return await getPrototypesIndexedDB();
    }
    return getPrototypesLocal();
  }
};

export const savePrototype = async (prototype: Prototype): Promise<{ success: boolean; error?: string; data?: Prototype }> => {
  if (USE_LOCAL_STORAGE) {
    try {
      await savePrototypeLocal(prototype);
      return { success: true, data: prototype };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to save prototype', data: prototype };
    }
  }
  
  if (USE_INDEXED_DB && !supabase) {
    try {
      await savePrototypeIndexedDB(prototype);
      return { success: true, data: prototype };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to save prototype', data: prototype };
    }
  }

  try {
    if (!supabase) {
      // Use IndexedDB if available, otherwise localStorage
      if (USE_INDEXED_DB) {
        try {
          await savePrototypeIndexedDB(prototype);
          return { success: true, data: prototype };
        } catch (error: any) {
          return { success: false, error: error.message || 'Failed to save prototype', data: prototype };
        }
      } else {
        try {
          await savePrototypeLocal(prototype);
          return { success: true, data: prototype };
        } catch (error: any) {
          return { success: false, error: error.message || 'Failed to save prototype', data: prototype };
        }
      }
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
      // Fallback to IndexedDB or localStorage
      try {
        if (USE_INDEXED_DB) {
          await savePrototypeIndexedDB(prototype);
        } else {
          await savePrototypeLocal(prototype);
        }
        return { success: false, error: error.message, data: prototype };
      } catch (localError: any) {
        return { success: false, error: `Supabase error: ${error.message}. Local storage error: ${localError.message}`, data: prototype };
      }
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
    // Fallback to IndexedDB or localStorage
    try {
      if (USE_INDEXED_DB) {
        await savePrototypeIndexedDB(prototype);
      } else {
        await savePrototypeLocal(prototype);
      }
      return { success: false, error: error?.message || 'Unknown error occurred', data: prototype };
    } catch (localError: any) {
      return { success: false, error: `Error: ${error?.message || 'Unknown error'}. Local storage error: ${localError.message}`, data: prototype };
    }
  }
};

export const getPrototype = async (id: string): Promise<Prototype | undefined> => {
  if (USE_LOCAL_STORAGE) {
    const prototypes = getPrototypesLocal();
    return prototypes.find(p => p.id === id);
  }
  
  if (USE_INDEXED_DB && !supabase) {
    const prototypes = await getPrototypesIndexedDB();
    return prototypes.find(p => p.id === id);
  }

  try {
    if (!supabase) {
      if (USE_INDEXED_DB) {
        const prototypes = await getPrototypesIndexedDB();
        return prototypes.find(p => p.id === id);
      } else {
        const prototypes = getPrototypesLocal();
        return prototypes.find(p => p.id === id);
      }
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
    try {
      const prototypes = getPrototypesLocal();
      const index = prototypes.findIndex(p => p.id === id);
      if (index >= 0) {
        const updated = {
          ...prototypes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // Compress images before saving
        const compressedUpdated = await compressPrototypeImages(updated);
        prototypes[index] = compressedUpdated;
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
          return { success: true, data: compressedUpdated };
        } catch (error: any) {
          if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
            // Try to clean up old prototypes and retry
            console.warn('Storage quota exceeded during update, attempting cleanup...');
            const sorted = prototypes.sort((a, b) => 
              new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
            );
            // Keep only the 10 most recent prototypes
            const toKeep = sorted.slice(0, 10);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(toKeep));
              // If cleanup worked, try updating again
              const newPrototypes = getPrototypesLocal();
              const newIndex = newPrototypes.findIndex(p => p.id === id);
              if (newIndex >= 0) {
                const newUpdated = {
                  ...newPrototypes[newIndex],
                  ...updates,
                  updatedAt: new Date().toISOString(),
                };
                const compressedNewUpdated = await compressPrototypeImages(newUpdated);
                newPrototypes[newIndex] = compressedNewUpdated;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrototypes));
                console.log('Successfully updated after cleanup');
                return { success: true, data: compressedNewUpdated };
              }
              throw new Error('Prototype not found after cleanup');
            } catch (retryError: any) {
              return { success: false, error: 'Storage quota exceeded. Please delete some prototypes or clear browser storage to free up space.' };
            }
          } else {
            throw error;
          }
        }
      }
      return { success: false, error: 'Prototype not found' };
    } catch (error: any) {
      console.error('Error updating prototype in localStorage:', error);
      return { success: false, error: error.message || 'Failed to update prototype' };
    }
  }
  
  try {
    if (!supabase) {
      if (USE_INDEXED_DB) {
        const prototypes = await getPrototypesIndexedDB();
        const prototype = prototypes.find(p => p.id === id);
        if (!prototype) {
          return { success: false, error: 'Prototype not found' };
        }
        
        const updated = {
          ...prototype,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // Compress images before saving
        const compressedUpdated = await compressPrototypeImages(updated);
        await savePrototypeIndexedDB(compressedUpdated);
        
        return { success: true, data: compressedUpdated };
      } else {
        const prototypes = getPrototypesLocal();
        const index = prototypes.findIndex(p => p.id === id);
        if (index >= 0) {
          const updated = {
            ...prototypes[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          // Compress images before saving
          const compressedUpdated = await compressPrototypeImages(updated);
          prototypes[index] = compressedUpdated;
          
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
            return { success: true, data: compressedUpdated };
          } catch (error: any) {
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              return { success: false, error: 'Storage quota exceeded. Please delete some prototypes or clear browser storage to free up space.' };
            }
            throw error;
          }
        }
        return { success: false, error: 'Prototype not found' };
      }
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
      // Fallback to IndexedDB or localStorage
      try {
        if (USE_INDEXED_DB) {
          const prototypes = await getPrototypesIndexedDB();
          const prototype = prototypes.find(p => p.id === id);
          if (prototype) {
            const updated = {
              ...prototype,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            const compressedUpdated = await compressPrototypeImages(updated);
            await savePrototypeIndexedDB(compressedUpdated);
            return { success: false, error: error.message, data: compressedUpdated };
          }
        } else {
          const prototypes = getPrototypesLocal();
          const index = prototypes.findIndex(p => p.id === id);
          if (index >= 0) {
            const updated = {
              ...prototypes[index],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            
            // Compress images before saving
            const compressedUpdated = await compressPrototypeImages(updated);
            prototypes[index] = compressedUpdated;
            
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
              return { success: false, error: error.message, data: compressedUpdated };
            } catch (localError: any) {
              if (localError.name === 'QuotaExceededError' || localError.message?.includes('quota')) {
                return { success: false, error: `Supabase error: ${error.message}. LocalStorage quota exceeded. Please delete some prototypes.` };
              }
              throw localError;
            }
          }
        }
        return { success: false, error: error.message };
      } catch (localError: any) {
        return { success: false, error: `Supabase error: ${error.message}. Local storage error: ${localError.message}` };
      }
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
  
  if (USE_INDEXED_DB && !supabase) {
    try {
      await deletePrototypeIndexedDB(id);
      return;
    } catch (error) {
      console.error('Error deleting prototype from IndexedDB:', error);
      throw error;
    }
  }

  try {
    if (!supabase) {
      if (USE_INDEXED_DB) {
        await deletePrototypeIndexedDB(id);
      } else {
        deletePrototypeLocal(id);
      }
      return;
    }
    const { error } = await supabase
      .from('prototypes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prototype:', error);
      // Fallback to IndexedDB or localStorage
      if (USE_INDEXED_DB) {
        try {
          await deletePrototypeIndexedDB(id);
        } catch (localError) {
          console.error('Error deleting from IndexedDB fallback:', localError);
        }
      } else {
        deletePrototypeLocal(id);
      }
    }
  } catch (error) {
    console.error('Error deleting prototype:', error);
    // Fallback to IndexedDB or localStorage
    if (USE_INDEXED_DB) {
      try {
        await deletePrototypeIndexedDB(id);
      } catch (localError) {
        console.error('Error deleting from IndexedDB fallback:', localError);
      }
    } else {
      deletePrototypeLocal(id);
    }
  }
};
