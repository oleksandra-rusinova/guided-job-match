import { QuestionTemplate, PrototypeTemplate, ApplicationStepTemplate, Step, Prototype } from '../types';
import { 
  getAllFromStore, 
  saveAllToStore, 
  deleteFromStore, 
  isIndexedDBAvailable,
  getIndexedDBStorageUsage 
} from './indexedDB';
import { supabase } from './supabase';

const QUESTION_TEMPLATES_KEY = 'questionTemplates';
const PROTOTYPE_TEMPLATES_KEY = 'prototypeTemplates';
const APPLICATION_STEP_TEMPLATES_KEY = 'applicationStepTemplates';

// Use IndexedDB if available, otherwise fallback to localStorage
const USE_INDEXED_DB = isIndexedDBAvailable();

// Check if Supabase is available for cloud storage
const USE_SUPABASE = !!supabase;

// Migrate existing localStorage data to IndexedDB on first use
const migrateToIndexedDB = async () => {
  if (!USE_INDEXED_DB) return;
  
  try {
    // Check if migration is needed
    const hasLocalStorageData = 
      localStorage.getItem(QUESTION_TEMPLATES_KEY) ||
      localStorage.getItem(PROTOTYPE_TEMPLATES_KEY) ||
      localStorage.getItem(APPLICATION_STEP_TEMPLATES_KEY);
    
    if (!hasLocalStorageData) return;
    
    // Check if IndexedDB already has data
    const indexedDBQuestion = await getAllFromStore<QuestionTemplate>('questionTemplates');
    if (indexedDBQuestion.length > 0) {
      // Already migrated
      return;
    }
    
    console.log('Migrating templates from localStorage to IndexedDB...');
    
    // Migrate question templates
    const questionData = localStorage.getItem(QUESTION_TEMPLATES_KEY);
    if (questionData) {
      const templates = JSON.parse(questionData);
      if (templates.length > 0) {
        await saveAllToStore('questionTemplates', templates);
        console.log(`Migrated ${templates.length} question templates`);
      }
    }
    
    // Migrate prototype templates
    const prototypeData = localStorage.getItem(PROTOTYPE_TEMPLATES_KEY);
    if (prototypeData) {
      const templates = JSON.parse(prototypeData);
      if (templates.length > 0) {
        await saveAllToStore('prototypeTemplates', templates);
        console.log(`Migrated ${templates.length} prototype templates`);
      }
    }
    
    // Migrate application step templates
    const applicationData = localStorage.getItem(APPLICATION_STEP_TEMPLATES_KEY);
    if (applicationData) {
      const templates = JSON.parse(applicationData);
      if (templates.length > 0) {
        await saveAllToStore('applicationStepTemplates', templates);
        console.log(`Migrated ${templates.length} application step templates`);
      }
    }
    
    console.log('Migration complete! Templates are now stored in IndexedDB with much larger capacity.');
  } catch (error) {
    console.error('Error migrating to IndexedDB:', error);
    // Continue using localStorage if migration fails
  }
};

// Initialize migration on module load
if (USE_INDEXED_DB) {
  migrateToIndexedDB();
}

// Helper function to check if a string is a base64 data URL
const isBase64DataUrl = (str: string | undefined): boolean => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/') || str.startsWith('data:');
};

// Helper function to get storage usage
export const getStorageUsage = async (): Promise<{ used: number; available: number; percentage: number }> => {
  if (USE_INDEXED_DB) {
    try {
      const indexedDBUsage = await getIndexedDBStorageUsage();
      return {
        used: indexedDBUsage.used,
        available: indexedDBUsage.estimatedLimit - indexedDBUsage.used,
        percentage: indexedDBUsage.percentage,
      };
    } catch (error) {
      console.error('Error getting IndexedDB storage usage:', error);
    }
  }
  
  // Fallback to localStorage calculation
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  // Estimate available storage (most browsers have 5-10MB limit)
  const estimatedLimit = 5 * 1024 * 1024; // 5MB conservative estimate
  const available = Math.max(0, estimatedLimit - used);
  const percentage = (used / estimatedLimit) * 100;
  
  return { used, available, percentage };
};

