import { useEffect, useState, useCallback } from 'react';
import { Prototype } from '../types';
import { supabase } from '../utils/supabase';
import { getPrototype } from '../utils/storage';
import { usePresence, PresenceUser } from './usePresence';

export function useRealtimePrototype(prototypeId: string | null, userId?: string, userName?: string) {
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load initial data
  useEffect(() => {
    if (!prototypeId) {
      setPrototype(null);
      setIsLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        const data = await getPrototype(prototypeId);
        setPrototype(data || null);
      } catch (error) {
        console.error('Error loading prototype:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [prototypeId]);

  // Set up Realtime subscription for specific prototype
  useEffect(() => {
    if (!prototypeId || !supabase) {
      setIsLoading(false);
      return;
    }

    // Subscribe to changes on this specific prototype
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
            const { data, error } = await supabase
              .from('prototypes')
              .select('*')
              .eq('id', prototypeId)
              .single();

            if (error) {
              console.error('Error fetching prototype after Realtime event:', error);
              return;
            }

            if (data) {
              setPrototype(transformRecord(data));
            }
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
      supabase.removeChannel(channel);
    };
  }, [prototypeId, transformRecord]);

  return {
    prototype,
    isConnected: isConnected && presenceConnected,
    isLoading,
    setPrototype,
    presences,
    presenceUsers,
    setEditing,
  };
}

