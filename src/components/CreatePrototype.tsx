import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, RotateCcw, Save, GripVertical, Bookmark } from 'lucide-react';
import SystemField from './SystemField';
import { Prototype, Step, Element, ElementType, QuestionTemplate, PrototypeTemplate, ApplicationStepTemplate } from '../types';
import { ELEMENT_TYPES, getElementLabel } from '../utils/elementTypes';
import ColorPicker from './ColorPicker';
import ShowLabelToggle from './ShowLabelToggle';
import CardEditor from './CardEditor';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TextButton from './TextButton';
import Checkbox from './Checkbox';
import TabControl from './TabControl';
import FileUploader from './FileUploader';
import EditorField from './EditorField';
import TemplateNameModal from './TemplateNameModal';
import TemplateSelector from './TemplateSelector';
import Tooltip from './Tooltip';
import PresenceIndicator from './PresenceIndicator';
import { usePresence } from '../hooks/usePresence';
import {
  getQuestionTemplates,
  saveQuestionTemplate,
  createQuestionTemplate,
  getPrototypeTemplates,
  savePrototypeTemplate,
  createPrototypeTemplate,
  getApplicationStepTemplates,
  saveApplicationStepTemplate,
  createApplicationStepTemplate,
} from '../utils/templates';

interface CreatePrototypeProps {
  onSave: (prototype: Prototype) => void;
  onCancel: () => void;
  editingPrototype?: Prototype;
  template?: PrototypeTemplate | null;
}

