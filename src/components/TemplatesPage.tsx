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
import IconButton from './IconButton';
import TemplateNameModal from './TemplateNameModal';
import TemplateEditor from './TemplateEditor';
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
  const [selectedTemplate, setSelectedTemplate] = useState<{
    type: 'question' | 'prototype' | 'applicationStep';
    template: QuestionTemplate | PrototypeTemplate | ApplicationStepTemplate;
  } | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [templateToRename, setTemplateToRename] = useState<{ type: 'question' | 'prototype' | 'applicationStep'; id: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setQuestionTemplates(getQuestionTemplates());
    setPrototypeTemplates(getPrototypeTemplates());
    setApplicationStepTemplates(getApplicationStepTemplates());
  };

  const templates = activeTabIndex === 0 
    ? questionTemplates 
    : activeTabIndex === 1 
    ? prototypeTemplates 
    : applicationStepTemplates;

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(query));
  }, [templates, searchQuery]);

  const handleDeleteTemplate = (id: string) => {
    const type = activeTabIndex === 0 ? 'question' : activeTabIndex === 1 ? 'prototype' : 'applicationStep';
    const confirmMessage = type === 'question' 
      ? 'Are you sure you want to delete this question template?'
      : type === 'prototype'
      ? 'Are you sure you want to delete this prototype template?'
      : 'Are you sure you want to delete this application template?';
    
    if (confirm(confirmMessage)) {
      if (type === 'question') {
        deleteQuestionTemplate(id);
      } else if (type === 'prototype') {
        deletePrototypeTemplate(id);
      } else {
        deleteApplicationStepTemplate(id);
      }
      loadTemplates();
      if (selectedTemplate?.template.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleRename = (name: string) => {
    if (!templateToRename) return;
    
    if (templateToRename.type === 'question') {
      const template = questionTemplates.find(t => t.id === templateToRename.id);
      if (template) {
        const updated = { ...template, name };
        saveQuestionTemplate(updated);
        loadTemplates();
        if (selectedTemplate?.template.id === template.id) {
          setSelectedTemplate({ type: 'question', template: updated });
        }
      }
    } else if (templateToRename.type === 'prototype') {
      const template = prototypeTemplates.find(t => t.id === templateToRename.id);
      if (template) {
        const updated = { ...template, name };
        savePrototypeTemplate(updated);
        loadTemplates();
        if (selectedTemplate?.template.id === template.id) {
          setSelectedTemplate({ type: 'prototype', template: updated });
        }
      }
    } else {
      const template = applicationStepTemplates.find(t => t.id === templateToRename.id);
      if (template) {
        const updated = { ...template, name };
        saveApplicationStepTemplate(updated);
        loadTemplates();
        if (selectedTemplate?.template.id === template.id) {
          setSelectedTemplate({ type: 'applicationStep', template: updated });
        }
      }
    }
    
    setTemplateToRename(null);
  };

  const handleSaveTemplate = (name: string, steps: any[]) => {
    if (!selectedTemplate) return;

    if (selectedTemplate.type === 'question') {
      const template = selectedTemplate.template as QuestionTemplate;
      const updated: QuestionTemplate = {
        ...template,
        name,
        step: steps[0] || template.step,
      };
      saveQuestionTemplate(updated);
      loadTemplates();
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
      savePrototypeTemplate(updated);
      loadTemplates();
      setSelectedTemplate({ type: 'prototype', template: updated });
    } else {
      const template = selectedTemplate.template as ApplicationStepTemplate;
      const updated: ApplicationStepTemplate = {
        ...template,
        name,
        step: steps[0] || template.step,
      };
      saveApplicationStepTemplate(updated);
      loadTemplates();
      setSelectedTemplate({ type: 'applicationStep', template: updated });
    }
  };

  const handleCreateTemplate = (name: string) => {
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
      saveQuestionTemplate(newTemplate);
      loadTemplates();
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
      savePrototypeTemplate(newTemplate);
      loadTemplates();
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
      saveApplicationStepTemplate(newTemplate);
      loadTemplates();
      setSelectedTemplate({ type: 'applicationStep', template: newTemplate });
    }
    setShowCreateModal(false);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: '#464F5E' }}>
                {activeTabIndex === 0 
                  ? 'Question Templates' 
                  : activeTabIndex === 1 
                  ? 'Prototype Templates' 
                  : 'Application Templates'}
              </h2>
              <Tooltip content="Create template">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <Plus size={18} />
                </button>
              </Tooltip>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                style={{ color: '#464F5E' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
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
        <div className="flex-1 flex flex-col">
          {selectedTemplate ? (
            <TemplateEditor
              templateName={selectedTemplate.template.name}
              steps={getTemplateSteps()}
              onSave={handleSaveTemplate}
              onCancel={() => setSelectedTemplate(null)}
              primaryColor="#4D3EE0"
              isQuestionTemplate={selectedTemplate.type === 'question' || selectedTemplate.type === 'applicationStep'}
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
    </div>
  );
}
