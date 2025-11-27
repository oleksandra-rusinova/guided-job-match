import { Edit } from 'lucide-react';
import { PresenceUser } from '../hooks/usePresence';

interface PresenceIndicatorProps {
  users: PresenceUser[];
  currentUserId?: string;
  className?: string;
}

export default function PresenceIndicator({ users, currentUserId, className = '' }: PresenceIndicatorProps) {
  // Filter out current user and get active users
  const otherUsers = users.filter(user => user.id !== currentUserId);
  const editingUsers = otherUsers.filter(user => user.isEditing);

  if (editingUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {editingUsers.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
          <Edit className="w-3 h-3" />
          <span>
            {editingUsers.length === 1
              ? `${editingUsers[0].name} is editing`
              : `${editingUsers.length} people editing`}
          </span>
        </div>
      )}
    </div>
  );
}

