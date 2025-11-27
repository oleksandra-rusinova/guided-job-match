import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  isEditing?: boolean;
  editingField?: string;
}

export interface PresenceState {
  [userId: string]: PresenceUser;
}

export function usePresence(channelName: string, userId: string, userName: string = 'Anonymous') {
  const [presences, setPresences] = useState<PresenceState>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!supabase || !channelName) return;

    // Generate a unique client ID for this session
    const clientId = userId || `client-${crypto.randomUUID()}`;

    // Create a presence channel
    const channel = supabase.channel(channelName);

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presencesMap: PresenceState = {};
        
        Object.entries(state).forEach(([key, presences]: [string, any]) => {
          if (Array.isArray(presences)) {
            presences.forEach((presence: any) => {
              const userId = presence.userId || key;
              presencesMap[userId] = {
                id: userId,
                name: presence.name || `User ${userId.slice(-4)}`,
                avatar: presence.avatar,
                isEditing: presence.isEditing || false,
                editingField: presence.editingField,
              };
            });
          }
        });

        setPresences(presencesMap);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track this user's presence
          await channel.track({
            userId: clientId,
            name: userName,
            isEditing: false,
            joinedAt: new Date().toISOString(),
          });
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [channelName, userId, userName]);

  const updatePresence = useCallback(
    async (updates: Partial<PresenceUser>) => {
      if (!supabase || !channelName) return;

      const channel = supabase.channel(channelName);
      const currentPresence = presences[userId] || { id: userId, name: userName };

      // Get existing presence data
      const existingPresence = channel.presenceState()[userId]?.[0] || {};
      
      await channel.track({
        ...existingPresence,
        userId: userId,
        name: userName,
        ...updates,
      });
    },
    [supabase, channelName, userId, userName, presences]
  );

  const setEditing = useCallback(
    async (isEditing: boolean, editingField?: string) => {
      await updatePresence({ isEditing, editingField });
    },
    [updatePresence]
  );

  return {
    presences,
    presenceUsers: Object.values(presences),
    isConnected,
    updatePresence,
    setEditing,
  };
}

