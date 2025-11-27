import { Users, Edit } from 'lucide-react';
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

  if (otherUsers.length === 0) {
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
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
        <Users className="w-3 h-3" />
        <span>{otherUsers.length} online</span>
        {otherUsers.length > 0 && (
          <div className="flex -space-x-1">
            {otherUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                style={{ zIndex: 10 - index }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {otherUsers.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                +{otherUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

