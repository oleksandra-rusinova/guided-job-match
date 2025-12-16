import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Plus, Trash2 } from 'lucide-react';
import { QuestionTemplate, PrototypeTemplate, ApplicationStepTemplate } from '../types';
import {
  getQuestionTemplates,
  deleteQuestionTemplate,
  getPrototypeTemplates,
  deletePrototypeTemplate,
  getApplicationStepTemplates,
  deleteApplicationStepTemplate,
  saveQuestionTemplate,
  savePrototypeTemplate,
  saveApplicationStepTemplate,
} from '../utils/templates';
import { saveAllToStore } from '../utils/indexedDB';
import IconButton from './IconButton';
import TemplateNameModal from './TemplateNameModal';
import TemplateEditor from './TemplateEditor';
import SystemMessageModal from './SystemMessageModal';
import Tabs from './Tabs';
import Tooltip from './Tooltip';

interface TemplatesPageProps {
  onBack: () => void;
  onEditQuestionTemplate: (template: QuestionTemplate) => void;
  onEditPrototypeTemplate: (template: PrototypeTemplate) => void;
}

export default function TemplatesPage({
  onBack,
  onEditQuestionTemplate: _onEditQuestionTemplate,
  onEditPrototypeTemplate: _onEditPrototypeTemplate,
}: TemplatesPageProps) {
  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>([]);
  const [prototypeTemplates, setPrototypeTemplates] = useState<PrototypeTemplate[]>([]);
  const [applicationStepTemplates, setApplicationStepTemplates] = useState<ApplicationStepTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    type: 'question' | 'prototype' | 'applicationStep';
    template: QuestionTemplate | PrototypeTemplate | ApplicationStepTemplate;
  } | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [templateToRename, setTemplateToRename] = useState<{ type: 'question' | 'prototype' | 'applicationStep'; id: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // System message modal state
  const [systemMessage, setSystemMessage] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    instructions?: string[];
    additionalInfo?: string;
  }>({
    isOpen: false,
    message: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  // Reload templates when the page becomes visible (user returns from CreatePrototype)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTemplates();
      }
    };
    
    const handleFocus = () => {
      loadTemplates();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [questions, prototypes, applications] = await Promise.all([
        getQuestionTemplates(),
        getPrototypeTemplates(),
        getApplicationStepTemplates(),
      ]);
      setQuestionTemplates(questions);
      setPrototypeTemplates(prototypes);
      setApplicationStepTemplates(applications);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const templates = activeTabIndex === 0 
    ? questionTemplates 
    : activeTabIndex === 1 
    ? prototypeTemplates 
    : applicationStepTemplates;

  // Auto-select first template when templates are loaded or tab changes
  useEffect(() => {
    // Only auto-select if no template is currently selected and there are templates available
    if (!selectedTemplate && templates.length > 0) {
      const type = activeTabIndex === 0 
        ? 'question' 
        : activeTabIndex === 1 
        ? 'prototype' 
        : 'applicationStep';
      setSelectedTemplate({
        type: type as 'question' | 'prototype' | 'applicationStep',
        template: templates[0],
      });
    }
  }, [templates, activeTabIndex, selectedTemplate]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(query));
  }, [templates, searchQuery]);

  const handleDeleteTemplate = async (id: string) => {
    const type = activeTabIndex === 0 ? 'question' : activeTabIndex === 1 ? 'prototype' : 'applicationStep';
    
    try {
      if (type === 'question') {
        await deleteQuestionTemplate(id);
      } else if (type === 'prototype') {
        await deletePrototypeTemplate(id);
      } else {
        await deleteApplicationStepTemplate(id);
      }
      await loadTemplates();
      if (selectedTemplate?.template.id === id) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setSystemMessage({
        isOpen: true,
        message: 'Failed to delete template. Please try again.',
      });
    }
  };

  const handleRename = async (name: string) => {
    if (!templateToRename) return;
    
    try {
      if (templateToRename.type === 'question') {
        const template = questionTemplates.find(t => t.id === templateToRename.id);
        if (template) {
          const updated = { ...template, name };
          await saveQuestionTemplate(updated);
          await loadTemplates();
          if (selectedTemplate?.template.id === template.id) {
            setSelectedTemplate({ type: 'question', template: updated });
          }
        }
      } else if (templateToRename.type === 'prototype') {
        const template = prototypeTemplates.find(t => t.id === templateToRename.id);
        if (template) {
          const updated = { ...template, name };
          await savePrototypeTemplate(updated);
          await loadTemplates();
          if (selectedTemplate?.template.id === template.id) {
            setSelectedTemplate({ type: 'prototype', template: updated });
          }
        }
      } else {
        const template = applicationStepTemplates.find(t => t.id === templateToRename.id);
        if (template) {
          const updated = { ...template, name };
          await saveApplicationStepTemplate(updated);
          await loadTemplates();
          if (selectedTemplate?.template.id === template.id) {
            setSelectedTemplate({ type: 'applicationStep', template: updated });
          }
        }
      }
      
      setTemplateToRename(null);
    } catch (error) {
      console.error('Error renaming template:', error);
      setSystemMessage({
        isOpen: true,
        message: 'Failed to rename template. Please try again.',
      });
    }
  };

  const handleSaveTemplate = async (name: string, steps: any[]) => {
    if (!selectedTemplate) return;

    try {
      if (selectedTemplate.type === 'question') {
        const template = selectedTemplate.template as QuestionTemplate;
        const updated: QuestionTemplate = {
          ...template,
          name,
          step: steps[0] || template.step,
        };
        await saveQuestionTemplate(updated);
        await loadTemplates();
        setSelectedTemplate({ type: 'question', template: updated });
      } else if (selectedTemplate.type === 'prototype') {
        const template = selectedTemplate.template as PrototypeTemplate;
        const updated: PrototypeTemplate = {
          ...template,
          name,
          prototype: {
            ...template.prototype,
            steps,
          },
        };
        await savePrototypeTemplate(updated);
        await loadTemplates();
        setSelectedTemplate({ type: 'prototype', template: updated });
      } else {
        const template = selectedTemplate.template as ApplicationStepTemplate;
        const updated: ApplicationStepTemplate = {
          ...template,
          name,
          step: steps[0] || template.step,
        };
        await saveApplicationStepTemplate(updated);
        await loadTemplates();
        setSelectedTemplate({ type: 'applicationStep', template: updated });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSystemMessage({
        isOpen: true,
        message: 'Failed to save template. Please try again.',
      });
    }
  };

  const handleCreateTemplate = async (name: string) => {
    try {
      if (activeTabIndex === 0) {
        // Create question template
        const newTemplate: QuestionTemplate = {
          id: crypto.randomUUID(),
          name,
          step: {
            id: crypto.randomUUID(),
            name: 'Step 1',
            question: '',
            description: '',
            splitScreenWithImage: false,
            imageUrl: '',
            imageUploadMode: 'upload',
            imagePosition: 'right',
            imageHasTitle: false,
            imageTitle: '',
            imageSubtitle: '',
            elements: [],
          },
          createdAt: new Date().toISOString(),
        };
        await saveQuestionTemplate(newTemplate);
        await loadTemplates();
        setSelectedTemplate({ type: 'question', template: newTemplate });
      } else if (activeTabIndex === 1) {
        // Create prototype template
        const newTemplate: PrototypeTemplate = {
          id: crypto.randomUUID(),
          name,
          prototype: {
            name: '',
            description: '',
            primaryColor: '#4D3EE0',
            logoUrl: '',
            logoUploadMode: 'upload',
            steps: [],
          },
          createdAt: new Date().toISOString(),
        };
        await savePrototypeTemplate(newTemplate);
        await loadTemplates();
        setSelectedTemplate({ type: 'prototype', template: newTemplate });
      } else {
        // Create application template
        const newTemplate: ApplicationStepTemplate = {
          id: crypto.randomUUID(),
          name,
          step: {
            id: crypto.randomUUID(),
            name: 'Application Step',
            question: '',
            description: '',
            splitScreenWithImage: false,
            imageUrl: '',
            imageUploadMode: 'upload',
            imagePosition: 'right',
            imageHasTitle: false,
            imageTitle: '',
            imageSubtitle: '',
            elements: [],
            isApplicationStep: true,
            applicationStepHeading: '',
            applicationStepSubheading: '',
          },
          createdAt: new Date().toISOString(),
        };
        await saveApplicationStepTemplate(newTemplate);
        await loadTemplates();
        setSelectedTemplate({ type: 'applicationStep', template: newTemplate });
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating template:', error);
      setSystemMessage({
        isOpen: true,
        message: 'Failed to create template. Please try again.',
      });
    }
  };

  const getTemplateSteps = () => {
    if (!selectedTemplate) return [];
    if (selectedTemplate.type === 'question') {
      return [(selectedTemplate.template as QuestionTemplate).step];
    } else if (selectedTemplate.type === 'prototype') {
      return (selectedTemplate.template as PrototypeTemplate).prototype.steps;
    } else {
      return [(selectedTemplate.template as ApplicationStepTemplate).step];
    }
  };

  const handleClearAllTemplates = async () => {
    const type = activeTabIndex === 0 ? 'question' : activeTabIndex === 1 ? 'prototype' : 'applicationStep';
    try {
      if (type === 'question') {
        await saveAllToStore('questionTemplates', []);
        localStorage.setItem('questionTemplates', '[]');
      } else if (type === 'prototype') {
        await saveAllToStore('prototypeTemplates', []);
        localStorage.setItem('prototypeTemplates', '[]');
      } else {
        await saveAllToStore('applicationStepTemplates', []);
        localStorage.setItem('applicationStepTemplates', '[]');
      }
      await loadTemplates();
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error clearing templates:', error);
      setSystemMessage({
        isOpen: true,
        message: 'Failed to clear templates. Please try again.',
      });
    }
  };


  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 z-50">
        <div className="flex items-center gap-2 mb-4">
          <IconButton
            onClick={onBack}
            icon={<ArrowLeft size={20} />}
            variant="text"
            primaryColor="#4D3EE0"
            aria-label="Back"
          />
          <div>
            <h1 className="text-lg font-semibold mb-0.5" style={{ color: '#464F5E' }}>
              Prototype Templates
            </h1>
            <p className="text-sm text-gray-500">Customize the content and behavior of your application modules</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: 'Question Templates', badge: questionTemplates.length },
            { label: 'Prototype Templates', badge: prototypeTemplates.length },
            { label: 'Application Templates', badge: applicationStepTemplates.length },
          ]}
          activeTab={activeTabIndex}
          onTabChange={(index) => {
            setActiveTabIndex(index);
            setSelectedTemplate(null);
            setSearchQuery('');
          }}
          primaryColor="#4D3EE0"
        />
      </div>

      <div className="flex flex-1 overflow-hidden pt-[140px]">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-[140px] bottom-0 w-80 border-r border-gray-200 flex flex-col bg-gray-50 z-40">
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: '#464F5E' }}>
                {activeTabIndex === 0 
                  ? 'Question Templates' 
                  : activeTabIndex === 1 
                  ? 'Prototype Templates' 
                  : 'Application Templates'}
              </h2>
              <div className="flex items-center gap-2">
                <Tooltip content="Create template">
                  <IconButton
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={20} />}
                    variant="text"
                    primaryColor="#4D3EE0"
                    aria-label="Create template"
                  />
                </Tooltip>
              </div>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
                style={{ color: '#464F5E' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-8 h-8">
                    <svg
                      className="animate-spin"
                      style={{ animation: 'spin 1s linear infinite' }}
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                    >
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="#6633FF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="66"
                        strokeDashoffset="16.5"
                        transform="rotate(-90 16 16)"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Loading templates...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No templates match your search' : 'No templates yet'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplate?.template.id === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        const type = activeTabIndex === 0 
                          ? 'question' 
                          : activeTabIndex === 1 
                          ? 'prototype' 
                          : 'applicationStep';
                        setSelectedTemplate({
                          type: type as 'question' | 'prototype' | 'applicationStep',
                          template,
                        });
                      }}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors border ${
                        isSelected
                          ? 'bg-white border-l-4 shadow-sm'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      style={
                        isSelected
                          ? { borderLeftColor: '#4D3EE0', borderColor: '#E8EAEE' }
                          : { borderColor: '#E8EAEE' }
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate" style={{ color: '#464F5E' }}>
                            {template.name}
                          </h3>
                          {activeTabIndex === 0 && 'step' in template && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {template.step.question || 'No question'}
                            </p>
                          )}
                          {activeTabIndex === 1 && 'prototype' in template && (
                            <p className="text-xs text-gray-500 mt-1">
                              {template.prototype.steps.length} step{template.prototype.steps.length !== 1 ? 's' : ''}
                            </p>
                          )}
                          {activeTabIndex === 2 && 'step' in template && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {template.step.applicationStepHeading || 'No heading'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-center ml-2">
                          <Tooltip content="Delete">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col ml-80 min-h-0">
          {selectedTemplate ? (
            <TemplateEditor
              templateName={selectedTemplate.template.name}
              steps={getTemplateSteps()}
              onSave={handleSaveTemplate}
              onCancel={() => setSelectedTemplate(null)}
              primaryColor={selectedTemplate.type === 'prototype' ? (selectedTemplate.template as PrototypeTemplate).prototype.primaryColor : "#4D3EE0"}
              isQuestionTemplate={selectedTemplate.type === 'question'}
              isApplicationStepTemplate={selectedTemplate.type === 'applicationStep'}
              logoUrl={selectedTemplate.type === 'prototype' ? (selectedTemplate.template as PrototypeTemplate).prototype.logoUrl : undefined}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Select a template to edit</p>
                <p className="text-sm text-gray-400">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      <TemplateNameModal
        isOpen={showNameModal}
        onClose={() => {
          setShowNameModal(false);
          setTemplateToRename(null);
        }}
        onSave={handleRename}
        title="Rename Template"
        placeholder="Enter new template name"
      />

      {/* Create Template Modal */}
      <TemplateNameModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateTemplate}
        title={`Create ${activeTabIndex === 0 ? 'Question' : activeTabIndex === 1 ? 'Prototype' : 'Application'} Template`}
        placeholder="Enter template name"
      />

      {/* System Message Modal */}
      <SystemMessageModal
        isOpen={systemMessage.isOpen}
        onClose={() => setSystemMessage({ ...systemMessage, isOpen: false })}
        title={systemMessage.title}
        message={systemMessage.message}
        instructions={systemMessage.instructions}
        additionalInfo={systemMessage.additionalInfo}
      />
    </div>
  );
}
