import { useEffect, useState, useCallback } from 'react';
import { Prototype } from '../types';
import { supabase } from '../utils/supabase';
import { getPrototype } from '../utils/storage';
import { usePresence } from './usePresence';

export function useRealtimePrototype(prototypeId: string | null, userId?: string, userName?: string, initialPrototype?: Prototype) {
  const [prototype, setPrototype] = useState<Prototype | null>(initialPrototype || null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialPrototype);

  // Set up presence tracking for this prototype
  const channelName = prototypeId ? `prototype-presence-${prototypeId}` : '';
  const { presences, presenceUsers, isConnected: presenceConnected, setEditing } = usePresence(
    channelName,
    userId || `user-${crypto.randomUUID()}`,
    userName || 'Anonymous'
  );

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

  // Sync initialPrototype when it changes
  useEffect(() => {
    if (initialPrototype && initialPrototype.id === prototypeId) {
      setPrototype(initialPrototype);
    }
  }, [initialPrototype, prototypeId]);

  // Load initial data
  useEffect(() => {
    if (!prototypeId) {
      setPrototype(null);
      setIsLoading(false);
      return;
    }

    // If we have an initial prototype with matching ID, use it and skip loading
    if (initialPrototype && initialPrototype.id === prototypeId) {
      setPrototype(initialPrototype);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const loadInitialData = async () => {
      try {
        console.log('Loading prototype with ID:', prototypeId);
        const data = await getPrototype(prototypeId);
        console.log('Prototype loaded:', data ? 'Found' : 'Not found', {
          prototypeId,
          hasData: !!data,
          dataId: data?.id
        });
        if (data) {
          setPrototype(data);
        } else {
          // Prototype not found - set to null to show error
          console.warn('Prototype not found or access denied:', prototypeId);
          setPrototype(null);
        }
      } catch (error) {
        console.error('Error loading prototype:', error);
        setPrototype(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [prototypeId, initialPrototype]);

  // Set up Realtime subscription for specific prototype
  useEffect(() => {
    if (!prototypeId) {
      return;
    }
    
    if (!supabase) {
      console.log('Supabase not configured, skipping Realtime subscription');
      return;
    }

    // Subscribe to changes on this specific prototype
    // Note: Realtime subscription may fail for public users if RLS blocks it
    // This is okay - the initial load will still work
    const channel = supabase
      .channel(`prototype-${prototypeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prototypes',
          filter: `id=eq.${prototypeId}`, // Only listen to changes for this prototype
        },
        async (payload) => {
          console.log('Realtime event received for prototype:', payload.eventType, payload);

          if (payload.eventType === 'DELETE') {
            setPrototype(null);
            return;
          }

          // Fetch updated prototype
          try {
            if (!supabase) return;
            const { data, error } = await supabase
              .from('prototypes')
              .select('*')
              .eq('id', prototypeId)
              .single();

            if (error) {
              console.error('Error fetching prototype after Realtime event:', error);
              // Don't update state if there's an error - keep current prototype
              return;
            }

            if (data) {
              setPrototype(transformRecord(data));
            }
          } catch (error) {
            console.error('Error processing Realtime event:', error);
            // Don't update state if there's an error - keep current prototype
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        // Only set connected if subscription succeeds
        // For public users, subscription might fail due to RLS, which is okay
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [prototypeId, transformRecord]);

  // Function to optimistically update local state after saving
  const updatePrototypeInState = useCallback((updatedPrototype: Prototype) => {
    setPrototype(updatedPrototype);
  }, []);

  return {
    prototype,
    isConnected: isConnected && presenceConnected,
    isLoading,
    setPrototype,
    updatePrototypeInState,
    presences,
    presenceUsers,
    setEditing,
  };
}

