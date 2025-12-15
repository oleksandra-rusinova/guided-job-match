import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Step, Element, ElementType } from '../types';
import { ELEMENT_TYPES, getElementLabel } from '../utils/elementTypes';
import { useModal } from '../contexts/ModalContext';
import SystemField from './SystemField';
import ShowLabelToggle from './ShowLabelToggle';
import CardEditor from './CardEditor';
import PrimaryButton from './PrimaryButton';
import TextButton from './TextButton';
import Checkbox from './Checkbox';
import TabControl from './TabControl';
import FileUploader from './FileUploader';
import EditorField from './EditorField';
import Tooltip from './Tooltip';
import TemplatePreview from './TemplatePreview';

interface TemplateEditorProps {
  templateName: string;
  steps: Step[];
  onSave: (name: string, steps: Step[]) => void;
  onCancel: () => void;
  primaryColor?: string;
  isQuestionTemplate?: boolean;
  isApplicationStepTemplate?: boolean;
  logoUrl?: string;
}

export default function TemplateEditor({
  templateName: initialName,
  steps: initialSteps,
  onSave,
  onCancel: _onCancel,
  primaryColor = '#4D3EE0',
  isQuestionTemplate = false,
  isApplicationStepTemplate = false,
  logoUrl,
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [openElementMenuStepId, setOpenElementMenuStepId] = useState<string | null>(null);
  const [newlyAddedElementId, setNewlyAddedElementId] = useState<string | null>(null);
  const [newlyAddedStepId, setNewlyAddedStepId] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dropTargetStepId, setDropTargetStepId] = useState<string | null>(null);
  const [dropTargetStepPosition, setDropTargetStepPosition] = useState<'above' | 'below' | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const savedStateRef = useRef<{ name: string; steps: Step[] }>({ name: initialName, steps: initialSteps });
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const { confirm } = useModal();

  useEffect(() => {
    setName(initialName);
    setSteps(initialSteps);
    // Normalize the saved state the same way we normalize on save to ensure consistent comparison
    savedStateRef.current = { 
      name: initialName, 
      steps: JSON.parse(JSON.stringify(initialSteps)) 
    };
    // Reset scroll position to top when template changes
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [initialName, initialSteps]);

  // Deep equality function for comparing configs
  // Normalizes objects by removing undefined values to handle serialization inconsistencies
  const deepEqualConfig = (a: any, b: any): boolean => {
    // Handle primitive values and null/undefined
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    
    // Handle arrays (like options in card configs)
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      
      // If array items have 'id' property, compare by ID to handle reordering
      if (a.length > 0 && typeof a[0] === 'object' && a[0] !== null && 'id' in a[0]) {
        const mapA = new Map(a.map((item: any) => [item.id, item]));
        const mapB = new Map(b.map((item: any) => [item.id, item]));
        
        if (mapA.size !== mapB.size) return false;
        
        for (const [id, itemA] of mapA) {
          const itemB = mapB.get(id);
          if (!itemB || !deepEqualConfig(itemA, itemB)) return false;
        }
        return true;
      }
      
      // Otherwise compare by index
      for (let i = 0; i < a.length; i++) {
        if (!deepEqualConfig(a[i], b[i])) return false;
      }
      return true;
    }
    
    // If one is array and other isn't
    if (Array.isArray(a) || Array.isArray(b)) return false;
    
    // Handle objects
    if (typeof a === 'object' && typeof b === 'object') {
      // Get all keys from both objects, filtering out undefined values
      const allKeys = new Set([
        ...Object.keys(a).filter(k => a[k] !== undefined),
        ...Object.keys(b).filter(k => b[k] !== undefined)
      ]);
      
      for (const key of allKeys) {
        const valA = a[key];
        const valB = b[key];
        
        // If both are undefined, they're equal (normalized)
        if (valA === undefined && valB === undefined) continue;
        
        // If one is undefined and other isn't, they're different
        if (valA === undefined || valB === undefined) return false;
        
        // Recursively compare values
        if (!deepEqualConfig(valA, valB)) return false;
      }
      
      return true;
    }
    
    // Handle primitives
    return a === b;
  };

  const hasChanges = useMemo(() => {
    if (name !== savedStateRef.current.name) return true;
    if (steps.length !== savedStateRef.current.steps.length) return true;
    
    // Deep compare steps
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const savedStep = savedStateRef.current.steps[i];
      if (!savedStep) return true;
      
      if (currentStep.name !== savedStep.name ||
          currentStep.question !== savedStep.question ||
          currentStep.description !== savedStep.description ||
          currentStep.splitScreenWithImage !== savedStep.splitScreenWithImage ||
          currentStep.imageUrl !== savedStep.imageUrl ||
          currentStep.imageUploadMode !== savedStep.imageUploadMode ||
          currentStep.imagePosition !== savedStep.imagePosition ||
          currentStep.imageHasTitle !== savedStep.imageHasTitle ||
          currentStep.imageTitle !== savedStep.imageTitle ||
          currentStep.imageSubtitle !== savedStep.imageSubtitle ||
          currentStep.isApplicationStep !== savedStep.isApplicationStep ||
          (currentStep.applicationStepHeading || '') !== (savedStep.applicationStepHeading || '') ||
          (currentStep.applicationStepSubheading || '') !== (savedStep.applicationStepSubheading || '') ||
          currentStep.elements.length !== savedStep.elements.length) {
        return true;
      }
      
      // Compare elements - match by ID to handle reordering
      const currentElementMap = new Map(currentStep.elements.map(el => [el.id, el]));
      const savedElementMap = new Map(savedStep.elements.map(el => [el.id, el]));
      
      // Check if all current elements exist in saved state
      for (const [id, currentElement] of currentElementMap) {
        const savedElement = savedElementMap.get(id);
        if (!savedElement) return true; // Element was added
        if (currentElement.type !== savedElement.type ||
            !deepEqualConfig(currentElement.config, savedElement.config)) {
          return true; // Element changed
        }
      }
      
      // Check if any saved elements were removed
      if (currentElementMap.size !== savedElementMap.size) return true;
    }
    
    return false;
  }, [name, steps]);

  const handleStepImageUpload = (stepId: string, _file: File | null, fileInfo: any) => {
    updateStep(stepId, { imageUrl: fileInfo?.dataUrl || '' });
  };

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(steps.map(step => step.id === stepId ? { ...step, ...updates } : step));
  };

  const deleteStep = async (stepId: string) => {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this step?',
    });
    if (confirmed) {
      setSteps(steps.filter(step => step.id !== stepId));
      if (expandedStepId === stepId) {
        setExpandedStepId(null);
      }
    }
  };

  const handleStepDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStepDragOver = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedStepId || draggedStepId === stepId) {
      setDropTargetStepId(null);
      setDropTargetStepPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseY = e.clientY;
    const elementCenterY = rect.top + rect.height / 2;
    
    setDropTargetStepId(stepId);
    setDropTargetStepPosition(mouseY < elementCenterY ? 'above' : 'below');
  };

  const handleStepDrop = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedStepId || draggedStepId === targetStepId) {
      setDropTargetStepId(null);
      setDropTargetStepPosition(null);
      return;
    }

    const draggedIndex = steps.findIndex(step => step.id === draggedStepId);
    const targetIndex = steps.findIndex(step => step.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDropTargetStepId(null);
      setDropTargetStepPosition(null);
      return;
    }

    // If dropTargetStepPosition is not set, determine it from mouse position
    let position = dropTargetStepPosition;
    if (!position) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseY = e.clientY;
      const elementCenterY = rect.top + rect.height / 2;
      position = mouseY < elementCenterY ? 'above' : 'below';
    }

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    
    // After removing the dragged item, recalculate the target index
    // because indices shift when an item is removed before the target
    let adjustedTargetIndex = targetIndex;
    if (draggedIndex < targetIndex) {
      // If we removed an item before the target, the target index decreases by 1
      adjustedTargetIndex = targetIndex - 1;
    }
    
    // Calculate the correct insertion index based on drop position
    let insertIndex = adjustedTargetIndex;
    if (position === 'below') {
      // If dropping below, insert after the target
      insertIndex = adjustedTargetIndex + 1;
    } else if (position === 'above') {
      // If dropping above, insert at the target position
      insertIndex = adjustedTargetIndex;
    }
    
    // Ensure insertIndex is within bounds
    insertIndex = Math.max(0, Math.min(insertIndex, newSteps.length));
    
    newSteps.splice(insertIndex, 0, draggedStep);

    setSteps(newSteps);
    setDraggedStepId(null);
    setDropTargetStepId(null);
    setDropTargetStepPosition(null);
  };

  const handleStepDragEnd = () => {
    setDraggedStepId(null);
    setDropTargetStepId(null);
    setDropTargetStepPosition(null);
  };

  const CARD_ELEMENT_TYPES: ElementType[] = ['simple_cards', 'image_cards', 'advanced_cards', 'image_only_card', 'yes_no_cards'];
  const APPLICATION_CARD_TYPE: ElementType = 'application_card';

  const hasCardElement = (stepId: string): boolean => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;
    if (step.isApplicationStep || isApplicationStepTemplate) {
      return step.elements.some(el => el.type === APPLICATION_CARD_TYPE);
    }
    return step.elements.some(el => CARD_ELEMENT_TYPES.includes(el.type));
  };

  const isCardElement = (type: ElementType): boolean => {
    return CARD_ELEMENT_TYPES.includes(type) || type === APPLICATION_CARD_TYPE;
  };

  const addElement = (stepId: string, type: ElementType) => {
    // For application step templates, only allow application_card
    const step = steps.find(s => s.id === stepId);
    if (isApplicationStepTemplate && step && (step.isApplicationStep || isApplicationStepTemplate)) {
      if (type !== APPLICATION_CARD_TYPE) {
        return; // Don't allow adding non-application-card elements to application steps
      }
    }
    
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
    
    setNewlyAddedElementId(newElement.id);
  };

  useEffect(() => {
    if (newlyAddedElementId) {
      const element = document.getElementById(`element-${newlyAddedElementId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          setNewlyAddedElementId(null);
        }, 100);
      }
    }
  }, [newlyAddedElementId]);

  useEffect(() => {
    if (newlyAddedStepId) {
      const stepElement = document.getElementById(`step-${newlyAddedStepId}`);
      if (stepElement) {
        setTimeout(() => {
          stepElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          setExpandedStepId(newlyAddedStepId);
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
        return {
          options: [
            { id: '1', title: 'Option 1' },
            { id: '2', title: 'Option 2' },
          ],
          selectionType: 'multiple' as 'single' | 'multiple',
          maxSelection: 2,
        };
      case 'checkboxes':
        return {
          options: [
            { id: '1', title: 'Option 1' },
          ],
          selectionType: 'multiple' as 'single' | 'multiple',
          maxSelection: 1,
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
          label: '',
          hasLabel: false,
          placeholder: 'Select an option',
          options: [
            { id: '1', title: 'Option 1' },
            { id: '2', title: 'Option 2' },
          ],
          selectionType: 'single' as 'single' | 'multiple',
          maxSelection: 1,
        };
      case 'calendar_field':
        return {
          label: '',
          hasLabel: true,
          placeholder: '',
        };
      case 'yes_no_cards':
        return {
          yesText: 'Yes',
          noText: 'No',
        };
      case 'application_card':
        return {
          options: [
            { 
              id: '1', 
              jobTitle: '',
              location: '',
              department: '',
              jobType: '',
              jobId: '',
              jobDescription: ''
            },
          ],
          selectionType: 'single' as 'single' | 'multiple',
          maxSelection: 1,
        };
      default:
        return {};
    }
  };

  const deleteElement = async (stepId: string, elementId: string) => {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this element?',
    });
    if (confirmed) {
      setSteps(steps.map(step =>
        step.id === stepId
          ? { ...step, elements: step.elements.filter(el => el.id !== elementId) }
          : step
      ));
    }
  };

  const updateElement = (stepId: string, elementId: string, updates: Partial<Element>) => {
    setSteps(steps.map(step =>
      step.id === stepId
        ? {
            ...step,
            elements: step.elements.map(el => {
              if (el.id === elementId) {
                // Properly merge config updates to avoid overwriting other config properties
                if (updates.config && el.config) {
                  return { ...el, ...updates, config: { ...el.config, ...updates.config } };
                }
                return { ...el, ...updates };
              }
              return el;
            }),
          }
        : step
    ));
  };

  const addStep = () => {
    // Don't allow adding steps for question templates
    if (isQuestionTemplate) return;
    
    const newStep: Step = {
      id: crypto.randomUUID(),
      name: `Step ${steps.length + 1}`,
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
    };
    setSteps([...steps, newStep]);
    setNewlyAddedStepId(newStep.id);
  };

  const handleSave = () => {
    onSave(name, steps);
    savedStateRef.current = { name, steps: JSON.parse(JSON.stringify(steps)) };
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed top-[140px] left-80 right-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-30">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#464F5E' }}>
            {name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <TabControl
            options={[
              { value: 'edit', label: 'Edit' },
              { value: 'preview', label: 'Preview' }
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'edit' | 'preview')}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={contentScrollRef} 
        className="flex-1 overflow-y-auto min-h-0"
        style={{ 
          paddingTop: '73px', // Space for fixed header
          paddingBottom: activeTab === 'edit' ? '73px' : '0', // Space for fixed footer (only in edit mode)
        }}
      >
        {activeTab === 'preview' ? (
          <TemplatePreview
            steps={steps}
            primaryColor={primaryColor}
            isQuestionTemplate={isQuestionTemplate}
            isApplicationStepTemplate={isApplicationStepTemplate}
            templateName={name}
            logoUrl={logoUrl}
          />
        ) : (
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Steps */}
          <div>
            {isQuestionTemplate || isApplicationStepTemplate ? (
              // Question template or Application step template: render fields directly without step block
              steps.length > 0 ? (
                <div className="space-y-4">
                  {steps.map((step) => (
                    <div key={step.id} id={`step-${step.id}`} className="space-y-4">
                      {isApplicationStepTemplate ? (
                        <>
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
                        </>
                      ) : (
                        <>
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
                        </>
                      )}

                      {!isApplicationStepTemplate && (
                        <>
                          <div>
                            <Checkbox
                              id={`split-${step.id}`}
                              checked={step.splitScreenWithImage}
                              onChange={(e) => updateStep(step.id, { splitScreenWithImage: e.target.checked })}
                              label="Split screen with image"
                            />
                          </div>

                          {step.splitScreenWithImage && (
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
                        </>
                      )}

                      <div className="pt-4">
                        {(() => {
                          // Separate application cards from other elements (for application steps)
                          const isAppStep = step.isApplicationStep || isApplicationStepTemplate;
                          const applicationCardElements = step.elements.filter(el => el.type === 'application_card');
                          const otherElements = isAppStep 
                            ? step.elements.filter(el => el.type !== 'application_card')
                            : step.elements;
                          
                          return (
                            <>
                              {/* Application Cards Section (only for application steps) */}
                              {isAppStep && (
                                <div className="mb-6">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-base font-medium" style={{ color: '#464F5E' }}>
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

                              {/* Regular Elements Section - Only show for non-application step templates */}
                              {!isApplicationStepTemplate && (
                                <>
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
                                  {otherElements.length > 0 ? (
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
                                      onClick={async () => await deleteElement(step.id, element.id)}
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
                                      <div>
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
                                    </div>
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
                                    showSelectionConfig={true}
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
                                  <div className="mt-3 space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                                        Yes Text
                                      </label>
                                      <EditorField
                                        value={element.config.yesText || 'Yes'}
                                        onChange={(value) =>
                                          updateElement(step.id, element.id, {
                                            config: { ...element.config, yesText: value },
                                          })
                                        }
                                        placeholder="Yes"
                                        className="w-full"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                                        No Text
                                      </label>
                                      <EditorField
                                        value={element.config.noText || 'No'}
                                        onChange={(value) =>
                                          updateElement(step.id, element.id, {
                                            config: { ...element.config, noText: value },
                                          })
                                        }
                                        placeholder="No"
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                )}

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
                                  ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No elements added yet</p>
                                  )}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            ) : (
              // Prototype template: render with step blocks
              <>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-lg font-medium" style={{ color: '#464F5E' }}>
                      Prototype steps
                    </h2>
                  </div>
                  <TextButton onClick={addStep} size="sm">
                    <Plus size={20} />
                    Add step
                  </TextButton>
                </div>

                <div className="space-y-2">
                  {steps.map((step, index) => {
                    // Check if this is an application step
                    const isAppStep = step.isApplicationStep;
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
                      <React.Fragment key={step.id}>
                        {/* Drop indicator line above */}
                        {dropTargetStepId === step.id && dropTargetStepPosition === 'above' && draggedStepId && draggedStepId !== step.id && (
                          <div 
                            className="h-0.5 my-1 transition-all pointer-events-none"
                            style={{ backgroundColor: '#4D3EE0' }}
                          />
                        )}
                        <div
                          id={`step-${step.id}`}
                          className={`${isAppStep ? 'border-2' : 'border'} rounded-lg transition-all ${
                            draggedStepId === step.id 
                              ? (isAppStep ? 'opacity-20 shadow-lg scale-105' : 'opacity-50 shadow-lg scale-105 border-blue-400')
                              : ''
                          }`}
                          style={isAppStep ? {
                            borderColor: draggedStepId === step.id 
                              ? addOpacity(systemPrimaryColor, 0.4)
                              : addOpacity(systemPrimaryColor, 0.1),
                            backgroundColor: addOpacity(systemPrimaryColor, 0.06),
                            borderRadius: draggedStepId === step.id ? '0.5rem' : undefined,
                          } : {
                            borderColor: draggedStepId === step.id ? '#60A5FA' : '#E5E7EB',
                            borderRadius: draggedStepId === step.id ? '0.5rem' : undefined,
                          }}
                          draggable={false}
                          onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDragOver={!isQuestionTemplate ? (e) => handleStepDragOver(e, step.id) : undefined}
                          onDrop={!isQuestionTemplate ? (e) => handleStepDrop(e, step.id) : undefined}
                        >
                        <div
                          className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${
                            !isAppStep ? 'hover:bg-gray-50 rounded-t-lg' : 'rounded-t-lg'
                          } ${
                            expandedStepId !== step.id ? 'rounded-b-lg' : ''
                          }`}
                          style={isAppStep ? {
                            backgroundColor: 'transparent',
                          } : {}}
                          onMouseEnter={isAppStep ? (e) => {
                            e.currentTarget.style.backgroundColor = addOpacity(systemPrimaryColor, 0.08);
                            const borderRadius = expandedStepId === step.id 
                              ? '0.5rem 0.5rem 0 0' 
                              : '0.5rem';
                            e.currentTarget.style.borderRadius = borderRadius;
                          } : undefined}
                          onMouseLeave={isAppStep ? (e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            const borderRadius = expandedStepId === step.id 
                              ? '0.5rem 0.5rem 0 0' 
                              : '0.5rem';
                            e.currentTarget.style.borderRadius = borderRadius;
                          } : undefined}
                          onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                        >
                          <div className="flex items-center gap-3">
                            {!isQuestionTemplate && !isAppStep && (
                              <span
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleStepDragStart(e, step.id);
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation();
                                  handleStepDragEnd();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="inline-flex cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical 
                                  size={16} 
                                  className="text-gray-400 hover:text-gray-600 pointer-events-none" 
                                />
                              </span>
                            )}
                            {isAppStep && (
                              <div 
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: systemPrimaryColor }}
                              >
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                            )}
                            <span 
                              className="font-medium"
                              style={{ color: isAppStep ? darkenColor(systemPrimaryColor, 20) : '#464F5E' }}
                            >
                              {step.name}
                            </span>
                            {isAppStep && step.applicationStepHeading && expandedStepId !== step.id && (
                              <span 
                                className="text-sm"
                                style={{ color: darkenColor(systemPrimaryColor, 10) }}
                              >
                                - {step.applicationStepHeading}
                              </span>
                            )}
                            {!isAppStep && step.question && expandedStepId !== step.id && (
                              <>
                                <span className="text-sm text-gray-500">- {step.question}</span>
                                {step.elements && step.elements.length > 0 && (
                                  <span className="px-2 py-0.5 text-xs font-normal rounded bg-gray-100 text-gray-700 font-['Poppins']">
                                    {getElementLabel(step.elements[0].type)}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteStep(step.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            {expandedStepId === step.id ? (
                              <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={20} className="text-gray-400" />
                            )}
                          </div>
                        </div>

                        {expandedStepId === step.id && (
                          <div 
                            className={`p-4 border-t space-y-4 ${isAppStep ? 'bg-white rounded-b-lg' : ''}`}
                            style={isAppStep ? { borderColor: addOpacity(systemPrimaryColor, 0.2) } : {}}
                          >
                          {isAppStep ? (
                            <>
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
                            </>
                          ) : (
                            <>
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
                            </>
                          )}

                          {!isAppStep && (
                            <>
                              <div>
                                <Checkbox
                                  id={`split-${step.id}`}
                                  checked={step.splitScreenWithImage}
                                  onChange={(e) => updateStep(step.id, { splitScreenWithImage: e.target.checked })}
                                  label="Split screen with image"
                                />
                              </div>

                              {step.splitScreenWithImage && (
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
                            </>
                          )}

                          <div className="pt-4">
                            {(() => {
                              // Separate application cards from other elements (for application steps)
                              const isAppStep = step.isApplicationStep || isApplicationStepTemplate;
                              const applicationCardElements = step.elements.filter(el => el.type === 'application_card');
                              const otherElements = isAppStep 
                                ? step.elements.filter(el => el.type !== 'application_card')
                                : step.elements;
                              
                              return (
                                <>
                                  {/* Application Cards Section (only for application steps) */}
                                  {isAppStep && (
                                    <div className="mb-6">
                                      <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-base font-medium" style={{ color: '#464F5E' }}>
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
                                                      : 'hover:bg-gray-50'
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

                                  {otherElements.length > 0 ? (
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
                                          onClick={async () => await deleteElement(step.id, element.id)}
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
                                      <div className="mt-3 space-y-2">
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
                                          <div>
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
                                        </div>
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
                                        showSelectionConfig={true}
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
                                      <div className="mt-3 space-y-3">
                                        <div>
                                          <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                                            Yes Text
                                          </label>
                                          <EditorField
                                            value={element.config.yesText || 'Yes'}
                                            onChange={(value) =>
                                              updateElement(step.id, element.id, {
                                                config: { ...element.config, yesText: value },
                                              })
                                            }
                                            placeholder="Yes"
                                            className="w-full"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                                            No Text
                                          </label>
                                          <EditorField
                                            value={element.config.noText || 'No'}
                                            onChange={(value) =>
                                              updateElement(step.id, element.id, {
                                                config: { ...element.config, noText: value },
                                              })
                                            }
                                            placeholder="No"
                                            className="w-full"
                                          />
                                        </div>
                                      </div>
                                    )}

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
                                  ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No elements added yet</p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                        {/* Drop indicator line below */}
                        {dropTargetStepId === step.id && dropTargetStepPosition === 'below' && draggedStepId && draggedStepId !== step.id && (
                          <div 
                            className="h-0.5 my-1 transition-all pointer-events-none"
                            style={{ backgroundColor: '#4D3EE0' }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {steps.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No steps added yet</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Fixed Footer */}
      {activeTab === 'edit' && (
        <div className="fixed bottom-0 left-80 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end shadow-lg z-30">
          <Tooltip content="No changes to save" disabled={hasChanges}>
            <PrimaryButton 
              onClick={handleSave} 
              disabled={!hasChanges}
            >
              <Save size={18} />
              Save
            </PrimaryButton>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