// Helper function to get template storage sizes
export const getTemplateStorageInfo = async () => {
  const questionTemplates = await getQuestionTemplates();
  const prototypeTemplates = await getPrototypeTemplates();
  const applicationStepTemplates = await getApplicationStepTemplates();
  
  const questionSize = questionTemplates.length > 0 
    ? new Blob([JSON.stringify(questionTemplates)]).size 
    : 0;
  const prototypeSize = prototypeTemplates.length > 0
    ? new Blob([JSON.stringify(prototypeTemplates)]).size
    : 0;
  const applicationSize = applicationStepTemplates.length > 0
    ? new Blob([JSON.stringify(applicationStepTemplates)]).size
    : 0;
  
  return {
    questionTemplates: { count: questionTemplates.length, size: questionSize },
    prototypeTemplates: { count: prototypeTemplates.length, size: prototypeSize },
    applicationStepTemplates: { count: applicationStepTemplates.length, size: applicationSize },
    totalSize: questionSize + prototypeSize + applicationSize,
  };
};

// Helper function to clean up old templates if storage is getting full
const cleanupOldTemplates = async (targetType: 'question' | 'prototype' | 'applicationStep' = 'prototype') => {
  const storageUsage = await getStorageUsage();
  
  // Only cleanup if storage is over 80% full (and using localStorage)
  if (storageUsage.percentage < 80 || USE_INDEXED_DB) return;
  
  console.log(`Storage is ${storageUsage.percentage.toFixed(1)}% full, cleaning up old templates...`);
  
  if (targetType === 'prototype') {
    const templates = await getPrototypeTemplates();
    if (templates.length > 10) {
      // Keep only the 10 most recent templates
      const sorted = templates.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const toKeep = sorted.slice(0, 10);
      const toDelete = sorted.slice(10);
      
      console.log(`Removing ${toDelete.length} old prototype templates`);
      localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(toKeep));
    }
  } else if (targetType === 'question') {
    const templates = await getQuestionTemplates();
    if (templates.length > 20) {
      const sorted = templates.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const toKeep = sorted.slice(0, 20);
      localStorage.setItem(QUESTION_TEMPLATES_KEY, JSON.stringify(toKeep));
    }
  } else {
    const templates = await getApplicationStepTemplates();
    if (templates.length > 20) {
      const sorted = templates.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const toKeep = sorted.slice(0, 20);
      localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, JSON.stringify(toKeep));
    }
  }
};

// Helper function to compress base64 images to reduce storage size
// More aggressive compression for templates
const compressImage = async (dataUrl: string, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions if image is too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
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
            resolve(compressed);
          } else {
            console.warn('Canvas context unavailable, using original image');
            resolve(dataUrl); // Fallback if canvas context unavailable
          }
        } catch (error) {
          console.warn('Error compressing image:', error);
          resolve(dataUrl); // Fallback on compression error
        }
      };
      img.onerror = (error) => {
        console.warn('Error loading image for compression:', error);
        resolve(dataUrl); // Fallback on error - always resolve, never reject
      };
      img.src = dataUrl;
    } catch (error) {
      console.warn('Error in compressImage:', error);
      resolve(dataUrl); // Always resolve, never reject to prevent template save failures
    }
  });
};

// Helper function to safely deep copy element configs
// Handles card options and other nested structures
// Compresses base64 images to reduce storage size
const deepCopyConfig = async (config: any, compressImages: boolean = true): Promise<any> => {
  if (!config) return config;
  
  try {
    // Process images if needed
    const processValue = async (value: any): Promise<any> => {
      if (value === null || value === undefined) {
        return value;
      }
      
      // Compress base64 images
      if (compressImages && typeof value === 'string' && isBase64DataUrl(value)) {
        try {
          return await compressImage(value);
        } catch (error) {
          console.warn('Failed to compress image, using original:', error);
          return value;
        }
      }
      
      if (Array.isArray(value)) {
        const processed = await Promise.all(value.map(item => processValue(item)));
        return processed;
      }
      
      if (typeof value === 'object') {
        const processed: any = {};
        for (const key in value) {
          if (value.hasOwnProperty(key)) {
            processed[key] = await processValue(value[key]);
          }
        }
        return processed;
      }
      
      return value;
    };
    
    const processed = await processValue(config);
    
    // Serialize to ensure it's clean
    const serialized = JSON.stringify(processed, (key, value) => {
      if (value === undefined) return null;
      return value;
    });
    const parsed = JSON.parse(serialized);
    
    return parsed;
  } catch (error) {
    console.warn('Error processing config, using original:', error);
    return config;
  }
};

