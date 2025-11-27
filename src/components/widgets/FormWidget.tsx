import SystemField from '../SystemField';

interface FormWidgetProps {
  config: any;
  pageNumber: number;
}

export default function FormWidget({ config, pageNumber }: FormWidgetProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg mb-4" style={{ backgroundColor: '#E8E5FB', color: '#2563EB' }}>
          {pageNumber}
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {config.title || 'Fill in the form'}
        </h2>
        <p className="text-gray-600">{config.description || 'Please provide your information'}</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <SystemField
          type="text"
          value=""
          onChange={() => {}}
          label="Full Name"
          placeholder="Enter your name"
          className="py-3 focus:ring-0 focus:border-gray-400"
        />

        <SystemField
          type="text"
          value=""
          onChange={() => {}}
          label="Email Address"
          placeholder="your@email.com"
          className="py-3 focus:ring-0 focus:border-gray-400"
        />

        <SystemField
          type="text"
          value=""
          onChange={() => {}}
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          className="py-3 focus:ring-0 focus:border-gray-400"
        />

        <SystemField
          type="textarea"
          value=""
          onChange={() => {}}
          label="Additional Information"
          placeholder="Tell us more..."
          rows={4}
          className="py-3 focus:ring-0 focus:border-gray-400"
        />
      </div>
    </div>
  );
}
