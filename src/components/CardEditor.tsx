import React, { useRef, useEffect, useState } from 'react';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Element } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCardOption } from './SortableCardOption';
import { dndLog, dndWarn } from '../utils/dndDebug';

type OptionType = NonNullable<Element['config']['options']>[number];
import SelectionConfiguration from './SelectionConfiguration';
import TextButton from './TextButton';
import FileUploader from './FileUploader';
import EditorField from './EditorField';
import TabControl from './TabControl';
import SystemField from './SystemField';
import Checkbox from './Checkbox';

interface CardEditorProps {
  element: Element;
  stepIndex: number;
  onUpdateElement: (stepIndex: number, elementId: string, updates: Partial<Element>) => void;
  onDeleteElement?: (stepIndex: number, elementId: string) => void | Promise<void>;
  primaryColor: string;
  showSelectionConfig?: boolean;
  disableAddCard?: boolean;
}

export default function CardEditor({ 
  element, 
  stepIndex, 
  onUpdateElement,
  onDeleteElement,
  primaryColor,
  showSelectionConfig = true,
  disableAddCard = false
}: CardEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newlyAddedCardOptionId, setNewlyAddedCardOptionId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const autoExpandedElementIdsRef = useRef<Set<string>>(new Set());
  // Track latest element config to avoid stale closures in SelectionConfiguration callbacks
  const elementConfigRef = useRef(element.config);

  // Configure sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Update ref whenever element changes
  useEffect(() => {
    elementConfigRef.current = element.config;
  }, [element.config]);

  const addCardOption = () => {
    const currentOptions = element.config.options || [];
    
    // For checkboxes, only allow one option
    if (element.type === 'checkboxes' && currentOptions.length >= 1) {
      return;
    }
    
    // For application_card, if this is the first card (no cards exist), ensure only one is added
    if (element.type === 'application_card' && currentOptions.length === 0) {
      const newOption = {
        id: crypto.randomUUID(),
        jobTitle: '',
        location: '',
        department: '',
        jobType: '',
        jobId: '',
        jobDescription: ''
      };
      setNewlyAddedCardOptionId(newOption.id);
      onUpdateElement(stepIndex, element.id, { config: { ...element.config, options: [newOption] } });
      return;
    }
    
    let newOption: OptionType;
    if (element.type === 'advanced_cards') {
      newOption = {
        id: crypto.randomUUID(),
        heading: '',
        mainText: '',
        linkSupportingText: '',
        linkEnabled: false,
        linkUrl: '',
        linkText: 'Learn more'
      };
    } else if (element.type === 'application_card') {
      newOption = {
        id: crypto.randomUUID(),
        jobTitle: '',
        location: '',
        department: '',
        jobType: '',
        jobId: '',
        jobDescription: ''
      };
      setNewlyAddedCardOptionId(newOption.id);
    } else {
      newOption = { id: crypto.randomUUID(), title: '' };
    }
    const options = [...currentOptions, newOption];
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const deleteCardOption = async (optionId: string) => {
    // Sub-items (card options) delete immediately without confirmation
    const options = (element.config.options || []).filter((opt: OptionType) => opt.id !== optionId);
    
    // Check if element should be deleted when it has no options left
    // Only delete elements that require options (cards, checkboxes, dropdown)
    const elementTypesRequiringOptions: Element['type'][] = [
      'simple_cards',
      'image_cards',
      'image_only_card',
      'advanced_cards',
      'application_card',
      'checkboxes',
      'dropdown'
    ];
    
    const shouldAutoDelete = elementTypesRequiringOptions.includes(element.type) && options.length === 0;
    
    if (shouldAutoDelete && onDeleteElement) {
      // Auto-delete the element when all options are removed
      console.log('[DELETE CARD OPTION] Auto-deleting element because it has no options left:', {
        elementId: element.id,
        elementType: element.type,
        stepIndex
      });
      await onDeleteElement(stepIndex, element.id);
    } else {
      // Update element with remaining options
      onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    dndLog('Drag started:', active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    dndLog('Drag ended:', { activeId: active.id, overId: over?.id });

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const options = element.config.options || [];
    const oldIndex = options.findIndex((o: OptionType) => o.id === active.id);
    const newIndex = options.findIndex((o: OptionType) => o.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      dndWarn('Invalid indices:', { oldIndex, newIndex });
      setActiveId(null);
      return;
    }

    // Quality check: ensure we have valid options before reordering
    if (options.length === 0) {
      dndWarn('Cannot reorder: no options available');
      setActiveId(null);
      return;
    }

    const newOptions = arrayMove(options, oldIndex, newIndex);
    
    // Quality check: verify the reorder resulted in correct length
    if (newOptions.length !== options.length) {
      dndError('Reorder error: length mismatch', { 
        original: options.length, 
        reordered: newOptions.length 
      });
      setActiveId(null);
      return;
    }

    dndLog('Reordering:', { from: oldIndex, to: newIndex, total: newOptions.length });
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options: newOptions } });
    setActiveId(null);
  };

  const handleDragCancel = () => {
    dndLog('Drag cancelled');
    setActiveId(null);
  };

  const updateOptionTitle = (optionId: string, title: string) => {
    const options = (element.config.options || []).map((o: OptionType) =>
      o.id === optionId ? { ...o, title } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleOptionImageUpload = (optionId: string, _file: File | null, fileInfo: { name: string; size: number; dataUrl: string }) => {
    const options = (element.config.options || []).map((o: OptionType) =>
      o.id === optionId ? { ...o, imageUrl: fileInfo?.dataUrl || '' } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleOptionImageUploadModeChange = (optionId: string, uploadMode: 'upload' | 'url') => {
    const options = (element.config.options || []).map((o: OptionType) =>
      o.id === optionId ? { ...o, imageUploadMode: uploadMode } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleOptionImageUrlChange = (optionId: string, imageUrl: string) => {
    const options = (element.config.options || []).map((o: OptionType) =>
      o.id === optionId ? { ...o, imageUrl } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const updateAdvancedCardOption = (optionId: string, field: string, value: string | boolean) => {
    const options = (element.config.options || []).map((o: OptionType) =>
      o.id === optionId ? { ...o, [field]: value } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleMultipleImageUpload = (fileInfos: Array<{ name: string; size: number; dataUrl: string }>, currentOptionId?: string) => {
    if (fileInfos.length === 0) return;

    const currentOptions = element.config.options || [];
    let updatedOptions = [...currentOptions];

    // If there's a current option and it doesn't have an image, update it with the first image
    if (currentOptionId && fileInfos.length > 0) {
      const currentOption = updatedOptions.find((o: OptionType) => o.id === currentOptionId);
      if (currentOption && !currentOption.imageUrl) {
        // Update current card with first image
        updatedOptions = updatedOptions.map((o: OptionType) =>
          o.id === currentOptionId
            ? { ...o, imageUrl: fileInfos[0].dataUrl, imageUploadMode: 'upload' as const }
            : o
        );
        // Create new cards for remaining images
        const remainingFileInfos = fileInfos.slice(1);
        if (remainingFileInfos.length > 0) {
          const newOptions = remainingFileInfos.map((fileInfo) => ({
            id: crypto.randomUUID(),
            title: '',
            imageUrl: fileInfo.dataUrl,
            imageUploadMode: 'upload' as const
          }));
          updatedOptions = [...updatedOptions, ...newOptions];
        }
      } else {
        // Current card already has an image, create new cards for all images
        const newOptions = fileInfos.map((fileInfo) => ({
          id: crypto.randomUUID(),
          title: '',
          imageUrl: fileInfo.dataUrl,
          imageUploadMode: 'upload' as const
        }));
        updatedOptions = [...updatedOptions, ...newOptions];
      }
    } else {
      // No current option, create cards for all images
      const newOptions = fileInfos.map((fileInfo) => ({
        id: crypto.randomUUID(),
        title: '',
        imageUrl: fileInfo.dataUrl,
        imageUploadMode: 'upload' as const
      }));
      updatedOptions = [...updatedOptions, ...newOptions];
    }

    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options: updatedOptions } });
  };

  // Ensure advanced_cards has at least one option
  const options = element.config.options || [];
  
  useEffect(() => {
    if (element.type === 'advanced_cards' && options.length === 0) {
      // Auto-create first option for advanced_cards if none exist
      const newOption = {
        id: crypto.randomUUID(),
        heading: '',
        mainText: '',
        linkSupportingText: '',
        linkEnabled: false,
        linkUrl: '',
        linkText: 'Learn more'
      };
      onUpdateElement(stepIndex, element.id, { config: { ...element.config, options: [newOption] } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.type, element.id, options.length]);

  // Scroll to newly added application card option and expand it
  useEffect(() => {
    if (newlyAddedCardOptionId && element.type === 'application_card') {
      // Expand the newly added card
      setExpandedCards(prev => new Set(prev).add(newlyAddedCardOptionId));
      
      const cardElement = document.getElementById(`card-option-${newlyAddedCardOptionId}`);
      if (cardElement) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          cardElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          setNewlyAddedCardOptionId(null);
        }, 100);
      }
    }
  }, [newlyAddedCardOptionId, element.type]);

  // Auto-expand first option when application_card element is first added with options
  useEffect(() => {
    if (element.type === 'application_card' && options.length > 0) {
      // Check if we've already auto-expanded for this element
      if (!autoExpandedElementIdsRef.current.has(element.id)) {
        const firstOptionId = options[0]?.id;
        if (firstOptionId && !expandedCards.has(firstOptionId)) {
          // Expand the first option when the element is first rendered with options
          setExpandedCards(prev => new Set(prev).add(firstOptionId));
          autoExpandedElementIdsRef.current.add(element.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.id]);

  // Auto-initialize maxSelection for dropdowns with multi-choice enabled
  // Only initialize if selectionType is 'multiple' and maxSelection is truly unset
  useEffect(() => {
    if (element.type === 'dropdown' && element.config.selectionType === 'multiple' && showSelectionConfig) {
      const maxOptions = element.config.options?.length || 10;
      const currentMaxSelection = element.config.maxSelection;
      
      // Only set if maxSelection is completely unset (undefined or null)
      // Don't override if it's already set (even if < 2, let SelectionConfiguration handle it)
      if (currentMaxSelection === undefined || currentMaxSelection === null) {
        onUpdateElement(stepIndex, element.id, {
          config: { ...element.config, maxSelection: maxOptions }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.type, element.id, element.config.selectionType, showSelectionConfig]);

  return (
    <div className="mt-2 space-y-2">
      {/* Empty state for application_card when no cards exist */}
      {element.type === 'application_card' && options.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-3">No cards added yet</p>
          <div className="flex justify-center">
            {!disableAddCard && (
              <TextButton
                onClick={addCardOption}
                size="sm"
              >
                <Plus size={16} />
                Add card
              </TextButton>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Card Options with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={options.map((o: OptionType) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              {options.map((opt: OptionType, idx: number) => {
                const canDrag = options.length > 1;
                return (
                  <SortableCardOption
                    key={opt.id}
                    id={opt.id}
                    disabled={!canDrag}
                    className="mb-2"
                  >
                    {({ attributes, listeners, isDragging }) => (
                      <div
                        id={element.type === 'application_card' ? `card-option-${opt.id}` : undefined}
                        className={`border border-gray-200 rounded-lg p-3 space-y-3 transition-all ${
                          element.type === 'application_card' ? 'bg-gray-100' : 'bg-white'
                        } ${isDragging ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {canDrag && (
                            <span
                              {...attributes}
                              {...listeners}
                              className="inline-flex cursor-grab active:cursor-grabbing touch-none"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={16} className="text-gray-400 hover:text-gray-600 pointer-events-none" />
                            </span>
                          )}
            {element.type !== 'image_only_card' && element.type !== 'advanced_cards' && element.type !== 'application_card' && (
              <EditorField
                value={opt.title || ''}
                onChange={(value) => updateOptionTitle(opt.id, value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1"
              />
            )}
            {element.type === 'image_only_card' && (
              <span className="text-sm font-medium flex-1" style={{ color: '#464F5E' }}>Image Only Card {idx + 1}</span>
            )}
            {element.type === 'advanced_cards' && (
              <span className="text-sm font-medium flex-1" style={{ color: '#464F5E' }}>Advanced Card {idx + 1}</span>
            )}
            {element.type === 'application_card' && (
              <span className="text-sm font-medium flex-1" style={{ color: '#464F5E' }}>Application Card {idx + 1}</span>
            )}
            {element.type === 'application_card' && (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedCards);
                  if (newExpanded.has(opt.id)) {
                    newExpanded.delete(opt.id);
                  } else {
                    newExpanded.add(opt.id);
                  }
                  setExpandedCards(newExpanded);
                }}
                className="p-0"
              >
                {expandedCards.has(opt.id) ? (
                  <ChevronUp size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await deleteCardOption(opt.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {/* Image upload for image_cards */}
          {element.type === 'image_cards' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                Card Image
              </label>
              <div className="mb-3">
                <TabControl
                  options={[
                    { value: 'upload', label: 'Upload' },
                    { value: 'url', label: 'URL' }
                  ]}
                  value={opt.imageUploadMode || 'upload'}
                  onChange={(value) => handleOptionImageUploadModeChange(opt.id, value as 'upload' | 'url')}
                />
              </div>
              {/* URL field using SystemField */}
              {opt.imageUploadMode === 'url' ? (
                <SystemField
                  type="url"
                  value={opt.imageUrl || ''}
                  onChange={(value) => handleOptionImageUrlChange(opt.id, value)}
                  placeholder="https://example.com/image.jpg"
                  showLabel={false}
                />
              ) : (
                <FileUploader
                  value={opt.imageUrl ? { name: 'Uploaded image', size: 0, dataUrl: opt.imageUrl } : undefined}
                  onChange={(file, fileInfo) => handleOptionImageUpload(opt.id, file, fileInfo)}
                  accept="image/*"
                  maxSize={3}
                  showPreview={true}
                />
              )}
            </div>
          )}

          {/* Image upload for image_only_card */}
          {element.type === 'image_only_card' && (
            <div
              onDragStart={(e) => {
                // Prevent card dragging when interacting with file uploader
                if ((e.target as HTMLElement).closest('.file-uploader-area')) {
                  return;
                }
                e.stopPropagation();
              }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                Card Image
              </label>
              <div className="mb-3">
                <TabControl
                  options={[
                    { value: 'upload', label: 'Upload' },
                    { value: 'url', label: 'URL' }
                  ]}
                  value={opt.imageUploadMode || 'upload'}
                  onChange={(value) => handleOptionImageUploadModeChange(opt.id, value as 'upload' | 'url')}
                />
              </div>
              {/* URL field using SystemField */}
              {opt.imageUploadMode === 'url' ? (
                <SystemField
                  type="url"
                  value={opt.imageUrl || ''}
                  onChange={(value) => handleOptionImageUrlChange(opt.id, value)}
                  placeholder="https://example.com/image.jpg"
                  showLabel={false}
                />
              ) : (
                <div className="file-uploader-area">
                  <FileUploader
                    value={opt.imageUrl ? { name: 'Uploaded image', size: 0, dataUrl: opt.imageUrl } : undefined}
                    onChange={(file, fileInfo) => handleOptionImageUpload(opt.id, file, fileInfo)}
                    onMultipleChange={disableAddCard ? undefined : (_files, fileInfos) => handleMultipleImageUpload(fileInfos, opt.id)}
                    accept="image/*"
                    maxSize={3}
                    showPreview={true}
                    multiple={!disableAddCard}
                  />
                </div>
              )}
            </div>
          )}

          {/* Advanced cards configuration */}
          {element.type === 'advanced_cards' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Heading
                </label>
                <EditorField
                  value={opt.heading || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'heading', value)}
                  placeholder="Enter heading"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Main text
                </label>
                <EditorField
                  value={opt.mainText || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'mainText', value)}
                  placeholder="Enter main text"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Link supporting text
                </label>
                <EditorField
                  value={opt.linkSupportingText || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'linkSupportingText', value)}
                  placeholder="Enter link supporting text"
                  className="w-full"
                />
              </div>

              <div>
                <Checkbox
                  id={`link-enabled-${opt.id}`}
                  checked={opt.linkEnabled || false}
                  onChange={(e) => updateAdvancedCardOption(opt.id, 'linkEnabled', e.target.checked)}
                  label="Enable link"
                  size="sm"
                />
              </div>

              {opt.linkEnabled && (
                <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                      Link URL
                    </label>
                    <SystemField
                      type="url"
                      value={opt.linkUrl || ''}
                      onChange={(value) => updateAdvancedCardOption(opt.id, 'linkUrl', value)}
                      placeholder="https://example.com"
                      showLabel={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                      Link text
                    </label>
                    <EditorField
                      value={opt.linkText || 'Learn more'}
                      onChange={(value) => updateAdvancedCardOption(opt.id, 'linkText', value)}
                      placeholder="Learn more"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Application card configuration */}
          {element.type === 'application_card' && expandedCards.has(opt.id) && (
            <div 
              className="space-y-3" 
              style={{ border: 'none' }}
              onDragStart={(e) => {
                // Prevent card dragging when interacting with form fields
                e.stopPropagation();
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Job Title
                </label>
                <EditorField
                  value={opt.jobTitle || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'jobTitle', value)}
                  placeholder="Enter Job Title"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Location
                </label>
                <EditorField
                  value={opt.location || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'location', value)}
                  placeholder="Enter Location"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Department
                </label>
                <EditorField
                  value={opt.department || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'department', value)}
                  placeholder="Enter Department"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Job Type
                </label>
                <SystemField
                  type="dropdown"
                  value={opt.jobType || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'jobType', value)}
                  placeholder="Select Job Type"
                  showLabel={false}
                  options={[
                    { id: 'Full-time', title: 'Full-time' },
                    { id: 'Part-time', title: 'Part-time' },
                    { id: 'Remote', title: 'Remote' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Job ID
                </label>
                <EditorField
                  value={opt.jobId || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'jobId', value)}
                  placeholder="Enter Job ID"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                  Job Description
                </label>
                <SystemField
                  type="textarea"
                  value={opt.jobDescription || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'jobDescription', value)}
                  placeholder="Enter Job Description"
                  showLabel={false}
                  rows={4}
                  className="w-full overflow-y-auto"
                />
              </div>

              <div className="pt-3">
                <label className="block text-base font-medium mb-4" style={{ color: '#464F5E' }}>
                  Button Configuration
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                      Primary Button Link (Apply)
                    </label>
                    <SystemField
                      type="url"
                      value={opt.primaryButtonLink || ''}
                      onChange={(value) => updateAdvancedCardOption(opt.id, 'primaryButtonLink', value)}
                      placeholder="https://example.com/apply"
                      showLabel={false}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#464F5E' }}>
                      Learn More Button Link (View details)
                    </label>
                    <SystemField
                      type="url"
                      value={opt.learnMoreButtonLink || ''}
                      onChange={(value) => updateAdvancedCardOption(opt.id, 'learnMoreButtonLink', value)}
                      placeholder="https://example.com/details"
                      showLabel={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
                      </div>
                    )}
                  </SortableCardOption>
                );
              })}
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="border border-blue-400 rounded-lg p-3 bg-white shadow-lg opacity-90 rotate-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      {options.find((o: OptionType) => o.id === activeId)?.title || 'Card'}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Add Card Button */}
          {!disableAddCard && !(element.type === 'checkboxes' && (element.config.options || []).length >= 1) && (
            <TextButton
              onClick={addCardOption}
              size="sm"
            >
              <Plus size={16} />
              {element.type === 'dropdown' ? 'Add option' : element.type === 'checkboxes' ? 'Add checkbox' : 'Add card'}
            </TextButton>
          )}
        </>
      )}

      {/* Multi-choice toggle for dropdowns - appears after options, before SelectionConfiguration */}
      {element.type === 'dropdown' && (
        <div className="mt-4">
          <Checkbox
            id={`multi-choice-${element.id}`}
            checked={element.config.selectionType === 'multiple'}
            onChange={(e) =>
              onUpdateElement(stepIndex, element.id, {
                config: {
                  ...element.config,
                  selectionType: e.target.checked ? 'multiple' : 'single',
                  // When enabling multi-choice, set default maxSelection to maxOptions (unlimited)
                  maxSelection: e.target.checked
                    ? (element.config.options?.length || 10)
                    : element.config.maxSelection,
                },
              })
            }
            label="Enable multi-choice"
          />
        </div>
      )}

      {/* Selection Configuration */}
      {showSelectionConfig && (() => {
        const maxOptions = element.config.options?.length || 10;
        // For dropdowns, pass the actual maxSelection value - SelectionConfiguration will handle the logic
        const maxSelection = element.config.maxSelection;
        
        return (
          <SelectionConfiguration
            elementId={element.id}
            selectionType={element.config.selectionType}
            maxSelection={maxSelection}
            maxOptions={maxOptions}
            primaryColor={primaryColor}
            itemLabel={element.type === 'dropdown' ? 'option' : 'card'}
            isDropdown={element.type === 'dropdown'}
            onCombinedChange={(updates) => {
              // Use combined callback to update both values atomically
              // Use ref to get latest config, avoiding stale closure
              const currentConfig = elementConfigRef.current;
              onUpdateElement(stepIndex, element.id, {
                config: { 
                  ...currentConfig, 
                  ...(updates.selectionType !== undefined && { selectionType: updates.selectionType }),
                  ...(updates.maxSelection !== undefined && { maxSelection: updates.maxSelection })
                }
              });
            }}
            onSelectionTypeChange={(selectionType) => {
              // Fallback for non-dropdowns or when onCombinedChange is not used
              const currentConfig = elementConfigRef.current;
              onUpdateElement(stepIndex, element.id, {
                config: { ...currentConfig, selectionType }
              });
            }}
            onMaxSelectionChange={(newMaxSelection) => {
              // Fallback when onCombinedChange is not used
              const currentConfig = elementConfigRef.current;
              onUpdateElement(stepIndex, element.id, {
                config: { ...currentConfig, maxSelection: newMaxSelection }
              });
            }}
          />
        );
      })()}
    </div>
  );
}
