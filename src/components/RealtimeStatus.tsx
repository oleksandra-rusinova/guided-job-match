import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatusProps {
  isConnected: boolean;
  className?: string;
}

export default function RealtimeStatus({ isConnected, className = '' }: RealtimeStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        isConnected
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'
      } ${className}`}
      title={isConnected ? 'Real-time sync active' : 'Real-time sync offline'}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

