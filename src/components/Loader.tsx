import { useLoading } from '../contexts/LoadingContext';

function ArcSpinner({ size = 48 }: { size?: number }) {
  return (
    <div 
      className="rounded-full border-4 border-gray-200 border-t-primary-500 animate-spin"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        borderTopColor: '#4D3EE0'
      }}
    />
  );
}

export default function Loader() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <ArcSpinner size={48} />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

