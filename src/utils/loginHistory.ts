import { supabase } from './supabase';

export interface LoginHistory {
  id: string;
  email: string;
  timestamp: string;
  created_at: string;
}

// Fallback to localStorage if Supabase is not configured
const STORAGE_KEY = 'login_history';
const USE_LOCAL_STORAGE = !supabase;

// Local storage fallback functions
const getLoginHistoryLocal = (): LoginHistory[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLoginHistoryLocal = (email: string, timestamp: string): void => {
  const history = getLoginHistoryLocal();
  const newEntry: LoginHistory = {
    id: crypto.randomUUID(),
    email,
    timestamp,
    created_at: timestamp,
  };
  history.unshift(newEntry); // Add to beginning
  // Keep only last 100 entries locally
  const limitedHistory = history.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
};

// Supabase functions
export const logLogin = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const timestamp = new Date().toISOString();

  if (USE_LOCAL_STORAGE) {
    saveLoginHistoryLocal(email, timestamp);
    return { success: true };
  }

  try {
    if (!supabase) {
      saveLoginHistoryLocal(email, timestamp);
      return { success: true };
    }

    const { error } = await supabase
      .from('login_history')
      .insert({
        email,
        timestamp,
      });

    if (error) {
      console.error('Error logging login to Supabase:', error);
      // Fallback to localStorage
      saveLoginHistoryLocal(email, timestamp);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error logging login:', error);
    // Fallback to localStorage
    saveLoginHistoryLocal(email, timestamp);
    return { success: false, error: error?.message || 'Unknown error occurred' };
  }
};

export const getLoginHistory = async (limit: number = 100): Promise<LoginHistory[]> => {
  if (USE_LOCAL_STORAGE) {
    return getLoginHistoryLocal().slice(0, limit);
  }

  try {
    if (!supabase) {
      return getLoginHistoryLocal().slice(0, limit);
    }

    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching login history:', error);
      return getLoginHistoryLocal().slice(0, limit); // Fallback to localStorage
    }

    return (data || []).map((record: any) => ({
      id: record.id,
      email: record.email,
      timestamp: record.timestamp,
      created_at: record.created_at || record.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching login history:', error);
    return getLoginHistoryLocal().slice(0, limit); // Fallback to localStorage
  }
};

