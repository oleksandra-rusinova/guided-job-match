import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Step, Element, ElementType } from '../types';
import { ELEMENT_TYPES, getElementLabel } from '../utils/elementTypes';
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

interface TemplateEditorProps {
  templateName: string;
  steps: Step[];
  onSave: (name: string, steps: Step[]) => void;
  onCancel: () => void;
  primaryColor?: string;
  isQuestionTemplate?: boolean;
}

export default function TemplateEditor({
  templateName: initialName,
  steps: initialSteps,
  onSave,
  onCancel: _onCancel,
  primaryColor = '#4D3EE0',
  isQuestionTemplate = false,
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [openElementMenuStepId, setOpenElementMenuStepId] = useState<string | null>(null);
  const [newlyAddedElementId, setNewlyAddedElementId] = useState<string | null>(null);
  const [newlyAddedStepId, setNewlyAddedStepId] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const savedStateRef = useRef<{ name: string; steps: Step[] }>({ name: initialName, steps: initialSteps });

  useEffect(() => {
    setName(initialName);
    setSteps(initialSteps);
    savedStateRef.current = { name: initialName, steps: initialSteps };
  }, [initialName, initialSteps]);

  const hasChanges = useMemo(() => {
    if (name !== savedStateRef.current.name) return true;
    if (steps.length !== savedStateRef.current.steps.length) return true;
    
    // Deep compare steps
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const savedStep = savedStateRef.current.steps[i];
      if (!savedStep) return true;
      
      if (currentStep.question !== savedStep.question ||
          currentStep.description !== savedStep.description ||
          currentStep.splitScreenWithImage !== savedStep.splitScreenWithImage ||
          currentStep.imageUrl !== savedStep.imageUrl ||
          currentStep.imageUploadMode !== savedStep.imageUploadMode ||
          currentStep.imagePosition !== savedStep.imagePosition ||
          currentStep.imageHasTitle !== savedStep.imageHasTitle ||
          currentStep.imageTitle !== savedStep.imageTitle ||
          currentStep.imageSubtitle !== savedStep.imageSubtitle ||
          currentStep.elements.length !== savedStep.elements.length) {
        return true;
      }
      
      // Compare elements
      for (let j = 0; j < currentStep.elements.length; j++) {
        const currentElement = currentStep.elements[j];
        const savedElement = savedStep.elements[j];
        if (!savedElement) return true;
        if (currentElement.type !== savedElement.type ||
            JSON.stringify(currentElement.config) !== JSON.stringify(savedElement.config)) {
          return true;
        }
      }
    }
    
    return false;
  }, [name, steps]);

  const handleStepImageUpload = (stepId: string, _file: File | null, fileInfo: any) => {
    updateStep(stepId, { imageUrl: fileInfo?.dataUrl || '' });
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

    const draggedIndex = steps.findIndex(step => step.id === draggedStepId);
    const targetIndex = steps.findIndex(step => step.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    setSteps(newSteps);
    setDraggedStepId(null);
  };

  const handleStepDragEnd = () => {
    setDraggedStepId(null);
  };

  const CARD_ELEMENT_TYPES: ElementType[] = ['simple_cards', 'image_cards', 'advanced_cards', 'image_only_card', 'yes_no_cards'];

  const hasCardElement = (stepId: string): boolean => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;
    return step.elements.some(el => CARD_ELEMENT_TYPES.includes(el.type));
  };

  const isCardElement = (type: ElementType): boolean => {
    return CARD_ELEMENT_TYPES.includes(type);
  };

  const addElement = (stepId: string, type: ElementType) => {
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
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#464F5E' }}>
            {name}
          </h2>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Template Name */}
          <div>
            <SystemField
              type="text"
              value={name}
              onChange={setName}
              label="Template Name"
              placeholder="Enter template name"
            />
            <p className="text-xs text-gray-500 mt-1">
              A unique component name will be automatically generated based on this name.
            </p>
          </div>

          {/* Steps */}
          <div>
            {isQuestionTemplate ? (
              // Question template: render fields directly without step block
              steps.length > 0 ? (
                <div className="space-y-4">
                  {steps.map((step) => (
                    <div key={step.id} id={`step-${step.id}`} className="space-y-4">
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
                                  {ELEMENT_TYPES.map((type) => {
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
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      id={`step-${step.id}`}
                      className={`border rounded-lg transition-all border-gray-200 ${
                        draggedStepId === step.id ? 'opacity-50' : ''
                      }`}
                      draggable={!isQuestionTemplate}
                      onDragStart={!isQuestionTemplate ? (e) => handleStepDragStart(e, step.id) : undefined}
                      onDragOver={!isQuestionTemplate ? handleStepDragOver : undefined}
                      onDrop={!isQuestionTemplate ? (e) => handleStepDrop(e, step.id) : undefined}
                      onDragEnd={!isQuestionTemplate ? handleStepDragEnd : undefined}
                    >
                      <div
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                      >
                        <div className="flex items-center gap-3">
                          {!isQuestionTemplate && (
                            <GripVertical 
                              size={16} 
                              className="text-gray-400 cursor-grab hover:text-gray-600" 
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          )}
                          <span className="font-medium" style={{ color: '#464F5E' }}>
                            {step.name}
                          </span>
                          {step.question && expandedStepId !== step.id && (
                            <span className="text-sm text-gray-500">- {step.question}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
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
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedStepId === step.id && (
                        <div className="p-4 border-t border-gray-200 space-y-4">
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
                                      {ELEMENT_TYPES.map((type) => {
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
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

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
      </div>
    </div>
  );
}

