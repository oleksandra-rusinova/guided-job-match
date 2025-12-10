import { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { QuestionTemplate, PrototypeTemplate, ApplicationStepTemplate } from '../types';
import Tabs from './Tabs';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: QuestionTemplate | PrototypeTemplate | ApplicationStepTemplate) => void;
  questionTemplates?: QuestionTemplate[];
  prototypeTemplates?: PrototypeTemplate[];
  applicationStepTemplates?: ApplicationStepTemplate[];
  type: 'question' | 'prototype' | 'applicationStep';
  showTabs?: boolean; // New prop to show tabs for step templates
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
  questionTemplates = [],
  prototypeTemplates = [],
  applicationStepTemplates = [],
  type,
  showTabs = false,
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'question' | 'applicationStep'>(type === 'applicationStep' ? 'applicationStep' : 'question');

  // Reset active tab when modal opens and showTabs is true
  useEffect(() => {
    if (isOpen && showTabs) {
      setActiveTab(type === 'applicationStep' ? 'applicationStep' : 'question');
    }
  }, [isOpen, showTabs, type]);

  // Determine which templates to show based on active tab or type
  const currentType = showTabs ? activeTab : type;
  const templates = currentType === 'question' 
    ? questionTemplates 
    : currentType === 'prototype' 
    ? prototypeTemplates 
    : applicationStepTemplates;

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(query));
  }, [templates, searchQuery]);

  const handleSelect = (template: QuestionTemplate | PrototypeTemplate | ApplicationStepTemplate) => {
    onSelect(template);
    setSearchQuery('');
    onClose();
  };

  const getTitle = () => {
    if (showTabs) {
      return 'Select Template';
    }
    return type === 'question' 
      ? 'Select Question Template' 
      : type === 'prototype' 
      ? 'Select Prototype Template' 
      : 'Select Application Template';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-lg max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium" style={{ color: '#464F5E' }}>
                {getTitle()}
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Tabs for choosing between Question and Application templates */}
            {showTabs && (
              <div className="mb-4">
                <Tabs
                  tabs={[
                    { label: 'Question Template', badge: questionTemplates.length },
                    { label: 'Application Template', badge: applicationStepTemplates.length },
                  ]}
                  activeTab={activeTab === 'question' ? 0 : 1}
                  onTabChange={(index) => {
                    setActiveTab(index === 0 ? 'question' : 'applicationStep');
                    setSearchQuery(''); // Clear search when switching tabs
                  }}
                />
              </div>
            )}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:shadow-md transition-all duration-200"
                style={{ color: '#464F5E' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {filteredTemplates.length > 0 ? (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="font-medium" style={{ color: '#464F5E' }}>
                      {template.name}
                    </div>
                    {currentType === 'question' && 'step' in template && (
                      <div className="text-sm text-gray-500 mt-1">
                        {template.step.question || 'No question'}
                      </div>
                    )}
                    {currentType === 'prototype' && 'prototype' in template && (
                      <div className="text-sm text-gray-500 mt-1">
                        {template.prototype.steps.length} step{template.prototype.steps.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {currentType === 'applicationStep' && 'step' in template && (
                      <div className="text-sm text-gray-500 mt-1">
                        {template.step.applicationStepHeading || 'No heading'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? 'No templates found matching your search' : 'No templates available'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

