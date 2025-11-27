import { useEffect, useRef, useCallback, useState } from 'react';
import { Prototype } from '../types';
import { updatePrototype } from '../utils/storage';

interface UseAutoSaveOptions {
  prototype: Prototype | null;
  enabled?: boolean;
  debounceMs?: number;
  onSave?: (prototype: Prototype) => void;
}

export function useAutoSave({
  prototype,
  enabled = true,
  debounceMs = 1000, // Default 1 second debounce
  onSave,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Create a hash of the prototype to detect changes
  const getPrototypeHash = useCallback((prototype: Prototype | null): string => {
    if (!prototype) return '';
    return JSON.stringify({
      name: prototype.name,
      description: prototype.description,
      primaryColor: prototype.primaryColor,
      logoUrl: prototype.logoUrl,
      logoUploadMode: prototype.logoUploadMode,
      steps: prototype.steps,
    });
  }, []);

  // Auto-save function
  const autoSave = useCallback(async (prototypeToSave: Prototype) => {
    if (!prototypeToSave.id || !enabled) return;

    setIsSaving(true);
    try {
      const result = await updatePrototype(prototypeToSave.id, {
        name: prototypeToSave.name,
        description: prototypeToSave.description,
        primaryColor: prototypeToSave.primaryColor,
        logoUrl: prototypeToSave.logoUrl,
        logoUploadMode: prototypeToSave.logoUploadMode,
        steps: prototypeToSave.steps,
      });

      if (result.success && result.data) {
        lastSavedRef.current = getPrototypeHash(result.data);
        setLastSaved(new Date());
        if (onSave) {
          onSave(result.data);
        }
        console.log('Auto-saved prototype:', prototypeToSave.id);
      }
    } catch (error) {
      console.error('Error auto-saving prototype:', error);
    } finally {
      setIsSaving(false);
    }
  }, [enabled, onSave, getPrototypeHash]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!prototype || !prototype.id || !enabled) return;

    const currentHash = getPrototypeHash(prototype);
    
    // Skip if nothing changed
    if (currentHash === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      autoSave(prototype);
    }, debounceMs);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [prototype, enabled, debounceMs, autoSave, getPrototypeHash]);

  // Manual save function (for immediate save)
  const saveNow = useCallback(async () => {
    if (!prototype || !prototype.id || !enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    await autoSave(prototype);
  }, [prototype, enabled, autoSave]);

  return { saveNow, isSaving, lastSaved };
}

