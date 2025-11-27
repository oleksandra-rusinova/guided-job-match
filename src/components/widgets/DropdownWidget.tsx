import { useState } from 'react';

interface DropdownWidgetProps {
  config: any;
  pageNumber: number;
}

export default function DropdownWidget({ config, pageNumber }: DropdownWidgetProps) {
  const [selected, setSelected] = useState('');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg mb-4" style={{ backgroundColor: '#E8E5FB', color: '#2563EB' }}>
          {pageNumber}
        </div>
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">
          {config.title || 'Make a selection'}
        </h2>
        <p className="text-gray-600">{config.description || 'Choose from the dropdown'}</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select an Option
          </label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-400 bg-white"
          >
            <option value="">Choose an option</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
            <option value="5">Option 5</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Selection
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-400 bg-white"
          >
            <option value="">Choose an option</option>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
            <option value="c">Option C</option>
          </select>
        </div>

        {selected && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              You selected: <strong>Option {selected}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
