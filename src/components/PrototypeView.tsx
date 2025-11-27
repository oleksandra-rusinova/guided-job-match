import { useState, useMemo, useEffect } from 'react';
import { X, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Prototype, Step, Element, ElementType } from '../types';
import { savePrototype } from '../utils/storage';
import { useRealtimePrototype } from '../hooks/useRealtimePrototype';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';
import { getElementLabel, ELEMENT_TYPES } from '../utils/elementTypes';
import PrimaryButton from './PrimaryButton';
import TextButton from './TextButton';
import TextField from './TextField';
import DropdownField from './DropdownField';
import CalendarField from './CalendarField';
import ShowLabelToggle from './ShowLabelToggle';
import EditorField from './EditorField';
import SystemField from './SystemField';
import SimpleCard from './widgets/SimpleCard';
import ImageCard from './widgets/ImageCard';
import ImageOnlyCard from './widgets/ImageOnlyCard';
import AdvancedCard from './widgets/AdvancedCard';
import YesNoCards from './widgets/YesNoCards';
import ApplicationCard from './widgets/ApplicationCard';
import CardEditor from './CardEditor';
import Footer from './Footer';
import PrototypeHeader from './PrototypeHeader';
import PresenceIndicator from './PresenceIndicator';
import Checkbox from './Checkbox';
import TabControl from './TabControl';
import FileUploader from './FileUploader';

interface PrototypeViewProps {
  prototypeId: string;
  onExit: () => void;
  onEdit: () => void;
}

