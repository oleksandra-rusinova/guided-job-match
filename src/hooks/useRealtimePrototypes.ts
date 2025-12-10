import { useEffect, useState, useCallback } from 'react';
import { Prototype } from '../types';
import { supabase } from '../utils/supabase';
import { getPrototypes } from '../utils/storage';
import { useLoading } from '../contexts/LoadingContext';

export function useRealtimePrototypes() {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { withLoading } = useLoading();

  // Transform database record to Prototype format
  const transformRecord = useCallback((record: any): Prototype => {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      primaryColor: record.primary_color,
      logoUrl: record.logo_url,
      logoUploadMode: record.logo_upload_mode,
      steps: record.steps,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await withLoading(() => getPrototypes());
        setPrototypes(data);
      } catch (error) {
        console.error('Error loading prototypes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [withLoading]);

  // Set up Realtime subscription
  useEffect(() => {
    // Skip if Supabase is not available
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Subscribe to changes on prototypes table
    const channel = supabase
      .channel('prototypes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'prototypes',
        },
        async (payload) => {
          console.log('Realtime event received:', payload.eventType, payload);

          // Reload prototypes after any change
          try {
            if (!supabase) return;
            await withLoading(async () => {
              const { data, error } = await supabase
                .from('prototypes')
                .select('*')
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching prototypes after Realtime event:', error);
                return;
              }

              const transformed = (data || []).map(transformRecord);
              setPrototypes(transformed);
            });
          } catch (error) {
            console.error('Error processing Realtime event:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [transformRecord]);

  // Function to optimistically update local state after saving
  const updatePrototypeInState = useCallback((updatedPrototype: Prototype) => {
    setPrototypes(prev => {
      const index = prev.findIndex(p => p.id === updatedPrototype.id);
      if (index >= 0) {
        // Update existing prototype
        const updated = [...prev];
        updated[index] = updatedPrototype;
        return updated;
      } else {
        // Add new prototype at the beginning
        return [updatedPrototype, ...prev];
      }
    });
  }, []);

  // Function to remove prototype from state
  const removePrototypeFromState = useCallback((id: string) => {
    setPrototypes(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    prototypes,
    isConnected,
    isLoading,
    setPrototypes,
    updatePrototypeInState,
    removePrototypeFromState,
  };
}

