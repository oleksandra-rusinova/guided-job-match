interface InfoCardsProps {
  config: any;
  pageNumber: number;
}

export default function InfoCards({ config, pageNumber }: InfoCardsProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg mb-4" style={{ backgroundColor: '#E8E5FB', color: '#2563EB' }}>
          {pageNumber}
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {config.title || 'Information'}
        </h2>
        <p className="text-gray-600">{config.description || 'Review the information below'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center font-semibold text-xl mb-4" style={{ backgroundColor: '#E8E5FB', color: '#2563EB' }}>
              {i}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Card Title {i}</h3>
            <p className="text-gray-600 text-sm">
              This is an informational card that displays important content to the user.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