export default function PrototypeView({ prototypeId, onExit }: PrototypeViewProps) {
  // Generate a user ID for this session (in a real app, this would come from auth)
  const userId = `user-${localStorage.getItem('userId') || crypto.randomUUID()}`;
  const userName = localStorage.getItem('userName') || `User ${userId.slice(-4)}`;

  // Use Realtime hook to get prototype and listen for changes
  const { prototype, isConnected, presenceUsers, setEditing, updatePrototypeInState } = useRealtimePrototype(prototypeId, userId, userName);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [stepsState, setStepsState] = useState<Step[]>(prototype?.steps || []);
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>({});
  const [openElementMenuStepId, setOpenElementMenuStepId] = useState<string | null>(null);
  const [hoveredCheckbox, setHoveredCheckbox] = useState<string | null>(null);
  const [expandedCardElements, setExpandedCardElements] = useState<Set<string>>(new Set());
  const totalPages = stepsState.length;

  const canGoBack = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  const currentStep: Step | undefined = stepsState[currentPage];

  // Sync stepsState when prototype updates from Realtime
  useEffect(() => {
    if (prototype && prototype.steps) {
      setStepsState(prototype.steps);
    }
  }, [prototype]);

  // Build current prototype state for auto-save when editing
  const currentPrototypeForSave: Prototype | null = prototype && isEditorOpen ? {
    ...prototype,
    steps: stepsState,
    updatedAt: new Date().toISOString(),
  } : null;

  // Auto-save when editing steps
  const { isSaving, lastSaved } = useAutoSave({
    prototype: currentPrototypeForSave,
    enabled: isEditorOpen && !!prototype,
    debounceMs: 2000, // 2 second debounce for step edits
    onSave: (savedPrototype) => {
      // Update local state
      updatePrototypeInState(savedPrototype);
      setStepsState(savedPrototype.steps);
      console.log('Auto-saved prototype steps');
    },
  });

  // Initialize expanded state for all card elements when editor opens
  useEffect(() => {
    if (isEditorOpen && currentStep) {
      const cardElementIds = currentStep.elements
        .filter(el => el.type === 'application_card' || el.type === 'simple_cards' || el.type === 'image_cards' || el.type === 'image_only_card' || el.type === 'advanced_cards')
        .map(el => el.id);
      setExpandedCardElements(new Set(cardElementIds));
      // Track that user is editing
      setEditing(true, `step-${currentPage}`);
    } else if (!isEditorOpen) {
      // Reset expanded state when editor closes
      setExpandedCardElements(new Set());
      // Track that user stopped editing
      setEditing(false);
    }
  }, [isEditorOpen, currentStep, currentPage, setEditing]);

  // Show loading state if prototype is not loaded yet
  if (!prototype) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prototype...</p>
        </div>
      </div>
    );
  }

  // Calculate if next button should be disabled
  const isNextDisabled = useMemo(() => {
    if (!currentStep?.elements || currentStep.elements.length === 0) {
      return false; // No elements means we can proceed
    }
    
    const allElementsValid = currentStep.elements.every(el => {
      const value = fieldValues[el.id];
      
      // For arrays (multiple selections)
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      // For strings (single selections, text fields)
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      // For undefined/null values
      return false;
    });
    return !allElementsValid;
  }, [currentStep, fieldValues]);

  // Keyboard navigation: left/right arrows to switch between steps
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard navigation if editor is open or user is typing in an input/textarea
      if (isEditorOpen) return;
      
      const target = event.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInputElement) return;

      if (event.key === 'ArrowLeft' && canGoBack) {
        event.preventDefault();
        setCurrentPage(p => p - 1);
      } else if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        setCurrentPage(p => p + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canGoBack, canGoNext, isEditorOpen]);

  const updateElement = (stepIndex: number, elementId: string, updates: Partial<Element>) => {
    setStepsState(prev =>
      prev.map((s, idx) =>
        idx === stepIndex
          ? {
              ...s,
              elements: s.elements.map(el => (el.id === elementId ? { ...el, ...updates } : el)),
            }
          : s
      )
    );
  };

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setStepsState(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  const handleStepImageUpload = (stepId: string, file: File, fileInfo: { name: string; size: number; dataUrl: string }) => {
    updateStep(stepId, { imageUrl: fileInfo.dataUrl });
  };

  // Card element types that should be mutually exclusive
  const CARD_ELEMENT_TYPES: ElementType[] = ['simple_cards', 'image_cards', 'advanced_cards', 'image_only_card', 'yes_no_cards', 'application_card'];

  const hasCardElement = (stepId: string): boolean => {
    const step = stepsState.find(s => s.id === stepId);
    if (!step) return false;
    return step.elements.some(el => CARD_ELEMENT_TYPES.includes(el.type));
  };

  const isCardElement = (type: ElementType): boolean => {
    return CARD_ELEMENT_TYPES.includes(type);
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

    setStepsState(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, elements: [...step.elements, newElement] }
          : step
      )
    );
  };

  const deleteElement = (stepId: string, elementId: string) => {
    setStepsState(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, elements: step.elements.filter(el => el.id !== elementId) }
          : step
      )
    );
  };

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
              heading: 'Student or recent graduate',
              mainText: 'A student is someone who is still enrolled in a full time course.',
              linkSupportingText: 'If still not sure, ',
              linkEnabled: true,
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


  const handleSave = async () => {
    const updatedPrototype: Prototype = {
      ...prototype,
      steps: stepsState,
      updatedAt: new Date().toISOString(),
    };
    const result = await savePrototype(updatedPrototype);
    // Update local state immediately for instant UI feedback
    if (result.success && result.data) {
      updatePrototypeInState(result.data);
      // Also update local stepsState to match
      setStepsState(result.data.steps);
    }
    setIsEditorOpen(false);
  };

  const renderStep = () => {
    if (!currentStep) return null;

    // Application step header (heading and subheading)
    const applicationStepHeader = currentStep.isApplicationStep ? (
      <div className="flex flex-col items-center w-full max-w-full" style={{ marginBottom: '32px' }}>
        <div className="flex flex-col items-center w-full max-w-full">
          {currentStep.applicationStepHeading && (
            <h2
              className="text-center justify-center text-zinc-700 text-2xl font-semibold font-['Poppins'] leading-9"
              style={{
                marginBottom: currentStep.applicationStepSubheading ? '8px' : '0',
                letterSpacing: '0.18px',
              }}
            >
              {currentStep.applicationStepHeading}
            </h2>
          )}
          {currentStep.applicationStepSubheading && (
            <p className="text-center w-full" style={{ fontSize: '16px', color: 'rgba(99, 112, 133, 1)' }}>
              {currentStep.applicationStepSubheading}
            </p>
          )}
        </div>
      </div>
    ) : null;

    // Question and description header (always shown at top center when present)
    const questionHeader = !currentStep.isApplicationStep && (currentStep.question || currentStep.description) ? (
      <div className="flex flex-col items-center w-full max-w-full" style={{ marginBottom: '32px' }}>
        <div className="flex flex-col items-center w-full max-w-full">
          <div className="flex items-center justify-center gap-3 w-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border-2" style={{ borderColor: prototype.primaryColor }}>
              <span className="text-lg font-normal leading-none text-black">{currentPage + 1}</span>
            </div>
            {currentStep.question && (
              <h2
                className="text-center"
                style={{
                  color: '#353B46',
                  fontFamily: 'var(--family-title, Poppins)',
                  fontSize: '24px',
                  fontWeight: 600,
                  lineHeight: '36px',
                  letterSpacing: '0.18px',
                  fontFeatureSettings: '"liga" off, "clig" off',
                }}
              >
                {currentStep.question}
              </h2>
            )}
          </div>
          {currentStep.description && (
            <p className="text-gray-600 mt-2 text-center w-full">{currentStep.description}</p>
          )}
        </div>
      </div>
    ) : null;

    // Render elements (cards, fields, etc.)
    const renderElements = (isSplitScreen: boolean = false) => {
      return (
        <div className={`w-full flex flex-col ${isSplitScreen ? 'items-start' : 'items-start'}`} style={{ gap: '24px' }}>
          {currentStep.elements.map((el, index) => {
            if (el.type === 'text_field') {
              const containerStyle = isSplitScreen 
                ? {} 
                : { marginTop: '120px', marginBottom: '120px' };
              const wrapperStyle = isSplitScreen 
                ? { width: '100%' } 
                : { width: '680px' };
              const wrapperClass = isSplitScreen 
                ? 'flex w-full flex-col items-start gap-3' 
                : 'flex w-full flex-col items-center gap-3';
              
              return (
                <div key={el.id} className={wrapperClass} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <TextField
                      label={el.config.label || 'Label'}
                      showLabel={!!el.config.hasLabel}
                      value={typeof fieldValues[el.id] === 'string' ? fieldValues[el.id] as string : ''}
                      onChange={(val) => setFieldValues(v => ({ ...v, [el.id]: val }))}
                      placeholder={el.config.placeholder || 'Placeholder'}
                      primaryColor={prototype.primaryColor}
                    />
                  </div>
                </div>
              );
            }
            
            if (el.type === 'dropdown') {
              const containerStyle = isSplitScreen 
                ? {} 
                : { marginTop: '120px', marginBottom: '120px' };
              const wrapperStyle = isSplitScreen 
                ? { width: '100%' } 
                : { width: '680px' };
              const wrapperClass = isSplitScreen 
                ? 'flex w-full flex-col items-start gap-3' 
                : 'flex w-full flex-col items-center gap-3';
              
              return (
                <div key={el.id} className={wrapperClass} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <DropdownField
                      value={typeof fieldValues[el.id] === 'string' ? fieldValues[el.id] as string : ''}
                      onChange={(val) => setFieldValues(v => ({ ...v, [el.id]: val }))}
                      placeholder={el.config.placeholder || 'Select an option'}
                      primaryColor={prototype.primaryColor}
                      options={el.config.options || []}
                    />
                  </div>
                </div>
              );
            }

            if (el.type === 'calendar_field') {
              const containerStyle = isSplitScreen 
                ? {} 
                : { marginTop: '120px', marginBottom: '120px' };
              const wrapperStyle = isSplitScreen 
                ? { width: '100%' } 
                : { width: '680px' };
              const wrapperClass = isSplitScreen 
                ? 'flex w-full flex-col items-start gap-3' 
                : 'flex w-full flex-col items-center gap-3';
              
              return (
                <div key={el.id} className={wrapperClass} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <CalendarField
                      label={el.config.label || 'Label'}
                      showLabel={!!el.config.hasLabel}
                      value={typeof fieldValues[el.id] === 'string' ? fieldValues[el.id] as string : ''}
                      onChange={(val) => setFieldValues(v => ({ ...v, [el.id]: val }))}
                      placeholder={el.config.placeholder || 'Placeholder'}
                      primaryColor={prototype.primaryColor}
                    />
                  </div>
                </div>
              );
            }
            if (el.type === 'simple_cards') {
              const options = el.config.options || [];
              const value = fieldValues[el.id];
              const selectionType = el.config.selectionType || 'single';
              const maxSelection = el.config.maxSelection || 1;
              const numCards = options.length;
              
              // Determine grid columns based on number of cards
              let gridCols = 'grid-cols-1';
              if (numCards === 2 || numCards === 3) {
                gridCols = `grid-cols-${numCards}`;
              } else if (numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }
              
              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  // Multiple selection logic
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  
                  if (isSelected) {
                    // Remove from selection
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
                    // Add to selection if under max limit
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };
              
              const isCardSelected = (optId: string) => {
                if (selectionType === 'single') {
                  return value === optId;
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  return currentValues.includes(optId);
                }
              };
              
              // Apply padding based on number of cards: 1-3 cards = 120px padding only if first element, 4+ cards = 0 padding
              // Skip padding in split screen mode
              const isFirstElement = index === 0;
              const cardPadding = (!isSplitScreen && numCards >= 1 && numCards <= 3 && isFirstElement) 
                ? { paddingTop: '120px', paddingBottom: '0px' } 
                : {};
              
              return (
                <div key={el.id} className="w-full" style={cardPadding}>
                  <div className={`grid ${gridCols} gap-[24px]`}>
                    {options.map((opt: any) => (
                      <SimpleCard
                        key={opt.id}
                        title={opt.title || 'Option'}
                        selected={isCardSelected(opt.id)}
                        onSelect={() => handleCardSelect(opt.id)}
                        primaryColor={prototype.primaryColor}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            
            if (el.type === 'image_cards') {
              const options = el.config.options || [];
              const value = fieldValues[el.id];
              const selectionType = el.config.selectionType || 'single';
              const maxSelection = el.config.maxSelection || 1;
              const numCards = options.length;
              
              // Determine grid columns based on number of cards
              let gridCols = 'grid-cols-1';
              if (numCards === 2 || numCards === 3) {
                gridCols = `grid-cols-${numCards}`;
              } else if (numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }
              
              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  // Multiple selection logic
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  
                  if (isSelected) {
                    // Remove from selection
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
                    // Add to selection if under max limit
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };
              
              const isCardSelected = (optId: string) => {
                if (selectionType === 'single') {
                  return value === optId;
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  return currentValues.includes(optId);
                }
              };
              
              // Apply padding based on number of cards: 1-3 cards = 120px padding only if first element, 4+ cards = 0 padding
              // Skip padding in split screen mode
              const isFirstElement = index === 0;
              const cardPadding = (!isSplitScreen && numCards >= 1 && numCards <= 3 && isFirstElement) 
                ? { paddingTop: '120px', paddingBottom: '0px' } 
                : {};
              
              return (
                <div key={el.id} className="w-full" style={cardPadding}>
                  <div className={`grid ${gridCols} gap-[24px]`}>
                    {options.map((opt: any) => (
                      <ImageCard
                        key={opt.id}
                        id={opt.id}
                        title={opt.title || 'Option'}
                        description={opt.description}
                        imageUrl={opt.imageUrl || ''}
                        selected={isCardSelected(opt.id)}
                        onSelect={() => handleCardSelect(opt.id)}
                        primaryColor={prototype.primaryColor}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            
            if (el.type === 'checkboxes') {
              const options = el.config.options || [];
              const value = fieldValues[el.id];
              const selectionType = el.config.selectionType || 'multiple';
              const maxSelection = el.config.maxSelection || 2;
              const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
              
              const handleCheckboxChange = (optId: string) => {
                const isSelected = currentValues.includes(optId);
                if (isSelected) {
                  const newValues = currentValues.filter(id => id !== optId);
                  setFieldValues(v => ({ ...v, [el.id]: newValues }));
                } else {
                  if (selectionType === 'single') {
                    // For single selection, clear all others and select this one
                    setFieldValues(v => ({ ...v, [el.id]: [optId] }));
                  } else {
                    // For multiple selection, check max selection limit
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };
              
              const containerStyle = isSplitScreen 
                ? {} 
                : { marginTop: '120px', marginBottom: '120px' };
              const wrapperStyle = isSplitScreen 
                ? { width: '100%' } 
                : { width: '680px' };
              const wrapperClass = isSplitScreen 
                ? 'flex w-full flex-col items-start gap-3' 
                : 'flex w-full flex-col items-center gap-3';
              
              return (
                <div key={el.id} className={wrapperClass} style={containerStyle}>
                  <div style={wrapperStyle} className="space-y-3">
                    {options.map((opt: any) => {
                      const isSelected = currentValues.includes(opt.id);
                      const isDisabled = !isSelected && 
                        selectionType === 'multiple' && 
                        currentValues.length >= maxSelection;
                      const checkboxKey = `${el.id}-${opt.id}`;
                      const isHovered = hoveredCheckbox === checkboxKey && !isDisabled;
                      
                      // Determine border color based on state (matching TextField)
                      let borderColor: string;
                      if (isDisabled) {
                        borderColor = '#E5E7EB'; // gray-200
                      } else if (isHovered) {
                        borderColor = '#9CA3AF'; // gray-400
                      } else {
                        borderColor = '#E5E7EB'; // gray-200
                      }
                      
                      return (
                        <div
                          key={opt.id}
                          className={`w-full self-stretch p-4 bg-white rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex justify-start items-center gap-2.5 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          style={{
                            outlineColor: borderColor,
                          }}
                          onClick={() => !isDisabled && handleCheckboxChange(opt.id)}
                          onMouseEnter={() => !isDisabled && setHoveredCheckbox(checkboxKey)}
                          onMouseLeave={() => setHoveredCheckbox(null)}
                        >
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => handleCheckboxChange(opt.id)}
                              primaryColor={prototype.primaryColor}
                              useBrandColor={true}
                              size="md"
                              className="flex-shrink-0"
                            />
                          </div>
                          <span 
                            className="text-gray-700"
                            style={{
                              fontSize: 16,
                              fontFamily: 'Poppins',
                              fontWeight: 100,
                              lineHeight: '24px',
                              letterSpacing: 0.2,
                              color: '#353B46',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {opt.title || 'Option'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            if (el.type === 'advanced_cards') {
              const options = el.config.options || [];
              const value = fieldValues[el.id];
              const selectionType = el.config.selectionType || 'single';
              const maxSelection = el.config.maxSelection || 1;
              const numCards = options.length;
              
              // Determine grid columns based on number of cards
              let gridCols = 'grid-cols-1';
              if (numCards === 2 || numCards === 3) {
                gridCols = `grid-cols-${numCards}`;
              } else if (numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }
              
              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  // Multiple selection logic
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  
                  if (isSelected) {
                    // Remove from selection
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
                    // Add to selection if under max limit
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };
              
              const isCardSelected = (optId: string) => {
                if (selectionType === 'single') {
                  return value === optId;
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  return currentValues.includes(optId);
                }
              };
              
              // Apply padding based on number of cards: 1-3 cards = 120px padding only if first element, 4+ cards = 0 padding
              // Skip padding in split screen mode
              const isFirstElement = index === 0;
              const cardPadding = (!isSplitScreen && numCards >= 1 && numCards <= 3 && isFirstElement) 
                ? { paddingTop: '120px', paddingBottom: '0px' } 
                : {};
              
              return (
                <div key={el.id} className="w-full" style={cardPadding}>
                  <div className={`grid ${gridCols} gap-[24px]`}>
                    {options.map((opt: any) => (
                      <AdvancedCard
                        key={opt.id}
                        id={opt.id}
                        heading={opt.heading || 'Heading'}
                        mainText={opt.mainText}
                        linkSupportingText={opt.linkSupportingText}
                        linkEnabled={opt.linkEnabled || false}
                        linkUrl={opt.linkUrl}
                        linkText={opt.linkText || 'Learn more'}
                        selected={isCardSelected(opt.id)}
                        onSelect={() => handleCardSelect(opt.id)}
                        primaryColor={prototype.primaryColor}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            
            if (el.type === 'image_only_card') {
              const options = el.config.options || [];
              const value = fieldValues[el.id];
              const selectionType = el.config.selectionType || 'single';
              const maxSelection = el.config.maxSelection || 1;
              const numCards = options.length;
              
              // Determine grid columns based on number of cards
              let gridCols = 'grid-cols-1';
              if (numCards === 2 || numCards === 3) {
                gridCols = `grid-cols-${numCards}`;
              } else if (numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }
              
              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  // Multiple selection logic
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  
                  if (isSelected) {
                    // Remove from selection
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
                    // Add to selection if under max limit
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };
              
              const isCardSelected = (optId: string) => {
                if (selectionType === 'single') {
                  return value === optId;
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  return currentValues.includes(optId);
                }
              };
              
              // Apply padding based on number of cards: 1-3 cards = 120px padding only if first element, 4+ cards = 0 padding
              // Skip padding in split screen mode
              const isFirstElement = index === 0;
              const cardPadding = (!isSplitScreen && numCards >= 1 && numCards <= 3 && isFirstElement) 
                ? { paddingTop: '120px', paddingBottom: '0px' } 
                : {};
              
              return (
                <div key={el.id} className="w-full" style={cardPadding}>
                  <div className={`grid ${gridCols}`} style={{ gap: '24px' }}>
                    {options.map((opt: any) => (
                      <ImageOnlyCard
                        key={opt.id}
                        id={opt.id}
                        imageUrl={opt.imageUrl || ''}
                        selected={isCardSelected(opt.id)}
                        onSelect={() => handleCardSelect(opt.id)}
                        primaryColor={prototype.primaryColor}
                        totalCards={numCards}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            
            if (el.type === 'yes_no_cards') {
              const yesText = el.config.yesText || 'Yes';
              const noText = el.config.noText || 'No';
              const value = fieldValues[el.id];
              // Convert value to 'yes' | 'no' | null format
              const selected = typeof value === 'string' 
                ? (value === 'yes' || value === 'no' ? value : null)
                : null;
              
              const handleSelect = (selectedValue: 'yes' | 'no') => {
                setFieldValues(v => ({ ...v, [el.id]: selectedValue }));
              };
              
              // Apply padding based on number of cards: 1-3 cards = 120px padding only if first element, 4+ cards = 0 padding
              // Skip padding in split screen mode
              const isFirstElement = index === 0;
              const numCards = 2; // Yes/No cards always have 2 cards
              const cardPadding = (!isSplitScreen && numCards >= 1 && numCards <= 3 && isFirstElement) 
                ? { paddingTop: '120px', paddingBottom: '0px' } 
                : {};
              
              return (
                <div key={el.id} className="w-full" style={cardPadding}>
                  <YesNoCards
                    yesText={yesText}
                    noText={noText}
                    selected={selected}
                    onSelect={handleSelect}
                    primaryColor={prototype.primaryColor}
                  />
                </div>
              );
            }

            if (el.type === 'application_card') {
              const options = el.config.options || [];
              const value = fieldValues[el.id];
              const selectionType = el.config.selectionType || 'single';
              const maxSelection = el.config.maxSelection || 1;
              const numCards = options.length;
              
              // Determine grid columns based on number of cards
              // For more than 3 cards: always use 3 columns per row
              let gridCols = 'grid-cols-1';
              if (numCards === 2 || numCards === 3) {
                gridCols = `grid-cols-${numCards}`;
              } else if (numCards > 3) {
                gridCols = 'grid-cols-3';
              }
              
              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  // Multiple selection logic
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  
                  if (isSelected) {
                    // Remove from selection
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
                    // Add to selection if under max limit
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };
              
              const isCardSelected = (optId: string) => {
                if (selectionType === 'single') {
                  return value === optId;
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  return currentValues.includes(optId);
                }
              };
              
              // Apply padding based on number of cards: 1-3 cards = 120px padding only if first element, 4+ cards = 0 padding
              // Skip padding in split screen mode or for application steps (they use header marginBottom instead)
              const isFirstElement = index === 0;
              const cardPadding = (!isSplitScreen && !currentStep.isApplicationStep && numCards >= 1 && numCards <= 3 && isFirstElement) 
                ? { paddingTop: '120px', paddingBottom: '0px' } 
                : {};
              
              // For application steps, add 32px spacing between text fields and application cards
              // Check if previous element is a text_field and this is an application step
              const previousElement = index > 0 ? currentStep.elements[index - 1] : null;
              const isAfterTextField = previousElement?.type === 'text_field';
              // Text fields have marginBottom: 120px, gap is 24px. Current spacing = 144px
              // To get 32px total: marginTop = 32px - 24px - 120px = -112px
              // This offsets the text marginBottom and gap to achieve 32px total spacing
              const spacingOverride = (currentStep.isApplicationStep && isAfterTextField && !isSplitScreen)
                ? { marginTop: '-112px' } // Offset to achieve 32px total spacing (120 + 24 - 112 = 32)
                : {};
              
              // Use flexbox with fixed width for 1 or 2 cards, grid for others
              const useFixedWidth = numCards === 1 || numCards === 2;
              
              return (
                <div key={el.id} className="w-full" style={{ ...cardPadding, ...spacingOverride }}>
                  {useFixedWidth ? (
                    <div className="flex justify-center" style={{ gap: '24px' }}>
                      {options.map((opt: any) => (
                        <div key={opt.id} style={{ width: '368px' }}>
                          <ApplicationCard
                            id={opt.id}
                            title={opt.title || 'Application'}
                            description={opt.description}
                            imageUrl={opt.imageUrl}
                            selected={isCardSelected(opt.id)}
                            onSelect={() => handleCardSelect(opt.id)}
                            primaryColor={prototype.primaryColor}
                            jobTitle={opt.jobTitle}
                            location={opt.location}
                            department={opt.department}
                            jobType={opt.jobType}
                            jobId={opt.jobId}
                            jobDescription={opt.jobDescription}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                  <div className={`grid ${gridCols} justify-center`} style={{ gap: '24px' }}>
                    {options.map((opt: any) => (
                      <div key={opt.id} style={numCards > 3 ? { width: '368px' } : {}}>
                        <ApplicationCard
                          id={opt.id}
                          title={opt.title || 'Application'}
                          description={opt.description}
                          imageUrl={opt.imageUrl}
                          selected={isCardSelected(opt.id)}
                          onSelect={() => handleCardSelect(opt.id)}
                          primaryColor={prototype.primaryColor}
                          jobTitle={opt.jobTitle}
                          location={opt.location}
                          department={opt.department}
                          jobType={opt.jobType}
                          jobId={opt.jobId}
                          jobDescription={opt.jobDescription}
                          primaryButtonLink={opt.primaryButtonLink}
                          learnMoreButtonLink={opt.learnMoreButtonLink}
                        />
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              );
            }
            
            // Basic rendering for options-based elements (cards/dropdowns/checkboxes)
            if (el.type === 'dropdown') {
              return (
                <div key={el.id} className="flex w-full flex-col items-start gap-3">
                  {el.config.label && (
                    <label className="block text-sm font-medium text-gray-700">{el.config.label}</label>
                  )}
                  <select className="w-full px-5 py-3.5 border border-gray-200 rounded-[16px] focus:ring-4 focus:border-gray-300"
                          style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
                    {(el.config.options || []).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.title}</option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    };

    // If split screen is enabled, show question header at top, then image and elements side by side
    if (currentStep.splitScreenWithImage && currentStep.imageUrl) {
      const imageSection = (
        <div className="flex flex-col">
          <img 
            src={currentStep.imageUrl} 
            alt="Step visual" 
            className="w-full h-80 object-cover rounded-[16px]" 
          />
          {/* Image title and subtitle if present */}
          {currentStep.imageHasTitle && (currentStep.imageTitle || currentStep.imageSubtitle) && (
            <div className="mt-4">
              {currentStep.imageTitle && (
                <h3 
                  className="text-lg font-semibold mb-1"
                  style={{ color: '#353B46' }}
                >
                  {currentStep.imageTitle}
                </h3>
              )}
              {currentStep.imageSubtitle && (
                <p 
                  className="text-sm"
                  style={{ color: '#353B46' }}
                >
                  {currentStep.imageSubtitle}
                </p>
              )}
            </div>
          )}
        </div>
      );

      return (
        <div className="flex flex-col items-center">
          {currentStep.isApplicationStep ? applicationStepHeader : questionHeader}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
            {currentStep.imagePosition === 'left' ? (
              <>
                {imageSection}
                {renderElements(true)}
              </>
            ) : (
              <>
                {renderElements(true)}
                {imageSection}
              </>
            )}
          </div>
        </div>
      );
    }

    // Normal view: question header at top, then elements below
    return (
      <div className="flex flex-col items-center">
        {currentStep.isApplicationStep ? applicationStepHeader : questionHeader}
        <div className="w-full">
          {renderElements(false)}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F8F9FB' }}>
      <div className="fixed top-0 left-0 right-0 z-30 bg-white">
        <PrototypeHeader 
          prototype={prototype}
          isRealtimeConnected={isConnected}
          onEdit={() => setIsEditorOpen(true)}
          onExit={onExit}
        />
        {isConnected && presenceUsers && presenceUsers.length > 0 && (
          <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
            <PresenceIndicator users={presenceUsers} currentUserId={userId} />
          </div>
        )}
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[81px]" style={{ backgroundColor: '#F8F9FB' }}>
        <div className="flex items-start justify-center p-0 min-h-full">
          <div className="w-full max-w-[1152px] mx-auto" style={{ padding: '32px 0' }}>
            {renderStep()}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white">
        <Footer
          onExit={onExit}
          onNext={() => setCurrentPage(p => p + 1)}
          onBack={() => setCurrentPage(p => p - 1)}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          primaryColor={prototype.primaryColor}
          isNextDisabled={isNextDisabled}
          isApplicationStep={currentStep?.isApplicationStep || false}
          onRefineSelection={() => {
            // Handle refine selection - could reset selections or go back to previous step
            // For now, we'll just go back one step
            if (canGoBack) {
              setCurrentPage(p => p - 1);
            }
          }}
        />
      </div>

      {/* Right slide-over editor limited to current step elements */}
      {isEditorOpen && currentStep && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsEditorOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-out translate-x-0 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Edit step</h3>
              <button className="p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsEditorOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
              {/* Question and Description Configuration / Heading and Subheading for Application Steps */}
              {currentStep.isApplicationStep ? (
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-sm font-semibold mb-4" style={{ color: '#464F5E' }}>
                    Heading and Subheading
                  </h4>
                  <div className="space-y-4">
                    <SystemField
                      type="text"
                      value={currentStep.applicationStepHeading || ''}
                      onChange={(value) => updateStep(currentStep.id, { applicationStepHeading: value })}
                      label="Heading"
                      placeholder="Enter heading"
                    />
                    <SystemField
                      type="textarea"
                      value={currentStep.applicationStepSubheading || ''}
                      onChange={(value) => updateStep(currentStep.id, { applicationStepSubheading: value })}
                      label="Subheading"
                      placeholder="Enter subheading"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h4 className="text-sm font-semibold mb-4" style={{ color: '#464F5E' }}>
                  Question and Description
                </h4>
                <div className="space-y-4">
                  <SystemField
                    type="text"
                    value={currentStep.question || ''}
                    onChange={(value) => updateStep(currentStep.id, { question: value })}
                    label="Question"
                    placeholder="Enter your question"
                  />
                  <SystemField
                    type="textarea"
                    value={currentStep.description || ''}
                    onChange={(value) => updateStep(currentStep.id, { description: value })}
                    label="Description"
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              </div>
              )}

              {/* Image Configuration - Hidden for Application Steps */}
              {!currentStep.isApplicationStep && (
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h4 className="text-sm font-semibold mb-4" style={{ color: '#464F5E' }}>
                  Image Configuration
                </h4>
                <div className="space-y-4">
                  <div>
                    <Checkbox
                      id={`split-${currentStep.id}`}
                      checked={currentStep.splitScreenWithImage || false}
                      onChange={(e) => updateStep(currentStep.id, { splitScreenWithImage: e.target.checked })}
                      label="Split screen with image"
                    />
                  </div>

                  {currentStep.splitScreenWithImage && (
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
                          value={currentStep.imagePosition || 'right'}
                          onChange={(value) => updateStep(currentStep.id, { imagePosition: value as 'left' | 'right' })}
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
                            value={currentStep.imageUploadMode || 'upload'}
                            onChange={(value) => updateStep(currentStep.id, { imageUploadMode: value as 'upload' | 'url' })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                          Image URL
                        </label>
                        {currentStep.imageUploadMode !== 'upload' ? (
                          <SystemField
                            type="url"
                            value={currentStep.imageUrl || ''}
                            onChange={(value) => updateStep(currentStep.id, { imageUrl: value })}
                            placeholder="https://example.com/image.jpg"
                            showLabel={false}
                          />
                        ) : (
                          <FileUploader
                            value={currentStep.imageUrl ? { name: 'Step image', size: 0, dataUrl: currentStep.imageUrl } : undefined}
                            onChange={(file, fileInfo) => handleStepImageUpload(currentStep.id, file, fileInfo)}
                            accept="image/*"
                            maxSize={5}
                            showPreview={true}
                          />
                        )}
                      </div>

                      <div>
                        <Checkbox
                          id={`imageTitle-${currentStep.id}`}
                          checked={currentStep.imageHasTitle || false}
                          onChange={(e) => updateStep(currentStep.id, { imageHasTitle: e.target.checked })}
                          label="Image has title and subtitle"
                        />
                      </div>

                      {currentStep.imageHasTitle && (
                        <div className="space-y-3 pl-6">
                          <div>
                            <SystemField
                              type="text"
                              value={currentStep.imageTitle || ''}
                              onChange={(value) => updateStep(currentStep.id, { imageTitle: value })}
                              label="Image title"
                              placeholder="Enter image title"
                            />
                          </div>
                          <div>
                            <SystemField
                              type="text"
                              value={currentStep.imageSubtitle || ''}
                              onChange={(value) => updateStep(currentStep.id, { imageSubtitle: value })}
                              label="Image subtitle"
                              placeholder="Enter image subtitle"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {!currentStep.isApplicationStep && (
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium" style={{ color: '#464F5E' }}>
                  Elements
                </label>
                <div className="relative">
                  <TextButton
                    onClick={() => setOpenElementMenuStepId(openElementMenuStepId === currentStep.id ? null : currentStep.id)}
                    size="sm"
                  >
                    <Plus size={16} />
                    Add element
                  </TextButton>
                  {openElementMenuStepId === currentStep.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenElementMenuStepId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        {ELEMENT_TYPES.map((type) => {
                          const isCardType = isCardElement(type.type);
                          // In edit mode, disable all card elements (cannot add new card elements)
                          const isDisabled = isCardType;
                          
                          return (
                            <button
                              key={type.type}
                              onClick={() => {
                                if (!isDisabled) {
                                  addElement(currentStep.id, type.type);
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
              )}
              {(() => {
                // Separate application cards from other elements
                const applicationCardElements = currentStep.elements.filter(el => el.type === 'application_card');
                const otherElements = currentStep.elements.filter(el => el.type !== 'application_card');
                
                return (
                  <>
                    {/* Application Cards Section */}
                    {applicationCardElements.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-4" style={{ color: '#464F5E' }}>
                          Application cards configuration
                        </h4>
                        {applicationCardElements.map((el) => {
                          return (
                            <div key={el.id} className="mb-4">
                              <CardEditor
                                element={el}
                                stepIndex={currentPage}
                                onUpdateElement={updateElement}
                                primaryColor={prototype.primaryColor}
                                showSelectionConfig={false}
                                disableAddCard={false}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Other Elements */}
                    {otherElements.map((el) => {
                      const isExpanded = expandedCardElements.has(el.id);
                      const isCardType = el.type === 'simple_cards' || el.type === 'image_cards' || el.type === 'image_only_card' || el.type === 'advanced_cards';
                      
                      return (
                  <div key={el.id} className="border border-gray-200 rounded-lg">
                    <div 
                      className={`flex items-center justify-between p-3 ${isCardType ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                      onClick={isCardType ? () => {
                        const newSet = new Set(expandedCardElements);
                        if (isExpanded) {
                          newSet.delete(el.id);
                        } else {
                          newSet.add(el.id);
                        }
                        setExpandedCardElements(newSet);
                      } : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {isCardType && (isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />)}
                    <span className="text-base font-medium" style={{ color: '#464F5E' }}>{getElementLabel(el.type)}</span>
                      </div>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(currentStep.id, el.id);
                        }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete element"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                    {(!isCardType || isExpanded) && (
                      <div className="p-3 space-y-3">
                  {el.type === 'text_field' ? (
                    <div className="mt-3 space-y-2">
                      <ShowLabelToggle
                        checked={!!el.config.hasLabel}
                        onChange={(checked) =>
                          updateElement(currentPage, el.id, {
                            config: { ...el.config, hasLabel: checked },
                          })
                        }
                        primaryColor={prototype.primaryColor}
                      />
                      <div className="flex flex-col space-y-2">
                        {el.config.hasLabel && (
                          <EditorField
                            value={el.config.label || ''}
                            onChange={(value) =>
                              updateElement(currentPage, el.id, {
                                config: { ...el.config, label: value },
                              })
                            }
                            placeholder="Label"
                          />
                        )}
                        <EditorField
                          value={el.config.placeholder || ''}
                          onChange={(value) =>
                            updateElement(currentPage, el.id, {
                              config: { ...el.config, placeholder: value },
                            })
                          }
                          placeholder="Placeholder"
                        />
                      </div>
                    </div>
                  ) : null}

                  {el.type === 'dropdown' ? (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                        Placeholder
                      </label>
                      <EditorField
                        value={el.config.placeholder || ''}
                        onChange={(value) =>
                          updateElement(currentPage, el.id, {
                            config: { ...el.config, placeholder: value },
                          })
                        }
                        placeholder="ex. Select industry from dropdown..."
                        className="w-full"
                      />
                    </div>
                  ) : null}

                  {el.type === 'calendar_field' ? (
                    <div className="mt-3 space-y-2">
                      <ShowLabelToggle
                        checked={!!el.config.hasLabel}
                        onChange={(checked) =>
                          updateElement(currentPage, el.id, {
                            config: { ...el.config, hasLabel: checked },
                          })
                        }
                        primaryColor={prototype.primaryColor}
                      />
                      <div className="flex flex-col space-y-2">
                        {el.config.hasLabel && (
                          <SystemField
                            type="text"
                            value={el.config.label || ''}
                            onChange={(value) =>
                              updateElement(currentPage, el.id, {
                                config: { ...el.config, label: value },
                              })
                            }
                            placeholder="Label"
                            showLabel={false}
                          />
                        )}
                        <SystemField
                          type="text"
                          value={el.config.placeholder || ''}
                          onChange={(value) =>
                            updateElement(currentPage, el.id, {
                              config: { ...el.config, placeholder: value },
                            })
                          }
                          placeholder="Placeholder"
                          showLabel={false}
                        />
                      </div>
                    </div>
                  ) : null}

                  {el.type === 'yes_no_cards' ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                          Yes Text
                        </label>
                        <EditorField
                          value={el.config.yesText || 'Yes'}
                          onChange={(value) =>
                            updateElement(currentPage, el.id, {
                              config: { ...el.config, yesText: value },
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
                          value={el.config.noText || 'No'}
                          onChange={(value) =>
                            updateElement(currentPage, el.id, {
                              config: { ...el.config, noText: value },
                            })
                          }
                          placeholder="No"
                          className="w-full"
                        />
                      </div>
                    </div>
                  ) : null}

                  {(el.type === 'dropdown' || el.type === 'checkboxes' || el.type === 'simple_cards' || el.type === 'image_cards' || el.type === 'image_only_card' || el.type === 'advanced_cards') && (
                    <CardEditor
                      element={el}
                      stepIndex={currentPage}
                      onUpdateElement={updateElement}
                      primaryColor={prototype.primaryColor}
                      showSelectionConfig={el.type === 'simple_cards' || el.type === 'image_cards' || el.type === 'image_only_card' || el.type === 'advanced_cards'}
                      disableAddCard={false}
                    />
                  )}
                </div>
                    )}
                  </div>
                );
                    })}
                  </>
                );
              })()}
              <p className="text-xs text-gray-500">Editing is limited to this step's elements. To change prototype settings like logo and color, use Edit on the prototype card.</p>
            </div>
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-end mb-2">
                <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
              </div>
              <PrimaryButton
                onClick={handleSave}
                className="w-full"
              >
                Save
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
