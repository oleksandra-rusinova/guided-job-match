import { useState } from 'react';
import { Plus, Search, Bookmark, ChevronDown, HelpCircle } from 'lucide-react';
import { Prototype } from '../types';
import PrototypeCard from './PrototypeCard';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import SystemField from './SystemField';
import HowItWorksModal from './HowItWorksModal';

interface HomePageProps {
  prototypes: Prototype[];
  onCreateNew: () => void;
  onUseTemplate: () => void;
  onOpenPrototype: (id: string) => void;
  onEditPrototype: (id: string) => void;
  onDuplicatePrototype: (id: string) => void;
  onDeletePrototype: (id: string) => void;
  onOpenTemplates: () => void;
}

export default function HomePage({ prototypes, onCreateNew, onUseTemplate, onOpenPrototype, onEditPrototype, onDuplicatePrototype, onDeletePrototype, onOpenTemplates }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  const handleCopyUrl = (id: string) => {
    const url = `${window.location.origin}/prototype/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Optional: Show a toast notification or feedback
      // For now, we'll just copy silently
    }).catch(err => {
      console.error('Failed to copy URL:', err);
    });
  };

  const filteredPrototypes = prototypes
    .filter(prototype =>
      prototype.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prototype.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FB' }}>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-12 w-12 object-contain rounded-lg"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Logo</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold" style={{ color: '#464F5E' }}>
                  GJM Prototype Builder
                </h1>
                <p className="text-gray-500 text-md">Create and manage Guided Job Match prototypes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SecondaryButton onClick={() => setShowHowItWorksModal(true)} icon={<HelpCircle size={18} />}>
                How it works
              </SecondaryButton>
              <SecondaryButton onClick={onOpenTemplates} icon={<Bookmark size={18} />}>
                Prototype templates
              </SecondaryButton>
              <div className="relative">
                <PrimaryButton onClick={() => setShowCreateDropdown(!showCreateDropdown)}>
                  <Plus size={20} />
                  Create prototype
                  <ChevronDown size={16} className="ml-1" />
                </PrimaryButton>
                {showCreateDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCreateDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          onCreateNew();
                          setShowCreateDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                        style={{ color: '#464F5E' }}
                      >
                        Create new prototype
                      </button>
                      <button
                        onClick={() => {
                          onUseTemplate();
                          setShowCreateDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                        style={{ color: '#464F5E' }}
                      >
                        Use a template
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {prototypes.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#464F5E' }}>
              No prototypes yet
            </h3>
            <p className="text-gray-600 mb-6">Get started by creating your first prototype</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <SystemField
                    type="text"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search prototypes..."
                    showLabel={false}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {filteredPrototypes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No prototypes match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrototypes.map(prototype => (
                  <PrototypeCard
                    key={prototype.id}
                    prototype={prototype}
                    onOpen={onOpenPrototype}
                    onEdit={onEditPrototype}
                    onDuplicate={onDuplicatePrototype}
                    onDelete={onDeletePrototype}
                    onCopyUrl={handleCopyUrl}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <HowItWorksModal 
        isOpen={showHowItWorksModal} 
        onClose={() => setShowHowItWorksModal(false)} 
      />
    </div>
  );
}
