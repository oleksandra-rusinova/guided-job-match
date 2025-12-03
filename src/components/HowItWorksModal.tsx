import { X } from 'lucide-react';
import PrimaryButton from './PrimaryButton';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#464F5E' }}>
                How the app works
              </h2>
              <p className="text-sm text-gray-600">
                A quick guide for using this app to create guided job-match prototypes efficiently.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 pt-2">
            {/* Creating Prototypes Section */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold" style={{ color: '#464F5E' }}>
                🚀 Creating Prototypes
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm leading-relaxed" style={{ color: '#464F5E' }}>
                <li>Create a prototype with custom branding and a defined set of questions.</li>
                <li>Branding is easy to configure — simply upload a logo (file or URL) and choose a branding color using presets or by adding a custom one.</li>
              </ul>
            </div>

            {/* Configuring Steps Section */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold" style={{ color: '#464F5E' }}>
                🛠️ Configuring Steps in Prototypes
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm leading-relaxed" style={{ color: '#464F5E' }}>
                <li>Add steps with a question, description, and interactive elements such as input fields, dropdowns, and various card types.</li>
                <li>Include an application step at the end of the flow to «Apply» and redirect the user to external websites.</li>
              </ul>
            </div>

            {/* Editing a Prototype Section */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold" style={{ color: '#464F5E' }}>
                ✏️ Editing a Prototype
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm leading-relaxed" style={{ color: '#464F5E' }}>
                <li>You can edit a prototype at any time: reorder steps, use templates, and edit elements within the prototype.</li>
                <li>To customize the content of a specific step, click the edit icon in the top-right corner of the prototype header.</li>
                <li>In the step edit mode, you can adjust the question, description, and elements only.</li>
                <li>To edit prototype-level information (name, description, branding), select Edit from the actions menu by clicking the three-dots icon on the main page.</li>
              </ul>
            </div>

            {/* Using Templates Section */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold" style={{ color: '#464F5E' }}>
                🧩 Using Templates
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm leading-relaxed" style={{ color: '#464F5E' }}>
                <li>The Templates page contains reusable templates for questions, steps, and complete prototypes (including preconfigured step sequences).</li>
                <li>Whenever possible, use existing templates instead of recreating or modifying them from scratch to ensure consistency.</li>
                <li>You can save new templates for questions, steps, or full prototypes and reuse them anytime.</li>
              </ul>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#464F5E' }}>
                Got questions or feature requests?
              </p>
              <p className="text-sm text-gray-600">
                Feel free to reach out on Slack.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/254px-Slack_icon_2019.svg.png?20200128081203"
                alt="Slack"
                className="w-5 h-5 object-contain"
              />
              <p className="text-sm font-semibold" style={{ color: '#464F5E' }}>
                @Oleksandra Rusinova
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <PrimaryButton onClick={onClose}>
              Got it!
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