// Synchronous version for when we can't use async (fallback)
const deepCopyConfigSync = (config: any): any => {
  if (!config) return config;
  
  try {
    const serialized = JSON.stringify(config, (key, value) => {
      if (value === undefined) return null;
      return value;
    });
    return JSON.parse(serialized);
  } catch (error) {
    console.warn('JSON serialization failed, using original:', error);
    return config;
  }
};

// Question Templates
export const getQuestionTemplates = async (): Promise<QuestionTemplate[]> => {
  // Try Supabase first for cloud storage
  if (USE_SUPABASE) {
    try {
      const { data, error } = await supabase
        .from('question_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching question templates from Supabase:', error);
      } else if (data && data.length > 0) {
        // Transform database records to QuestionTemplate format
        return data.map((record: any) => ({
          id: record.id,
          name: record.name,
          step: record.step_data,
          createdAt: record.created_at,
        }));
      }
    } catch (error) {
      console.error('Exception fetching question templates from Supabase:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  if (USE_INDEXED_DB) {
    try {
      return await getAllFromStore<QuestionTemplate>('questionTemplates');
    } catch (error) {
      console.error('Error reading from IndexedDB, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(QUESTION_TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveQuestionTemplate = async (template: QuestionTemplate): Promise<void> => {
  try {
    // Try Supabase first for cloud storage
    if (USE_SUPABASE) {
      try {
        const templateData = {
          id: template.id,
          name: template.name,
          step_data: template.step,
          created_at: template.createdAt,
        };

        // Check if template exists
        const { data: existing } = await supabase
          .from('question_templates')
          .select('id')
          .eq('id', template.id)
          .single();

        if (existing) {
          // Update existing template
          const { error } = await supabase
            .from('question_templates')
            .update({
              name: template.name,
              step_data: template.step,
            })
            .eq('id', template.id);

          if (error) {
            console.error('Error updating question template in Supabase:', error);
            throw error;
          }
        } else {
          // Insert new template
          const { error } = await supabase
            .from('question_templates')
            .insert(templateData);

          if (error) {
            console.error('Error saving question template to Supabase:', error);
            throw error;
          }
        }
        return; // Successfully saved to Supabase
      } catch (error) {
        console.error('Exception saving question template to Supabase, falling back to local storage:', error);
      }
    }

    // Fallback to IndexedDB/localStorage
    if (USE_INDEXED_DB) {
      try {
        const templates = await getQuestionTemplates();
        const index = templates.findIndex(t => t.id === template.id);
        
        if (index >= 0) {
          templates[index] = template;
        } else {
          templates.push(template);
        }
        
        await saveAllToStore('questionTemplates', templates);
        return;
      } catch (error) {
        console.error('Error saving to IndexedDB, falling back to localStorage:', error);
      }
    }
    
    const templates = await getQuestionTemplates();
    const index = templates.findIndex(t => t.id === template.id);

    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }

    const serialized = JSON.stringify(templates);
    localStorage.setItem(QUESTION_TEMPLATES_KEY, serialized);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      throw new Error('Storage quota exceeded. Please remove some templates or clear localStorage.');
    }
    throw error;
  }
};

export const deleteQuestionTemplate = async (id: string): Promise<void> => {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const { error } = await supabase
        .from('question_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question template from Supabase:', error);
        throw error;
      }
      return; // Successfully deleted from Supabase
    } catch (error) {
      console.error('Exception deleting question template from Supabase, falling back to local storage:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  if (USE_INDEXED_DB) {
    try {
      await deleteFromStore('questionTemplates', id);
      return;
    } catch (error) {
      console.error('Error deleting from IndexedDB, falling back to localStorage:', error);
    }
  }
  const templates = await getQuestionTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(QUESTION_TEMPLATES_KEY, JSON.stringify(filtered));
};

export const updateQuestionTemplate = async (id: string, updates: Partial<QuestionTemplate>): Promise<void> => {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.step !== undefined) updateData.step_data = updates.step;

      const { error } = await supabase
        .from('question_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating question template in Supabase:', error);
        throw error;
      }
      return; // Successfully updated in Supabase
    } catch (error) {
      console.error('Exception updating question template in Supabase, falling back to local storage:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  const templates = await getQuestionTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates };
    if (USE_INDEXED_DB) {
      try {
        await saveAllToStore('questionTemplates', templates);
        return;
      } catch (error) {
        console.error('Error updating in IndexedDB, falling back to localStorage:', error);
      }
    }
    localStorage.setItem(QUESTION_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const getQuestionTemplate = async (id: string): Promise<QuestionTemplate | undefined> => {
  const templates = await getQuestionTemplates();
  return templates.find(t => t.id === id);
};

export const createQuestionTemplate = async (name: string, step: Step): Promise<QuestionTemplate> => {
  // Compress step image if it's base64
  let processedImageUrl = step.imageUrl;
  if (step.imageUrl && isBase64DataUrl(step.imageUrl)) {
    try {
      processedImageUrl = await compressImage(step.imageUrl);
    } catch (error) {
      console.warn('Failed to compress step image:', error);
    }
  }
  
  // Process elements with image compression
  const processedElements = await Promise.all(
    step.elements.map(async (el) => ({
      ...el,
      id: crypto.randomUUID(), // Create new IDs for elements
      config: await deepCopyConfig(el.config, true), // Compress images
    }))
  );
  
  return {
    id: crypto.randomUUID(),
    name,
    step: {
      ...step,
      id: crypto.randomUUID(), // Create new ID for the step
      imageUrl: processedImageUrl,
      elements: processedElements,
    },
    createdAt: new Date().toISOString(),
  };
};

// Prototype Templates
export const getPrototypeTemplates = async (): Promise<PrototypeTemplate[]> => {
  // Try Supabase first for cloud storage
  if (USE_SUPABASE) {
    try {
      const { data, error } = await supabase
        .from('prototype_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prototype templates from Supabase:', error);
      } else if (data && data.length > 0) {
        // Transform database records to PrototypeTemplate format
        return data.map((record: any) => ({
          id: record.id,
          name: record.name,
          prototype: record.prototype_data,
          createdAt: record.created_at,
        }));
      }
    } catch (error) {
      console.error('Exception fetching prototype templates from Supabase:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  if (USE_INDEXED_DB) {
    try {
      return await getAllFromStore<PrototypeTemplate>('prototypeTemplates');
    } catch (error) {
      console.error('Error reading from IndexedDB, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(PROTOTYPE_TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePrototypeTemplate = async (template: PrototypeTemplate): Promise<void> => {
  try {
    // Try Supabase first for cloud storage
    if (USE_SUPABASE) {
      try {
        const templateData = {
          id: template.id,
          name: template.name,
          prototype_data: template.prototype,
          created_at: template.createdAt,
        };

        // Check if template exists
        const { data: existing } = await supabase
          .from('prototype_templates')
          .select('id')
          .eq('id', template.id)
          .single();

        if (existing) {
          // Update existing template
          const { error } = await supabase
            .from('prototype_templates')
            .update({
              name: template.name,
              prototype_data: template.prototype,
            })
            .eq('id', template.id);

          if (error) {
            console.error('Error updating prototype template in Supabase:', error);
            throw error;
          }
          console.log('Prototype template updated in Supabase successfully');
        } else {
          // Insert new template
          const { error } = await supabase
            .from('prototype_templates')
            .insert(templateData);

          if (error) {
            console.error('Error saving prototype template to Supabase:', error);
            throw error;
          }
          console.log('Prototype template saved to Supabase successfully');
        }
        return; // Successfully saved to Supabase
      } catch (error) {
        console.error('Exception saving prototype template to Supabase, falling back to local storage:', error);
      }
    }

    // Fallback to IndexedDB/localStorage
    if (USE_INDEXED_DB) {
      try {
        const templates = await getPrototypeTemplates();
        const index = templates.findIndex(t => t.id === template.id);

        if (index >= 0) {
          templates[index] = template;
        } else {
          templates.push(template);
        }

        await saveAllToStore('prototypeTemplates', templates);
        console.log('Template saved to IndexedDB successfully');
        return;
      } catch (error) {
        console.error('Error saving to IndexedDB, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage with cleanup logic
    const storageUsage = await getStorageUsage();
    const templateSize = new Blob([JSON.stringify(template)]).size;
    const templateSizeMB = templateSize / (1024 * 1024);
    
    console.log(`Storage usage: ${storageUsage.percentage.toFixed(1)}%, Template size: ${templateSizeMB.toFixed(2)}MB`);
    
    // If storage is getting full, try to clean up old templates
    if (storageUsage.percentage > 70) {
      console.log('Storage is getting full, attempting cleanup...');
      try {
        cleanupOldTemplates('prototype');
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError);
      }
    }
    
    const templates = await getPrototypeTemplates();
    const index = templates.findIndex(t => t.id === template.id);

    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }

    // Validate that the template can be serialized before saving
    const serialized = JSON.stringify(templates);
    
    // Check size before saving (localStorage limit is typically 5-10MB)
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
    if (sizeInMB > 4) {
      console.warn(`All templates size is ${sizeInMB.toFixed(2)}MB, which may exceed localStorage quota`);
    }
    
    try {
      localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, serialized);
    } catch (quotaError: any) {
      // Handle quota exceeded error - try cleanup and retry once
      if (quotaError.name === 'QuotaExceededError' || quotaError.message?.includes('quota')) {
        console.log('Quota exceeded, attempting aggressive cleanup...');
        try {
          // More aggressive cleanup - keep only 5 most recent
          const sorted = templates.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const toKeep = sorted.slice(0, 5);
          const cleaned = toKeep.map(t => t.id === template.id ? template : t);
          if (!cleaned.find(t => t.id === template.id)) {
            cleaned.push(template);
          }
          localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(cleaned));
          console.log('Successfully saved after cleanup');
          return;
        } catch (retryError) {
          throw new Error('Storage quota exceeded. Please remove some templates manually or clear browser localStorage.');
        }
      }
      throw quotaError;
    }
    
    // Verify it was saved correctly
    const verifyData = localStorage.getItem(PROTOTYPE_TEMPLATES_KEY);
    if (!verifyData) {
      throw new Error('Failed to verify template was saved to localStorage');
    }
  } catch (error) {
    console.error('Error in savePrototypeTemplate:', error);
    console.error('Template data size:', new Blob([JSON.stringify(template)]).size / 1024, 'KB');
    throw error;
  }
};

export const deletePrototypeTemplate = async (id: string): Promise<void> => {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const { error } = await supabase
        .from('prototype_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting prototype template from Supabase:', error);
        throw error;
      }
      return; // Successfully deleted from Supabase
    } catch (error) {
      console.error('Exception deleting prototype template from Supabase, falling back to local storage:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  if (USE_INDEXED_DB) {
    try {
      await deleteFromStore('prototypeTemplates', id);
      return;
    } catch (error) {
      console.error('Error deleting from IndexedDB, falling back to localStorage:', error);
    }
  }
  const templates = await getPrototypeTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(filtered));
};

export const updatePrototypeTemplate = async (id: string, updates: Partial<PrototypeTemplate>): Promise<void> => {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.prototype !== undefined) updateData.prototype_data = updates.prototype;

      const { error } = await supabase
        .from('prototype_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating prototype template in Supabase:', error);
        throw error;
      }
      return; // Successfully updated in Supabase
    } catch (error) {
      console.error('Exception updating prototype template in Supabase, falling back to local storage:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  const templates = await getPrototypeTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates };
    if (USE_INDEXED_DB) {
      try {
        await saveAllToStore('prototypeTemplates', templates);
        return;
      } catch (error) {
        console.error('Error updating in IndexedDB, falling back to localStorage:', error);
      }
    }
    localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const getPrototypeTemplate = async (id: string): Promise<PrototypeTemplate | undefined> => {
  const templates = await getPrototypeTemplates();
  return templates.find(t => t.id === id);
};

export const createPrototypeTemplate = async (
  name: string,
  prototype: Prototype
): Promise<PrototypeTemplate> => {
  const { id, createdAt, updatedAt, ...prototypeData } = prototype;
  
  console.log('Creating prototype template:', { name, stepsCount: prototypeData.steps.length });
  
  // Process steps with image compression
  const processedSteps = await Promise.all(
    prototypeData.steps.map(async (step, stepIndex) => {
      // Compress step image if it's base64
      let processedImageUrl = step.imageUrl;
      if (step.imageUrl && isBase64DataUrl(step.imageUrl)) {
        console.log(`Compressing step ${stepIndex} image (${step.imageUrl.substring(0, 50)}...)`);
        try {
          processedImageUrl = await compressImage(step.imageUrl);
          console.log(`Step ${stepIndex} image compressed successfully`);
        } catch (error) {
          console.warn(`Failed to compress step ${stepIndex} image, using original:`, error);
          // Keep original image if compression fails
          processedImageUrl = step.imageUrl;
        }
      } else if (step.imageUrl) {
        console.log(`Step ${stepIndex} has non-base64 image URL, keeping as-is`);
      }
      
      // Process elements
      const processedElements = await Promise.all(
        step.elements.map(async (el, elIndex) => {
          try {
            const processedConfig = await deepCopyConfig(el.config, true);
            return {
              ...el,
              id: crypto.randomUUID(), // Create new IDs for elements
              config: processedConfig,
            };
          } catch (error) {
            console.warn(`Error processing element ${elIndex} in step ${stepIndex}:`, error);
            // Fallback to original config if processing fails
            return {
              ...el,
              id: crypto.randomUUID(),
              config: el.config, // Use original config as fallback
            };
          }
        })
      );
      
      const processedStep = {
        ...step,
        id: crypto.randomUUID(), // Create new IDs for steps
        imageUrl: processedImageUrl, // Preserve image URL (compressed or original)
        elements: processedElements,
      };
      
      console.log(`Step ${stepIndex} processed:`, { 
        hasImage: !!processedStep.imageUrl,
        imageUrlLength: processedStep.imageUrl?.length || 0,
        imageUrlPreview: processedStep.imageUrl?.substring(0, 50) || 'none',
        elementsCount: processedStep.elements.length 
      });
      
      return processedStep;
    })
  );
  
  // Compress logo if it's base64
  let processedLogoUrl = prototypeData.logoUrl;
  if (prototypeData.logoUrl && isBase64DataUrl(prototypeData.logoUrl)) {
    console.log('Compressing logo image...');
    try {
      processedLogoUrl = await compressImage(prototypeData.logoUrl);
      console.log('Logo compressed successfully');
    } catch (error) {
      console.warn('Failed to compress logo, using original:', error);
      processedLogoUrl = prototypeData.logoUrl; // Keep original if compression fails
    }
  }
  
  const template = {
    id: crypto.randomUUID(),
    name,
    prototype: {
      ...prototypeData,
      logoUrl: processedLogoUrl,
      steps: processedSteps,
    },
    createdAt: new Date().toISOString(),
  };
  
  console.log('Template created:', {
    templateId: template.id,
    stepsCount: template.prototype.steps.length,
    stepsWithImages: template.prototype.steps.filter(s => s.imageUrl).length,
  });
  
  return template;
};

// Application Step Templates
export const getApplicationStepTemplates = async (): Promise<ApplicationStepTemplate[]> => {
  // Try Supabase first for cloud storage
  if (USE_SUPABASE) {
    try {
      const { data, error } = await supabase
        .from('application_step_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching application step templates from Supabase:', error);
      } else if (data && data.length > 0) {
        // Transform database records to ApplicationStepTemplate format
        return data.map((record: any) => ({
          id: record.id,
          name: record.name,
          step: record.step_data,
          createdAt: record.created_at,
        }));
      }
    } catch (error) {
      console.error('Exception fetching application step templates from Supabase:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  if (USE_INDEXED_DB) {
    try {
      return await getAllFromStore<ApplicationStepTemplate>('applicationStepTemplates');
    } catch (error) {
      console.error('Error reading from IndexedDB, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(APPLICATION_STEP_TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveApplicationStepTemplate = async (template: ApplicationStepTemplate): Promise<void> => {
  try {
    // Try Supabase first for cloud storage
    if (USE_SUPABASE) {
      try {
        const templateData = {
          id: template.id,
          name: template.name,
          step_data: template.step,
          created_at: template.createdAt,
        };

        // Check if template exists
        const { data: existing } = await supabase
          .from('application_step_templates')
          .select('id')
          .eq('id', template.id)
          .single();

        if (existing) {
          // Update existing template
          const { error } = await supabase
            .from('application_step_templates')
            .update({
              name: template.name,
              step_data: template.step,
            })
            .eq('id', template.id);

          if (error) {
            console.error('Error updating application step template in Supabase:', error);
            throw error;
          }
        } else {
          // Insert new template
          const { error } = await supabase
            .from('application_step_templates')
            .insert(templateData);

          if (error) {
            console.error('Error saving application step template to Supabase:', error);
            throw error;
          }
        }
        return; // Successfully saved to Supabase
      } catch (error) {
        console.error('Exception saving application step template to Supabase, falling back to local storage:', error);
      }
    }

    // Fallback to IndexedDB/localStorage
    if (USE_INDEXED_DB) {
      try {
        const templates = await getApplicationStepTemplates();
        const index = templates.findIndex(t => t.id === template.id);
        
        if (index >= 0) {
          templates[index] = template;
        } else {
          templates.push(template);
        }
        
        await saveAllToStore('applicationStepTemplates', templates);
        return;
      } catch (error) {
        console.error('Error saving to IndexedDB, falling back to localStorage:', error);
      }
    }
    
    const templates = await getApplicationStepTemplates();
    const index = templates.findIndex(t => t.id === template.id);

    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }

    const serialized = JSON.stringify(templates);
    localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, serialized);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      throw new Error('Storage quota exceeded. Please remove some templates or clear localStorage.');
    }
    throw error;
  }
};

export const deleteApplicationStepTemplate = async (id: string): Promise<void> => {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const { error } = await supabase
        .from('application_step_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting application step template from Supabase:', error);
        throw error;
      }
      return; // Successfully deleted from Supabase
    } catch (error) {
      console.error('Exception deleting application step template from Supabase, falling back to local storage:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  if (USE_INDEXED_DB) {
    try {
      await deleteFromStore('applicationStepTemplates', id);
      return;
    } catch (error) {
      console.error('Error deleting from IndexedDB, falling back to localStorage:', error);
    }
  }
  const templates = await getApplicationStepTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, JSON.stringify(filtered));
};

export const updateApplicationStepTemplate = async (id: string, updates: Partial<ApplicationStepTemplate>): Promise<void> => {
  // Try Supabase first
  if (USE_SUPABASE) {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.step !== undefined) updateData.step_data = updates.step;

      const { error } = await supabase
        .from('application_step_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating application step template in Supabase:', error);
        throw error;
      }
      return; // Successfully updated in Supabase
    } catch (error) {
      console.error('Exception updating application step template in Supabase, falling back to local storage:', error);
    }
  }

  // Fallback to IndexedDB/localStorage
  const templates = await getApplicationStepTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates };
    if (USE_INDEXED_DB) {
      try {
        await saveAllToStore('applicationStepTemplates', templates);
        return;
      } catch (error) {
        console.error('Error updating in IndexedDB, falling back to localStorage:', error);
      }
    }
    localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const getApplicationStepTemplate = (id: string): ApplicationStepTemplate | undefined => {
  const templates = getApplicationStepTemplates();
  return templates.find(t => t.id === id);
};

export const createApplicationStepTemplate = async (name: string, step: Step): Promise<ApplicationStepTemplate> => {
  // Compress step image if it's base64
  let processedImageUrl = step.imageUrl;
  if (step.imageUrl && isBase64DataUrl(step.imageUrl)) {
    try {
      processedImageUrl = await compressImage(step.imageUrl);
    } catch (error) {
      console.warn('Failed to compress step image:', error);
    }
  }
  
  // Process elements with image compression
  const processedElements = await Promise.all(
    step.elements.map(async (el) => ({
      ...el,
      id: crypto.randomUUID(), // Create new IDs for elements
      config: await deepCopyConfig(el.config, true), // Compress images
    }))
  );
  
  return {
    id: crypto.randomUUID(),
    name,
    step: {
      ...step,
      id: crypto.randomUUID(), // Create new ID for the step
      imageUrl: processedImageUrl,
      elements: processedElements,
    },
    createdAt: new Date().toISOString(),
  };
};