export default function CreatePrototype({ onSave, onCancel, editingPrototype, template }: CreatePrototypeProps) {
  // Generate a user ID for this session
  const userId = `user-${localStorage.getItem('userId') || crypto.randomUUID()}`;
  const userName = localStorage.getItem('userName') || `User ${userId.slice(-4)}`;

  // Set up presence tracking when editing an existing prototype
  const channelName = editingPrototype?.id ? `prototype-presence-${editingPrototype.id}` : '';
  const { presenceUsers, isConnected: presenceConnected, setEditing } = usePresence(
    channelName,
    userId,
    userName
  );

  // Track editing state
  useEffect(() => {
    if (editingPrototype && channelName) {
      setEditing(true, 'prototype-editor');
      return () => {
        setEditing(false);
      };
    }
  }, [editingPrototype, channelName, setEditing]);

  // Initialize steps from template if provided, otherwise from editingPrototype or empty
  const getInitialSteps = (): Step[] => {
    if (template?.prototype?.steps) {
      // Clone steps from template with new IDs
      return template.prototype.steps.map(step => ({
        ...step,
        id: crypto.randomUUID(),
        elements: step.elements.map(el => ({
          ...el,
          id: crypto.randomUUID(),
        })),
      }));
    }
    return editingPrototype?.steps || [];
  };

  const [name, setName] = useState(editingPrototype?.name || '');
  const [description, setDescription] = useState(editingPrototype?.description || '');
  // Branding fields always use defaults when using template (not from template)
  const [primaryColor, setPrimaryColor] = useState(editingPrototype?.primaryColor || '#2563EB');
  const [logoUploadMode, setLogoUploadMode] = useState<'upload' | 'url'>(editingPrototype?.logoUploadMode || 'upload');
  const [logoUrl, setLogoUrl] = useState(editingPrototype?.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<Step[]>(getInitialSteps());
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [openElementMenuStepId, setOpenElementMenuStepId] = useState<string | null>(null);
  const [newlyAddedElementId, setNewlyAddedElementId] = useState<string | null>(null);
  const [newlyAddedStepId, setNewlyAddedStepId] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  
  // Template-related state
  const [showQuestionTemplateModal, setShowQuestionTemplateModal] = useState(false);
  const [showPrototypeTemplateModal, setShowPrototypeTemplateModal] = useState(false);
  const [showApplicationStepTemplateModal, setShowApplicationStepTemplateModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateSelectorType, setTemplateSelectorType] = useState<'question' | 'prototype' | 'applicationStep'>('question');
  const [stepToSaveAsTemplate, setStepToSaveAsTemplate] = useState<string | null>(null);
  const [showAddStepDropdown, setShowAddStepDropdown] = useState(false);
  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>([]);
  const [prototypeTemplates, setPrototypeTemplates] = useState<PrototypeTemplate[]>([]);
  const [applicationStepTemplates, setApplicationStepTemplates] = useState<ApplicationStepTemplate[]>([]);

  // Load templates on mount
  useEffect(() => {
    setQuestionTemplates(getQuestionTemplates());
    setPrototypeTemplates(getPrototypeTemplates());
    setApplicationStepTemplates(getApplicationStepTemplates());
  }, []);

  // Determine if this prototype was saved before (has an ID and exists in storage)
  const isPreviouslySaved = editingPrototype?.id && editingPrototype?.createdAt;

  // Default template state for new prototypes
  const defaultTemplateState = {
    name: '',
    description: '',
    primaryColor: '#2563EB',
    logoUploadMode: 'upload' as 'upload' | 'url',
    logoUrl: '',
    steps: [],
  };

  // Saved state for previously saved prototypes
  const savedState = {
    name: editingPrototype?.name || '',
    description: editingPrototype?.description || '',
    primaryColor: editingPrototype?.primaryColor || '#2563EB',
    logoUploadMode: editingPrototype?.logoUploadMode || 'upload',
    logoUrl: editingPrototype?.logoUrl || '',
    steps: editingPrototype?.steps || [],
  };

  const handleReset = () => {
    const resetState = isPreviouslySaved ? savedState : defaultTemplateState;
    const confirmMessage = isPreviouslySaved 
      ? 'Are you sure you want to reset to the last saved version?' 
      : 'Are you sure you want to reset all data to default template?';
    
    if (confirm(confirmMessage)) {
      setName(resetState.name);
      setDescription(resetState.description);
      setPrimaryColor(resetState.primaryColor);
      setLogoUploadMode(resetState.logoUploadMode);
      setLogoUrl(resetState.logoUrl);
      setSteps(resetState.steps);
      setLogoFile(null);
    }
  };

  const handleLogoUpload = (file: File | null, fileInfo: any) => {
    setLogoFile(file);
    setLogoUrl(fileInfo?.dataUrl || '');
  };

  const handleStepImageUpload = (stepId: string, _file: File | null, fileInfo: any) => {
    updateStep(stepId, { imageUrl: fileInfo?.dataUrl || '' });
  };

  const addStep = () => {
    // Filter out application steps to count only regular steps
    const regularSteps = steps.filter(s => !s.isApplicationStep);
    const newStep: Step = {
      id: crypto.randomUUID(),
      name: `Step ${regularSteps.length + 1}`,
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
      isApplicationStep: false,
    };
    // Insert before any application steps
    const applicationSteps = steps.filter(s => s.isApplicationStep);
    setSteps([...regularSteps, newStep, ...applicationSteps]);
    setExpandedStepId(newStep.id);
    setNewlyAddedStepId(newStep.id);
  };

  const addApplicationStep = () => {
    const newStep: Step = {
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
    };
    // Application steps always go at the end
    setSteps([...steps, newStep]);
    setExpandedStepId(newStep.id);
    setNewlyAddedStepId(newStep.id);
  };

  const handleSaveQuestionTemplate = (templateName: string) => {
    if (!stepToSaveAsTemplate) return;
    const step = steps.find(s => s.id === stepToSaveAsTemplate);
    if (step) {
      const template = createQuestionTemplate(templateName, step);
      saveQuestionTemplate(template);
      setQuestionTemplates(getQuestionTemplates());
      setStepToSaveAsTemplate(null);
    }
  };

  const handleSaveApplicationStepTemplate = (templateName: string) => {
    if (!stepToSaveAsTemplate) return;
    const step = steps.find(s => s.id === stepToSaveAsTemplate);
    if (step && step.isApplicationStep) {
      const template = createApplicationStepTemplate(templateName, step);
      saveApplicationStepTemplate(template);
      setApplicationStepTemplates(getApplicationStepTemplates());
      setStepToSaveAsTemplate(null);
    }
  };

  const handleSavePrototypeTemplate = (templateName: string) => {
    const prototype: Prototype = {
      id: editingPrototype?.id || crypto.randomUUID(),
      name,
      description,
      primaryColor,
      logoUrl: logoUploadMode === 'url' ? logoUrl : logoFile ? logoUrl : editingPrototype?.logoUrl,
      logoUploadMode,
      steps,
      createdAt: editingPrototype?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const template = createPrototypeTemplate(templateName, prototype);
    savePrototypeTemplate(template);
    setPrototypeTemplates(getPrototypeTemplates());
  };

  const handleSelectQuestionTemplate = (template: QuestionTemplate | PrototypeTemplate) => {
    if ('step' in template) {
      const newStep: Step = {
        ...template.step,
        id: crypto.randomUUID(),
        name: `Step ${steps.length + 1}`,
        elements: template.step.elements.map(el => ({
          ...el,
          id: crypto.randomUUID(),
        })),
      };
      setSteps([...steps, newStep]);
      setExpandedStepId(newStep.id);
      setNewlyAddedStepId(newStep.id);
    }
  };

  const handleSelectPrototypeTemplate = (template: QuestionTemplate | PrototypeTemplate) => {
    if ('prototype' in template) {
      setName(template.prototype.name);
      setDescription(template.prototype.description);
      setPrimaryColor(template.prototype.primaryColor);
      setLogoUploadMode(template.prototype.logoUploadMode);
      setLogoUrl(template.prototype.logoUrl || '');
      setSteps(template.prototype.steps.map(step => ({
        ...step,
        id: crypto.randomUUID(),
        elements: step.elements.map(el => ({
          ...el,
          id: crypto.randomUUID(),
        })),
      })));
    }
  };

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(steps.map(step => step.id === stepId ? { ...step, ...updates } : step));
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
    if (expandedStepId === stepId) {
      setExpandedStepId(null);
    }
  };

  const handleStepDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStepDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleStepDrop = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStepId || draggedStepId === targetStepId) return;

    const draggedStep = steps.find(step => step.id === draggedStepId);
    const targetStep = steps.find(step => step.id === targetStepId);

    // Prevent dragging application steps
    if (draggedStep?.isApplicationStep) return;
    
    // Prevent dropping before application steps (application steps must stay at the end)
    if (targetStep?.isApplicationStep) return;

    const draggedIndex = steps.findIndex(step => step.id === draggedStepId);
    const targetIndex = steps.findIndex(step => step.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Separate regular steps and application steps
    const regularSteps = steps.filter(s => !s.isApplicationStep);
    const applicationSteps = steps.filter(s => s.isApplicationStep);
    
    // Find indices within regular steps only
    const draggedRegularIndex = regularSteps.findIndex(s => s.id === draggedStepId);
    const targetRegularIndex = regularSteps.findIndex(s => s.id === targetStepId);
    
    if (draggedRegularIndex === -1 || targetRegularIndex === -1) return;

    const newRegularSteps = [...regularSteps];
    const [draggedStepItem] = newRegularSteps.splice(draggedRegularIndex, 1);
    newRegularSteps.splice(targetRegularIndex, 0, draggedStepItem);

    // Combine regular steps with application steps at the end
    setSteps([...newRegularSteps, ...applicationSteps]);
    setDraggedStepId(null);
  };

  const handleStepDragEnd = () => {
    setDraggedStepId(null);
  };

  // Card element types that should be mutually exclusive
  const CARD_ELEMENT_TYPES: ElementType[] = ['simple_cards', 'image_cards', 'advanced_cards', 'image_only_card', 'yes_no_cards'];
  const APPLICATION_CARD_TYPE: ElementType = 'application_card';

  const hasCardElement = (stepId: string): boolean => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;
    if (step.isApplicationStep) {
      return step.elements.some(el => el.type === APPLICATION_CARD_TYPE);
    }
    return step.elements.some(el => CARD_ELEMENT_TYPES.includes(el.type));
  };

  const isCardElement = (type: ElementType): boolean => {
    return CARD_ELEMENT_TYPES.includes(type) || type === APPLICATION_CARD_TYPE;
  };

  const addElement = (stepId: string, type: ElementType) => {
    // Prevent adding a card element if one already exists
    if (isCardElement(type) && hasCardElement(stepId)) {
      return;
    }

    const newElement: Element = {
      id: crypto.randomUUID(),
      type,
      config: getDefaultElementConfig(type),
    };

    setSteps(steps.map(step =>
      step.id === stepId
        ? { ...step, elements: [...step.elements, newElement] }
        : step
    ));
    
    // Set the newly added element ID for scroll animation
    setNewlyAddedElementId(newElement.id);
  };

  // Scroll to newly added element
  useEffect(() => {
    if (newlyAddedElementId) {
      const element = document.getElementById(`element-${newlyAddedElementId}`);
      if (element) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          // Reset the newly added element ID
          setNewlyAddedElementId(null);
        }, 100);
      }
    }
  }, [newlyAddedElementId]);

  // Scroll to newly added step
  useEffect(() => {
    if (newlyAddedStepId) {
      const stepElement = document.getElementById(`step-${newlyAddedStepId}`);
      if (stepElement) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          stepElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          // Reset the newly added step ID
          setNewlyAddedStepId(null);
        }, 100);
      }
    }
  }, [newlyAddedStepId]);

  const getDefaultElementConfig = (type: ElementType) => {
    switch (type) {
      case 'text_field':
        return { label: '', hasLabel: true, placeholder: '' };
      case 'simple_cards':
      case 'checkboxes':
        return {
          options: [
            { id: '1', title: 'Option 1' },
            { id: '2', title: 'Option 2' },
          ],
          selectionType: 'multiple' as 'single' | 'multiple',
          maxSelection: 2,
        };
      case 'image_cards':
        return {
          options: [
            { id: '1', title: 'Option 1', imageUrl: '' },
            { id: '2', title: 'Option 2', imageUrl: '' },
          ],
        };
      case 'advanced_cards':
        return {
          options: [
            {
              id: '1',
              heading: '',
              mainText: '',
              linkSupportingText: '',
              linkEnabled: false,
              linkUrl: '',
              linkText: 'Learn more'
            },
          ],
        };
      case 'image_only_card':
        return {
          options: [
            { id: '1', imageUrl: '', imageUploadMode: 'upload' as 'upload' | 'url' },
            { id: '2', imageUrl: '', imageUploadMode: 'upload' as 'upload' | 'url' },
          ],
        };
      case 'dropdown':
        return {
          label: 'Select an option',
          placeholder: 'Select an option',
          options: [
            { id: '1', title: 'Option 1' },
            { id: '2', title: 'Option 2' },
          ],
        };
      case 'calendar_field':
        return {
          label: '',
          hasLabel: true,
          placeholder: '',
        };
      case 'yes_no_cards':
        return {
          options: [
            { id: '1', title: 'Yes' },
            { id: '2', title: 'No' },
          ],
          selectionType: 'single' as 'single' | 'multiple',
          maxSelection: 1,
        };
      case 'application_card':
        return {
          options: [
            { 
              id: '1', 
              jobTitle: 'Junior Technical Support Engineer',
              location: 'Hyderabad, Telangana, India',
              department: 'Customer Support',
              jobType: '',
              jobId: 'C-58500',
              jobDescription: 'Lead a dynamic team in Hyderabad, focusing on cutting-edge projects in Telangana, India. Drive innovation and excellence in every endeavor.'
            },
            { 
              id: '2', 
              jobTitle: 'Senior Software Developer',
              location: 'Bangalore, Karnataka, India',
              department: 'Engineering',
              jobType: '',
              jobId: 'C-58501',
              jobDescription: 'Join our engineering team to build innovative solutions and work on exciting projects.'
            },
          ],
          selectionType: 'single' as 'single' | 'multiple',
          maxSelection: 1,
        };
      default:
        return {};
    }
  };

  const deleteElement = (stepId: string, elementId: string) => {
    setSteps(steps.map(step =>
      step.id === stepId
        ? { ...step, elements: step.elements.filter(el => el.id !== elementId) }
        : step
    ));
  };

  const updateElement = (stepId: string, elementId: string, updates: Partial<Element>) => {
    setSteps(steps.map(step =>
      step.id === stepId
        ? {
            ...step,
            elements: step.elements.map(el =>
              el.id === elementId ? { ...el, ...updates } : el
            ),
          }
        : step
    ));
  };

  const handleSave = () => {
    const prototype: Prototype = {
      id: editingPrototype?.id || crypto.randomUUID(),
      name,
      description,
      primaryColor,
      logoUrl: logoUploadMode === 'url' ? logoUrl : logoFile ? logoUrl : editingPrototype?.logoUrl,
      logoUploadMode,
      steps,
      createdAt: editingPrototype?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(prototype);
  };

  const canSave = name && description && steps.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {editingPrototype && presenceConnected && presenceUsers && presenceUsers.length > 0 && (
        <div className="sticky top-0 z-10 px-4 sm:px-6 lg:px-8 py-2 border-b border-gray-200 bg-gray-50">
          <PresenceIndicator users={presenceUsers} currentUserId={userId} />
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TextButton
          onClick={onCancel}
          icon={<ArrowLeft size={20} />}
          className="mb-6"
        >
          Back to Home
        </TextButton>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          <div>
            <h2 className="text-xl font-medium mb-6" style={{ color: '#464F5E' }}>
              General Settings
            </h2>
            <div className="space-y-4">
              <SystemField
                type="text"
                value={name}
                onChange={setName}
                label="Flow Name"
                placeholder="Enter flow name"
              />

              <SystemField
                type="textarea"
                value={description}
                onChange={setDescription}
                label="Description"
                placeholder="Describe your flow"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-medium mb-6" style={{ color: '#464F5E' }}>
              Branding
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#464F5E' }}>
                  Primary Color
                </label>
                <ColorPicker selectedColor={primaryColor} onColorChange={setPrimaryColor} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#464F5E' }}>
                  Logo
                </label>
                <div className="mb-4">
                  <TabControl
                    options={[
                      { value: 'upload', label: 'Upload' },
                      { value: 'url', label: 'URL' }
                    ]}
                    value={logoUploadMode}
                    onChange={(value) => setLogoUploadMode(value as 'upload' | 'url')}
                  />
                </div>

                {logoUploadMode === 'upload' ? (
                  <FileUploader
                    value={logoUrl ? { name: 'Logo', size: 0, dataUrl: logoUrl } : undefined}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    maxSize={2}
                    showPreview={true}
                  />
                ) : (
                  <SystemField
                    type="url"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    label="Logo URL"
                    placeholder="https://example.com/logo.png"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium" style={{ color: '#464F5E' }}>
                  Prototype steps
                </h2>
                <p className="text-sm text-gray-600 mt-1">Add steps and configure the elements on each page of the GJM</p>
              </div>
              <div className="flex items-center gap-3">
                <SecondaryButton
                  onClick={() => setShowPrototypeTemplateModal(true)}
                  disabled={steps.length === 0}
                  size="sm"
                >
                  <Bookmark size={16} />
                  Save as template
                </SecondaryButton>
                <div className="relative">
              <TextButton
                    onClick={() => setShowAddStepDropdown(!showAddStepDropdown)}
                size="sm"
              >
                <Plus size={20} />
                Add step
                    <ChevronDown size={16} className="ml-1" />
              </TextButton>
                  {showAddStepDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowAddStepDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => {
                            addStep();
                            setShowAddStepDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                          style={{ color: '#464F5E' }}
                        >
                          Add new step
                        </button>
                        <button
                          onClick={() => {
                            addApplicationStep();
                            setShowAddStepDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                          style={{ color: '#464F5E' }}
                        >
                          Add application step
                        </button>
                        <button
                          onClick={() => {
                            setTemplateSelectorType('question');
                            setShowTemplateSelector(true);
                            setShowAddStepDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                          style={{ color: '#464F5E' }}
                        >
                          Add a template
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(() => {
                const regularSteps = steps.filter(s => !s.isApplicationStep);
                const applicationSteps = steps.filter(s => s.isApplicationStep);
                
                return (
                  <>
                    {/* Regular Steps */}
                    {regularSteps.map((step) => (
                      <div
                        key={step.id}
                        id={`step-${step.id}`}
                        className={`border rounded-lg transition-all border-gray-200 ${
                          draggedStepId === step.id ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleStepDragStart(e, step.id)}
                        onDragOver={handleStepDragOver}
                        onDrop={(e) => handleStepDrop(e, step.id)}
                        onDragEnd={handleStepDragEnd}
                      >
                        <div
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical 
                              size={16} 
                              className="text-gray-400 cursor-grab hover:text-gray-600" 
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                            <span className="font-medium" style={{ color: '#464F5E' }}>
                              {step.name}
                            </span>
                            {step.question && expandedStepId !== step.id && (
                              <span className="text-sm text-gray-500">- {step.question}</span>
                            )}
                          </div>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Save as template">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStepToSaveAsTemplate(step.id);
                            setShowQuestionTemplateModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Bookmark size={18} />
                        </button>
                      </Tooltip>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStep(step.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      {expandedStepId === step.id ? (
                        <ChevronUp size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </div>
                  </div>

                  {expandedStepId === step.id && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {/* Step name removed per requirements */}

                      <SystemField
                        type="text"
                        value={step.question}
                        onChange={(value) => updateStep(step.id, { question: value })}
                        label="Question"
                        placeholder="Enter your question"
                      />

                      <SystemField
                        type="text"
                        value={step.description}
                        onChange={(value) => updateStep(step.id, { description: value })}
                        label="Description"
                        placeholder="Enter description"
                      />

                      {!step.isApplicationStep && (
                        <div>
                          <Checkbox
                            id={`split-${step.id}`}
                            checked={step.splitScreenWithImage}
                            onChange={(e) => updateStep(step.id, { splitScreenWithImage: e.target.checked })}
                            label="Split screen with image"
                          />
                        </div>
                      )}

                      {!step.isApplicationStep && step.splitScreenWithImage && (
                        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                      <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                              Image position
                            </label>
                            <TabControl
                              options={[
                                { value: 'left', label: 'Left' },
                                { value: 'right', label: 'Right' }
                              ]}
                              value={step.imagePosition || 'right'}
                              onChange={(value) => updateStep(step.id, { imagePosition: value as 'left' | 'right' })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                              Image source
                            </label>
                            <div className="mb-3">
                              <TabControl
                                options={[
                                  { value: 'upload', label: 'Upload' },
                                  { value: 'url', label: 'URL' }
                                ]}
                                value={step.imageUploadMode || 'upload'}
                                onChange={(value) => updateStep(step.id, { imageUploadMode: value as 'upload' | 'url' })}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                              Image URL
                            </label>
                            {step.imageUploadMode !== 'upload' ? (
                              <SystemField
                                type="url"
                                value={step.imageUrl || ''}
                                onChange={(value) => updateStep(step.id, { imageUrl: value })}
                                placeholder="https://example.com/image.jpg"
                                showLabel={false}
                              />
                            ) : (
                              <FileUploader
                                value={step.imageUrl ? { name: 'Step image', size: 0, dataUrl: step.imageUrl } : undefined}
                                onChange={(file, fileInfo) => handleStepImageUpload(step.id, file, fileInfo)}
                                accept="image/*"
                                maxSize={5}
                                showPreview={true}
                              />
                            )}
                          </div>

                          <div>
                            <Checkbox
                              id={`imageTitle-${step.id}`}
                              checked={step.imageHasTitle}
                              onChange={(e) => updateStep(step.id, { imageHasTitle: e.target.checked })}
                              label="Image has title and subtitle"
                            />
                          </div>

                          {step.imageHasTitle && (
                          <div className="space-y-3 pl-6">
                              <div>
                                <SystemField
                                  type="text"
                                  value={step.imageTitle || ''}
                                  onChange={(value) => updateStep(step.id, { imageTitle: value })}
                                  label="Image title"
                                  placeholder="Enter image title"
                                />
                              </div>
                              <div>
                                <SystemField
                                  type="text"
                                  value={step.imageSubtitle || ''}
                                  onChange={(value) => updateStep(step.id, { imageSubtitle: value })}
                                  label="Image subtitle"
                                  placeholder="Enter image subtitle"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-medium" style={{ color: '#464F5E' }}>
                            Elements
                          </label>
                          <div className="relative">
                            <TextButton
                              onClick={() => setOpenElementMenuStepId(openElementMenuStepId === step.id ? null : step.id)}
                              size="sm"
                            >
                              <Plus size={16} />
                              Add element
                            </TextButton>
                            {openElementMenuStepId === step.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenElementMenuStepId(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                  {ELEMENT_TYPES.filter((type) => {
                                    // Exclude application_card from menu for all steps
                                    return type.type !== APPLICATION_CARD_TYPE;
                                  }).map((type) => {
                                    const isCardType = isCardElement(type.type);
                                    const isDisabled = isCardType && hasCardElement(step.id);
                                    
                                    return (
                                      <button
                                        key={type.type}
                                        onClick={() => {
                                          if (!isDisabled) {
                                            addElement(step.id, type.type);
                                            setOpenElementMenuStepId(null);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                          isDisabled 
                                            ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                            : 'hover:bg-gray-100'
                                        }`}
                                        style={isDisabled ? {} : { color: '#464F5E' }}
                                      >
                                        {type.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {step.elements.length > 0 ? (
                          <div className="space-y-2">
                            {step.elements.map((element) => (
                              <div
                                key={element.id}
                                id={`element-${element.id}`}
                                className="p-3 bg-gray-50 rounded-lg border transition-colors border-gray-200"
                              >
                                <div className="flex justify-between items-center">
                                  <span 
                                    className="font-medium text-base flex items-center" 
                                    style={{ color: '#464F5E' }}
                                  >
                                    {getElementLabel(element.type)}
                                  </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => deleteElement(step.id, element.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                </div>

                                {(element.type === 'text_field') && (
                                  <div className="mt-3 space-y-4">
                                    <ShowLabelToggle
                                      checked={!!element.config.hasLabel}
                                      onChange={(checked) =>
                                        updateElement(step.id, element.id, {
                                          config: { ...element.config, hasLabel: checked },
                                        })
                                      }
                                      primaryColor={primaryColor}
                                    />
                                    <div className="flex flex-col space-y-2">
                                      {element.config.hasLabel && (
                                        <EditorField
                                          value={element.config.label || ''}
                                          onChange={(value) =>
                                            updateElement(step.id, element.id, {
                                              config: { ...element.config, label: value },
                                            })
                                          }
                                          placeholder="Label"
                                        />
                                      )}
                                      <EditorField
                                        value={element.config.placeholder || ''}
                                        onChange={(value) =>
                                          updateElement(step.id, element.id, {
                                            config: { ...element.config, placeholder: value },
                                          })
                                        }
                                        placeholder="Placeholder"
                                      />
                                    </div>
                                  </div>
                                )}

                                {(element.type === 'dropdown') && (
                                  <div className="mt-3">
                                    <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                                      Placeholder
                                    </label>
                                    <EditorField
                                      value={element.config.placeholder || ''}
                                      onChange={(value) =>
                                        updateElement(step.id, element.id, {
                                          config: { ...element.config, placeholder: value },
                                        })
                                      }
                                      placeholder="ex. Select industry from dropdown..."
                                      className="w-full"
                                    />
                                  </div>
                                )}

                                {(element.type === 'dropdown') && (
                                  <CardEditor
                                    element={element}
                                    stepIndex={steps.findIndex(s => s.id === step.id)}
                                    onUpdateElement={(stepIndex, elementId, updates) => {
                                      const targetStep = steps[stepIndex];
                                      updateElement(targetStep.id, elementId, updates);
                                    }}
                                    primaryColor={primaryColor}
                                    showSelectionConfig={false}
                                  />
                                )}

                                {(element.type === 'calendar_field') && (
                                  <div className="mt-3 space-y-4">
                                    <ShowLabelToggle
                                      checked={!!element.config.hasLabel}
                                      onChange={(checked) =>
                                        updateElement(step.id, element.id, {
                                          config: { ...element.config, hasLabel: checked },
                                        })
                                      }
                                      primaryColor={primaryColor}
                                    />
                                    <div className="flex flex-col space-y-2">
                                      {element.config.hasLabel && (
                                        <SystemField
                                          type="text"
                                          value={element.config.label || ''}
                                          onChange={(value) =>
                                            updateElement(step.id, element.id, {
                                              config: { ...element.config, label: value },
                                            })
                                          }
                                          placeholder="Label"
                                          showLabel={false}
                                        />
                                      )}
                                      <SystemField
                                        type="text"
                                        value={element.config.placeholder || ''}
                                        onChange={(value) =>
                                          updateElement(step.id, element.id, {
                                            config: { ...element.config, placeholder: value },
                                          })
                                        }
                                        placeholder="Placeholder"
                                        showLabel={false}
                                      />
                                    </div>
                                  </div>
                                )}

                                {element.type === 'yes_no_cards' && (
                                  <CardEditor
                                    element={element}
                                    stepIndex={steps.findIndex(s => s.id === step.id)}
                                    onUpdateElement={(stepIndex, elementId, updates) => {
                                      const targetStep = steps[stepIndex];
                                      updateElement(targetStep.id, elementId, updates);
                                    }}
                                    primaryColor={primaryColor}
                                    showSelectionConfig={false}
                                    disableAddCard={true}
                                  />
                                )}

                                 {(element.type === 'simple_cards' || element.type === 'checkboxes' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards' || element.type === 'application_card') && (
                                   <CardEditor
                                     element={element}
                                     stepIndex={steps.findIndex(s => s.id === step.id)}
                                     onUpdateElement={(stepIndex, elementId, updates) => {
                                       const targetStep = steps[stepIndex];
                                       updateElement(targetStep.id, elementId, updates);
                                     }}
                                     primaryColor={primaryColor}
                                     showSelectionConfig={element.type === 'simple_cards' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards'}
                                   />
                                 )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No elements added yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                      ))}
                    
                    {/* Application Steps */}
                    {applicationSteps.map((step) => {
                      // System primary color (not branding color)
                      const systemPrimaryColor = '#4D3EE0';
                      
                      // Helper function to add opacity to color
                      const addOpacity = (color: string, opacity: number) => {
                        const hex = color.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                      };

                      // Helper function to darken color
                      const darkenColor = (color: string, percent: number) => {
                        const hex = color.replace('#', '');
                        const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) * (1 - percent / 100)));
                        const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) * (1 - percent / 100)));
                        const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) * (1 - percent / 100)));
                        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
                      };

                      return (
                        <div
                          key={step.id}
                          id={`step-${step.id}`}
                          className={`border-2 rounded-lg transition-all ${
                            draggedStepId === step.id ? 'opacity-20' : ''
                          }`}
                          style={{
                            borderColor: addOpacity(systemPrimaryColor, 0.1),
                            backgroundColor: addOpacity(systemPrimaryColor, 0.06),
                          }}
                          draggable={false}
                        >
                          <div
                            className="p-4 flex justify-between items-center cursor-pointer transition-colors"
                            style={{
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = addOpacity(systemPrimaryColor, 0.08);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: systemPrimaryColor }}
                              >
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                              <span 
                                className="font-medium"
                                style={{ color: darkenColor(systemPrimaryColor, 20) }}
                              >
                                {step.name}
                              </span>
                              {step.applicationStepHeading && expandedStepId !== step.id && (
                                <span 
                                  className="text-sm"
                                  style={{ color: darkenColor(systemPrimaryColor, 10) }}
                                >
                                  - {step.applicationStepHeading}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Tooltip content="Save as template">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStepToSaveAsTemplate(step.id);
                                    setShowApplicationStepTemplateModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <Bookmark size={18} />
                                </button>
                              </Tooltip>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteStep(step.id);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                              {expandedStepId === step.id ? (
                                <ChevronUp size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                              ) : (
                                <ChevronDown size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                              )}
                            </div>
                          </div>

                          {expandedStepId === step.id && (
                            <div 
                              className="p-4 border-t space-y-4 bg-white"
                              style={{ borderColor: addOpacity(systemPrimaryColor, 0.2) }}
                            >
                              <SystemField
                                type="text"
                                value={step.applicationStepHeading || ''}
                                onChange={(value) => updateStep(step.id, { applicationStepHeading: value })}
                                label="Heading"
                                placeholder="Enter heading"
                              />

                              <SystemField
                                type="text"
                                value={step.applicationStepSubheading || ''}
                                onChange={(value) => updateStep(step.id, { applicationStepSubheading: value })}
                                label="Subheading"
                                placeholder="Enter subheading"
                              />

                              <div className="pt-4">
                                {(() => {
                                  // Separate application cards from other elements (for application steps)
                                  const applicationCardElements = step.elements.filter(el => el.type === 'application_card');
                                  const otherElements = step.isApplicationStep 
                                    ? step.elements.filter(el => el.type !== 'application_card')
                                    : step.elements;
                                  
                                  return (
                                    <>
                                      {/* Application Cards Section (only for application steps) */}
                                      {step.isApplicationStep && (
                                        <div className="mb-6">
                                          <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-base font-semibold" style={{ color: '#464F5E' }}>
                                              Application cards configuration
                                            </h4>
                                          </div>
                                          {applicationCardElements.length > 0 ? (
                                            applicationCardElements.map((element) => (
                                              <div key={element.id} id={`element-${element.id}`} className="mb-4">
                                                <CardEditor
                                                  element={element}
                                                  stepIndex={steps.findIndex(s => s.id === step.id)}
                                                  onUpdateElement={(stepIndex, elementId, updates) => {
                                                    const targetStep = steps[stepIndex];
                                                    updateElement(targetStep.id, elementId, updates);
                                                  }}
                                                  primaryColor={primaryColor}
                                                  showSelectionConfig={false}
                                                  disableAddCard={false}
                                                />
                                              </div>
                                            ))
                                          ) : (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                              <p className="text-sm text-gray-500 text-center mb-3">No cards added yet</p>
                                              <div className="flex justify-center">
                                                <TextButton
                                                  onClick={() => {
                                                    if (!hasCardElement(step.id)) {
                                                      addElement(step.id, APPLICATION_CARD_TYPE);
                                                    }
                                                  }}
                                                  size="sm"
                                                  disabled={hasCardElement(step.id)}
                                                >
                                                  <Plus size={16} />
                                                  Add card
                                                </TextButton>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Regular Elements Section */}
                                      {otherElements.length > 0 && (
                                      <>
                                          <div className="flex justify-between items-center mb-3">
                                            <label className="block text-sm font-medium" style={{ color: '#464F5E' }}>
                                              {step.isApplicationStep ? 'Elements' : 'Cards'}
                                            </label>
                                            {!step.isApplicationStep && (
                                              <div className="relative">
                                        <TextButton
                                          onClick={() => setOpenElementMenuStepId(openElementMenuStepId === step.id ? null : step.id)}
                                          size="sm"
                                        >
                                          <Plus size={16} />
                                          Add card
                                        </TextButton>
                                        {openElementMenuStepId === step.id && (
                                          <>
                                            <div
                                              className="fixed inset-0 z-10"
                                              onClick={() => setOpenElementMenuStepId(null)}
                                            />
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                              {ELEMENT_TYPES.filter(type => 
                                                isCardElement(type.type) && type.type !== APPLICATION_CARD_TYPE
                                              ).map((type) => {
                                                const isDisabled = hasCardElement(step.id);
                                                
                                                return (
                                                  <button
                                                    key={type.type}
                                                    onClick={() => {
                                                      if (!isDisabled) {
                                                        addElement(step.id, type.type);
                                                        setOpenElementMenuStepId(null);
                                                      }
                                                    }}
                                                    disabled={isDisabled}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                      isDisabled 
                                                        ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                                        : 'hover:bg-gray-100'
                                                    }`}
                                                    style={isDisabled ? {} : { color: '#464F5E' }}
                                                  >
                                                    {type.label}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </>
                                        )}
                                              </div>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                            {otherElements.map((element) => (
                                      <div
                                        key={element.id}
                                        id={`element-${element.id}`}
                                        className="p-3 bg-gray-50 rounded-lg border transition-colors border-gray-200"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span 
                                            className="font-medium text-base flex items-center" 
                                            style={{ color: '#464F5E' }}
                                          >
                                            {getElementLabel(element.type)}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => deleteElement(step.id, element.id)}
                                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </div>

                                                {(element.type === 'simple_cards' || element.type === 'checkboxes' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards') && (
                                          <CardEditor
                                            element={element}
                                            stepIndex={steps.findIndex(s => s.id === step.id)}
                                            onUpdateElement={(stepIndex, elementId, updates) => {
                                              const targetStep = steps[stepIndex];
                                              updateElement(targetStep.id, elementId, updates);
                                            }}
                                            primaryColor={primaryColor}
                                            showSelectionConfig={element.type === 'simple_cards' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards'}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                        </>
                                )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}

              {steps.length === 0 && (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No steps added yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <SecondaryButton
                onClick={handleReset}
                icon={<RotateCcw size={18} />}
              >
                Reset
              </SecondaryButton>
              <SecondaryButton
                onClick={onCancel}
              >
                Cancel
              </SecondaryButton>
            </div>
            <PrimaryButton
              onClick={handleSave}
              disabled={!canSave}
            >
              <Save size={18} />
              {editingPrototype ? 'Save Changes' : 'Create Prototype'}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Template Modals */}
      <TemplateNameModal
        isOpen={showQuestionTemplateModal}
        onClose={() => {
          setShowQuestionTemplateModal(false);
          setStepToSaveAsTemplate(null);
        }}
        onSave={handleSaveQuestionTemplate}
        title="Save Question Template"
        placeholder="Enter template name"
      />

      <TemplateNameModal
        isOpen={showPrototypeTemplateModal}
        onClose={() => setShowPrototypeTemplateModal(false)}
        onSave={handleSavePrototypeTemplate}
        title="Save Prototype Template"
        placeholder="Enter template name"
      />

      <TemplateNameModal
        isOpen={showApplicationStepTemplateModal}
        onClose={() => {
          setShowApplicationStepTemplateModal(false);
          setStepToSaveAsTemplate(null);
        }}
        onSave={handleSaveApplicationStepTemplate}
        title="Save Application Template"
        placeholder="Enter template name"
      />

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={templateSelectorType === 'prototype' ? handleSelectPrototypeTemplate : handleSelectQuestionTemplate}
        questionTemplates={questionTemplates}
        prototypeTemplates={prototypeTemplates}
        applicationStepTemplates={applicationStepTemplates}
        type={templateSelectorType}
      />
    </div>
  );
}
