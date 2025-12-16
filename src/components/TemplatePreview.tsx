import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Step, Element, Prototype } from '../types';
import TextField from './TextField';
import DropdownField from './DropdownField';
import CalendarField from './CalendarField';
import SimpleCard from './widgets/SimpleCard';
import ImageCard from './widgets/ImageCard';
import ImageOnlyCard from './widgets/ImageOnlyCard';
import AdvancedCard from './widgets/AdvancedCard';
import YesNoCards from './widgets/YesNoCards';
import ApplicationCard from './widgets/ApplicationCard';
import Checkbox from './Checkbox';
import PrototypeHeader from './PrototypeHeader';
import Footer from './Footer';

type OptionType = NonNullable<Element['config']['options']>[number];

interface TemplatePreviewProps {
  steps: Step[];
  primaryColor?: string;
  isQuestionTemplate?: boolean;
  isApplicationStepTemplate?: boolean;
  templateName?: string;
  logoUrl?: string;
}

export default function TemplatePreview({
  steps,
  primaryColor = '#4D3EE0',
  isQuestionTemplate = false,
  isApplicationStepTemplate = false,
  templateName = 'Template Preview',
  logoUrl,
}: TemplatePreviewProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>({});
  const [hoveredCheckbox, setHoveredCheckbox] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const mainScrollRef = useRef<HTMLElement>(null);

  // Create a mock prototype object for the header
  const mockPrototype: Prototype = useMemo(() => ({
    id: 'preview',
    name: templateName,
    description: '',
    primaryColor,
    logoUrl: logoUrl || '',
    logoUploadMode: logoUrl ? 'url' : 'upload',
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [templateName, primaryColor, logoUrl, steps]);

  const currentStep = steps[currentPage] || null;
  const totalSteps = steps.length;
  const canGoBack = currentPage > 0;
  const canGoNext = currentPage < totalSteps - 1;

  // Remove focus from any elements when preview is active and focus the main container
  useEffect(() => {
    // Only for prototype templates
    if (isQuestionTemplate || isApplicationStepTemplate) return;

    // Blur any currently focused elements (like tab buttons)
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Focus the main scroll container so arrow keys work immediately
    if (mainScrollRef.current) {
      mainScrollRef.current.focus();
    }
  }, [isQuestionTemplate, isApplicationStepTemplate]);

  // Keyboard navigation: left/right arrows to switch between steps (only for prototype templates)
  useEffect(() => {
    // Only enable keyboard navigation for prototype templates (not question or application step templates)
    if (isQuestionTemplate || isApplicationStepTemplate) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Only prevent navigation if user is actively typing in an input/textarea
      // Allow navigation even if buttons are focused (they will be blurred)
      if (isInputElement && document.activeElement === target) return;

      if (event.key === 'ArrowLeft' && canGoBack) {
        event.preventDefault();
        event.stopPropagation();
        setCurrentPage(p => p - 1);
      } else if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        event.stopPropagation();
        setCurrentPage(p => p + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [canGoBack, canGoNext, isQuestionTemplate, isApplicationStepTemplate]);

  // Scroll to top when page changes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Check if next button should be disabled (all elements must have values, except application cards)
  const isNextDisabled = useMemo(() => {
    if (!currentStep) return true;
    if (currentStep.elements.length === 0) return false;
    
    // Filter out application cards as they don't require selection
    const elementsToValidate = currentStep.elements.filter(el => el.type !== 'application_card');
    if (elementsToValidate.length === 0) return false;
    
    const allElementsValid = elementsToValidate.every(el => {
      const value = fieldValues[el.id];
      
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      return false;
    });
    return !allElementsValid;
  }, [currentStep, fieldValues]);

  const renderStep = () => {
    if (!currentStep) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg">No step to preview</p>
          </div>
        </div>
      );
    }

    const step = currentStep;
    const stepIndex = currentPage;
    // Application step header
    const applicationStepHeader = step.isApplicationStep || isApplicationStepTemplate ? (
      <div className="flex flex-col items-center w-full max-w-full" style={{ marginBottom: '32px' }}>
        <div className="flex flex-col items-center w-full max-w-full">
          {step.applicationStepHeading && (
            <h2
              className="text-center justify-center text-zinc-700 text-2xl font-semibold font-['Poppins'] leading-9"
              style={{
                marginBottom: step.applicationStepSubheading ? '8px' : '0',
                letterSpacing: '0.18px',
              }}
            >
              {step.applicationStepHeading}
            </h2>
          )}
          {step.applicationStepSubheading && (
            <p className="text-center w-full" style={{ fontSize: '16px', color: 'rgba(99, 112, 133, 1)' }}>
              {step.applicationStepSubheading}
            </p>
          )}
        </div>
      </div>
    ) : null;

    // Question and description header
    const questionHeader = !step.isApplicationStep && !isApplicationStepTemplate && (step.question || step.description) ? (
      <div className="flex flex-col items-center w-full max-w-full" style={{ marginBottom: '32px' }}>
        <div className="flex flex-col items-center w-full max-w-full">
          <div className="flex items-center justify-center gap-3 w-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border-2" style={{ borderColor: primaryColor }}>
              <span className="text-lg font-normal leading-none text-black">{stepIndex + 1}</span>
            </div>
            {step.question && (
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
                {step.question}
              </h2>
            )}
          </div>
          {step.description && (
            <p className="text-gray-500 text-base font-normal font-['Poppins'] leading-6 tracking-tight text-center w-full" style={{ marginTop: '8px' }}>
              {step.description}
            </p>
          )}
        </div>
      </div>
    ) : null;

    const isSplitScreen = step.splitScreenWithImage && step.imageUrl;
    const imagePosition = step.imagePosition || 'right';

    // Render elements
    const renderElements = (isSplitScreen: boolean = false) => {
      const fieldTypes = ['text_field', 'dropdown', 'calendar_field', 'checkboxes'];
      const fieldElements = step.elements.filter(el => fieldTypes.includes(el.type));
      const hasMultipleFields = fieldElements.length > 1;

      return (
        <div className={`w-full flex flex-col ${isSplitScreen ? 'items-start' : 'items-center'}`}>
          {step.elements.map((el, index) => {
            const isFieldElement = fieldTypes.includes(el.type);
            const prevElement = index > 0 ? step.elements[index - 1] : null;
            const prevIsFieldElement = prevElement ? fieldTypes.includes(prevElement.type) : false;
            const baseGapStyle = index > 0 ? { marginTop: '24px' } : {};
            const fieldGapStyle = (isFieldElement && prevIsFieldElement && hasMultipleFields)
              ? { ...baseGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
              : (isFieldElement && hasMultipleFields && !prevIsFieldElement)
                ? {}
                : {};

            if (el.type === 'text_field') {
              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <TextField
                      label={el.config.label || 'Label'}
                      showLabel={!!el.config.hasLabel}
                      value={typeof fieldValues[el.id] === 'string' ? fieldValues[el.id] as string : ''}
                      onChange={(val) => setFieldValues(v => ({ ...v, [el.id]: val }))}
                      placeholder={el.config.placeholder || 'Placeholder'}
                      primaryColor={primaryColor}
                    />
                  </div>
                </div>
              );
            }

            if (el.type === 'dropdown') {
              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : { width: '680px', margin: '0 auto', padding: '0' };

              const selectionType = el.config.selectionType || 'single';
              const maxSelection = el.config.maxSelection || 1;
              const multiSelect = selectionType === 'multiple';

              const currentValue = fieldValues[el.id];
              const normalizedValue = multiSelect
                ? (Array.isArray(currentValue) ? currentValue : (typeof currentValue === 'string' && currentValue ? [currentValue] : []))
                : (typeof currentValue === 'string' ? currentValue : (Array.isArray(currentValue) && currentValue.length > 0 ? currentValue[0] : ''));

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <DropdownField
                      value={normalizedValue}
                      onChange={(val) => setFieldValues(v => ({ ...v, [el.id]: val }))}
                      placeholder={el.config.placeholder || 'Select an option'}
                      primaryColor={primaryColor}
                      options={el.config.options || []}
                      label={el.config.label || 'Label'}
                      showLabel={!!el.config.hasLabel}
                      multiSelect={multiSelect}
                      maxSelection={maxSelection}
                    />
                  </div>
                </div>
              );
            }

            if (el.type === 'calendar_field') {
              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <CalendarField
                      label={el.config.label || 'Label'}
                      showLabel={!!el.config.hasLabel}
                      value={typeof fieldValues[el.id] === 'string' ? fieldValues[el.id] as string : ''}
                      onChange={(val) => setFieldValues(v => ({ ...v, [el.id]: val }))}
                      placeholder={el.config.placeholder || 'Placeholder'}
                      primaryColor={primaryColor}
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

              let gridCols = 'grid-cols-1';
              if (isSplitScreen) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 2 || numCards === 3) {
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
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  if (isSelected) {
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
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

              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : numCards === 3
                  ? { width: '1152px', margin: '0 auto', padding: '0' }
                  : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <div className={`grid ${gridCols} gap-[24px]`}>
                      {options.map((opt: OptionType) => (
                        <SimpleCard
                          key={opt.id}
                          title={opt.title || 'Option'}
                          selected={isCardSelected(opt.id)}
                          onSelect={() => handleCardSelect(opt.id)}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </div>
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

              let gridCols = 'grid-cols-1';
              if (isSplitScreen) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 2 || numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 3) {
                gridCols = 'grid-cols-3';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }

              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  if (isSelected) {
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
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

              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : (numCards === 2 || numCards === 3 || numCards === 4)
                  ? { width: '1152px', margin: '0 auto', padding: '0' }
                  : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <div className={`grid ${gridCols} gap-[24px]`}>
                      {options.map((opt: OptionType) => (
                        <ImageCard
                          key={opt.id}
                          id={opt.id}
                          title={opt.title || 'Option'}
                          description={opt.description}
                          imageUrl={opt.imageUrl || ''}
                          selected={isCardSelected(opt.id)}
                          onSelect={() => handleCardSelect(opt.id)}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </div>
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
                    setFieldValues(v => ({ ...v, [el.id]: [optId] }));
                  } else {
                    if (currentValues.length < maxSelection) {
                      const newValues = [...currentValues, optId];
                      setFieldValues(v => ({ ...v, [el.id]: newValues }));
                    }
                  }
                }
              };

              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle} className="space-y-3">
                    {options.map((opt: OptionType) => {
                      const isSelected = currentValues.includes(opt.id);
                      const isDisabled = !isSelected &&
                        selectionType === 'multiple' &&
                        currentValues.length >= maxSelection;
                      const checkboxKey = `${el.id}-${opt.id}`;
                      const isHovered = hoveredCheckbox === checkboxKey && !isDisabled;

                      let borderColor: string;
                      if (isDisabled) {
                        borderColor = '#E5E7EB';
                      } else if (isHovered) {
                        borderColor = '#9CA3AF';
                      } else {
                        borderColor = '#E5E7EB';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`w-full self-stretch p-4 bg-white rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex justify-start items-center gap-2.5 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          style={{ outlineColor: borderColor }}
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
                              primaryColor={primaryColor}
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

              let gridCols = 'grid-cols-1';
              if (isSplitScreen) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 2 || numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 3) {
                gridCols = 'grid-cols-3';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }

              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  if (isSelected) {
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
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

              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : (numCards === 2 || numCards === 3 || numCards === 4)
                  ? { width: '1152px', margin: '0 auto', padding: '0' }
                  : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <div className={`grid ${gridCols} gap-[24px]`}>
                      {options.map((opt: OptionType) => (
                        <AdvancedCard
                          key={opt.id}
                          id={opt.id}
                          heading={opt.heading || ''}
                          mainText={opt.mainText || ''}
                          linkSupportingText={opt.linkSupportingText}
                          linkEnabled={opt.linkEnabled || false}
                          linkUrl={opt.linkUrl || ''}
                          linkText={opt.linkText || 'Learn more'}
                          selected={isCardSelected(opt.id)}
                          onSelect={() => handleCardSelect(opt.id)}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </div>
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

              let gridCols = 'grid-cols-1';
              if (isSplitScreen) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 2 || numCards === 4) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 3) {
                gridCols = 'grid-cols-3';
              } else if (numCards >= 5) {
                gridCols = 'grid-cols-3';
              }

              const handleCardSelect = (optId: string) => {
                if (selectionType === 'single') {
                  setFieldValues(v => ({ ...v, [el.id]: optId }));
                } else {
                  const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                  const isSelected = currentValues.includes(optId);
                  if (isSelected) {
                    const newValues = currentValues.filter(id => id !== optId);
                    setFieldValues(v => ({ ...v, [el.id]: newValues }));
                  } else {
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

              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : (numCards === 2 || numCards === 3 || numCards === 4)
                  ? { width: '1152px', margin: '0 auto', padding: '0' }
                  : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <div className={`grid ${gridCols} gap-[24px]`}>
                      {options.map((opt: OptionType) => (
                        <ImageOnlyCard
                          key={opt.id}
                          id={opt.id}
                          imageUrl={opt.imageUrl || ''}
                          selected={isCardSelected(opt.id)}
                          onSelect={() => handleCardSelect(opt.id)}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (el.type === 'yes_no_cards') {
              const yesText = el.config.yesText || 'Yes';
              const noText = el.config.noText || 'No';
              const value = fieldValues[el.id];

              const handleYesNoSelect = (selected: 'yes' | 'no') => {
                setFieldValues(v => ({ ...v, [el.id]: selected }));
              };

              const containerStyle = isSplitScreen
                ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                : hasMultipleFields
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                  : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              const wrapperStyle = isSplitScreen
                ? { width: '100%', margin: '0', padding: '0' }
                : { width: '680px', margin: '0 auto', padding: '0' };

              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    <YesNoCards
                      yesText={yesText}
                      noText={noText}
                      selected={value === 'yes' ? 'yes' : value === 'no' ? 'no' : null}
                      onSelect={handleYesNoSelect}
                      primaryColor={primaryColor}
                    />
                  </div>
                </div>
              );
            }

            if (el.type === 'application_card') {
              const options = el.config.options || [];
              const numCards = options.length;
              
              // Determine grid columns based on number of cards
              // In split screen mode, use 2 columns per row
              // For more than 3 cards: always use 3 columns per row
              let gridCols = 'grid-cols-1';
              if (isSplitScreen) {
                gridCols = 'grid-cols-2';
              } else if (numCards === 2 || numCards === 3) {
                gridCols = `grid-cols-${numCards}`;
              } else if (numCards > 3) {
                gridCols = 'grid-cols-3';
              }
              
              // For application steps, add 32px spacing between text fields and application cards
              // Check if previous element is a text_field and this is an application step
              const previousElement = index > 0 ? step.elements[index - 1] : null;
              const isAfterTextField = previousElement?.type === 'text_field';
              // Text fields have marginBottom: 120px, gap is 24px. Current spacing = 144px
              // To get 32px total: marginTop = 32px - 24px - 120px = -112px
              // This offsets the text marginBottom and gap to achieve 32px total spacing
              const spacingOverride = ((step.isApplicationStep || isApplicationStepTemplate) && isAfterTextField && !isSplitScreen)
                ? { marginTop: '-112px' } // Offset to achieve 32px total spacing (120 + 24 - 112 = 32)
                : {};
              
              // If there are multiple fields, remove all margins/padding except 24px gap between fields
              // For application steps, use special spacing logic
              const containerStyle = (step.isApplicationStep || isApplicationStepTemplate)
                ? { ...baseGapStyle, ...spacingOverride, padding: '0', marginBottom: '0', display: 'block' }
                : isSplitScreen 
                  ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block', width: '100%' }
                  : hasMultipleFields 
                    ? { ...baseGapStyle, ...fieldGapStyle, padding: '0', marginBottom: '0', display: 'block' }
                    : { ...baseGapStyle, marginTop: index === 0 ? '120px' : '24px', marginBottom: '120px', padding: '0', display: 'block' };
              // Calculate wrapper width based on number of cards
              // Each card is 368px, gap is 24px between cards
              // 1 card: 680px (for centering)
              // 2 cards: 368px * 2 + 24px = 760px
              // 3 cards: 368px * 3 + 24px * 2 = 1152px
              // 4+ cards: 368px * 3 + 24px * 2 = 1152px (3 columns max)
              let wrapperWidth = '680px';
              if (numCards === 2) {
                wrapperWidth = '760px';
              } else if (numCards >= 3) {
                wrapperWidth = '1152px';
              }
              
              const wrapperStyle = isSplitScreen 
                ? { width: '100%', margin: '0', padding: '0' }
                : { width: wrapperWidth, margin: '0 auto', padding: '0' };
              
              // Use flexbox with fixed width for 1 or 2 cards, grid for others
              // In split screen mode, always use grid with 2 columns
              const useFixedWidth = !isSplitScreen && (numCards === 1 || numCards === 2);
              
              return (
                <div key={el.id} style={containerStyle}>
                  <div style={wrapperStyle}>
                    {useFixedWidth ? (
                      <div className="flex justify-center gap-[24px]">
                        {options.map((opt: OptionType) => (
                          <div key={opt.id} style={{ width: '368px' }}>
                            <ApplicationCard
                              id={opt.id}
                              title={opt.title || 'Application'}
                              description={opt.description}
                              imageUrl={opt.imageUrl}
                              primaryColor={primaryColor}
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
                    ) : (
                      <div className={`grid ${gridCols} justify-center gap-[24px]`}>
                        {options.map((opt: OptionType) => (
                          <div key={opt.id} style={{ width: '368px' }}>
                            <ApplicationCard
                              id={opt.id}
                              title={opt.title || 'Application'}
                              description={opt.description}
                              imageUrl={opt.imageUrl}
                              primaryColor={primaryColor}
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
                </div>
              );
            }

            return null;
          })}
        </div>
      );
    };

    // If split screen is enabled, show question header at top, then image and elements side by side
    if (isSplitScreen && step.imageUrl) {
      const imageSection = (
        <div className="flex flex-col">
          <img 
            src={step.imageUrl} 
            alt="Step visual" 
            className="w-full h-80 object-cover rounded-[16px] shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)]" 
          />
          {step.imageHasTitle && (step.imageTitle || step.imageSubtitle) && (
            <div className="mt-4">
              {step.imageTitle && (
                <h3 
                  className="text-lg font-semibold mb-1"
                  style={{ color: '#353B46' }}
                >
                  {step.imageTitle}
                </h3>
              )}
              {step.imageSubtitle && (
                <p 
                  className="text-sm"
                  style={{ color: '#353B46' }}
                >
                  {step.imageSubtitle}
                </p>
              )}
            </div>
          )}
        </div>
      );

      return (
        <div className="flex flex-col items-center">
          {step.isApplicationStep || isApplicationStepTemplate ? applicationStepHeader : questionHeader}
          <div className="grid grid-cols-1 md:grid-cols-2 items-start w-full" style={{ gap: '32px' }}>
            {step.imagePosition === 'left' ? (
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
        {step.isApplicationStep || isApplicationStepTemplate ? applicationStepHeader : questionHeader}
        <div className="w-full">
          {renderElements(false)}
        </div>
      </div>
    );
  };

  if (steps.length === 0) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: '#F8F9FB' }}>
        <div className="fixed top-0 left-0 right-0 z-30 bg-white">
          <PrototypeHeader 
            prototype={mockPrototype}
            onEdit={() => {}}
            onExit={() => {}}
            showActions={false}
          />
        </div>
        <div className="flex items-center justify-center min-h-[400px] flex-1 pt-[73px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg">No steps to preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F8F9FB' }}>
      <div className="fixed top-0 left-0 right-0 z-30 bg-white">
        <PrototypeHeader 
          prototype={mockPrototype}
          onEdit={() => {}}
          onExit={() => {}}
          showActions={false}
        />
      </div>

      <main 
        ref={mainScrollRef} 
        className="flex-1 overflow-y-auto" 
        style={{ backgroundColor: '#F8F9FB', paddingTop: '73px', paddingBottom: '81px' }}
        tabIndex={-1}
      >
        <div className="flex items-start justify-center p-0 min-h-full">
          <div className="w-full max-w-[1152px] mx-auto" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            {renderStep()}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white">
        <Footer
          onExit={() => {}}
          showExit={false}
          onNext={() => setCurrentPage(p => p + 1)}
          onBack={() => setCurrentPage(p => p - 1)}
          canGoBack={canGoBack && !isQuestionTemplate && !isApplicationStepTemplate}
          canGoNext={canGoNext && !isQuestionTemplate && !isApplicationStepTemplate}
          primaryColor={primaryColor}
          isNextDisabled={isNextDisabled}
          isApplicationStep={currentStep?.isApplicationStep || isApplicationStepTemplate || false}
        />
      </div>
    </div>
  );
}

