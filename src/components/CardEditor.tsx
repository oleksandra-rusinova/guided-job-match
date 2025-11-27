import { useRef, useEffect, useState } from 'react';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Element } from '../types';
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
  primaryColor: string;
  showSelectionConfig?: boolean;
  disableAddCard?: boolean;
}

export default function CardEditor({ 
  element, 
  stepIndex, 
  onUpdateElement, 
  primaryColor,
  showSelectionConfig = true,
  disableAddCard = false
}: CardEditorProps) {
  const dragCardIdRef = useRef<string | null>(null);
  const [newlyAddedCardOptionId, setNewlyAddedCardOptionId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const autoExpandedElementIdsRef = useRef<Set<string>>(new Set());

  const addCardOption = () => {
    const currentOptions = element.config.options || [];
    
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
    
    let newOption: any;
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

  const deleteCardOption = (optionId: string) => {
    const options = (element.config.options || []).filter((opt: any) => opt.id !== optionId);
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleDragStart = (e: React.DragEvent, optionId: string) => {
    dragCardIdRef.current = optionId;
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', optionId);
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    try { 
      e.dataTransfer.dropEffect = 'move'; 
    } catch {}
  };

  const handleDrop = (e: React.DragEvent, targetOptionId: string) => {
    e.preventDefault();
    const draggedId = dragCardIdRef.current || e.dataTransfer.getData('text/plain');
    const options = [...(element.config.options || [])];
    const fromIndex = options.findIndex((o: any) => o.id === draggedId);
    const toIndex = options.findIndex((o: any) => o.id === targetOptionId);
    
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    
    const [moved] = options.splice(fromIndex, 1);
    options.splice(toIndex, 0, moved);
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
    dragCardIdRef.current = null;
  };

  const handleDragEnd = () => {
    dragCardIdRef.current = null;
  };

  const updateOptionTitle = (optionId: string, title: string) => {
    const options = (element.config.options || []).map((o: any) =>
      o.id === optionId ? { ...o, title } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleOptionImageUpload = (optionId: string, _file: File | null, fileInfo: any) => {
    const options = (element.config.options || []).map((o: any) =>
      o.id === optionId ? { ...o, imageUrl: fileInfo?.dataUrl || '' } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleOptionImageUploadModeChange = (optionId: string, uploadMode: 'upload' | 'url') => {
    const options = (element.config.options || []).map((o: any) =>
      o.id === optionId ? { ...o, imageUploadMode: uploadMode } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const handleOptionImageUrlChange = (optionId: string, imageUrl: string) => {
    const options = (element.config.options || []).map((o: any) =>
      o.id === optionId ? { ...o, imageUrl } : o
    );
    onUpdateElement(stepIndex, element.id, { config: { ...element.config, options } });
  };

  const updateAdvancedCardOption = (optionId: string, field: string, value: any) => {
    const options = (element.config.options || []).map((o: any) =>
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
      const currentOption = updatedOptions.find((o: any) => o.id === currentOptionId);
      if (currentOption && !currentOption.imageUrl) {
        // Update current card with first image
        updatedOptions = updatedOptions.map((o: any) =>
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

  return (
    <div className="mt-3 space-y-2">
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
          {/* Card Options */}
          {options.map((opt: any, idx: number) => (
        <div
          key={opt.id}
          id={element.type === 'application_card' ? `card-option-${opt.id}` : undefined}
          className={`border border-gray-200 rounded-lg p-3 space-y-3 ${element.type === 'application_card' ? 'bg-gray-100' : 'bg-white'}`}
          draggable
          onDragStart={(e) => handleDragStart(e, opt.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, opt.id)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-gray-400 cursor-grab" />
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
              onClick={() => deleteCardOption(opt.id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {/* Image upload for image_cards */}
          {element.type === 'image_cards' && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
                  onMultipleChange={disableAddCard ? undefined : (files, fileInfos) => handleMultipleImageUpload(fileInfos, opt.id)}
                  accept="image/*"
                  maxSize={3}
                  showPreview={true}
                  multiple={!disableAddCard}
                />
              )}
            </div>
          )}

          {/* Advanced cards configuration */}
          {element.type === 'advanced_cards' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
                <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
                <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
                    <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
                    <label className="block text-xs font-medium mb-1" style={{ color: '#464F5E' }}>
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
            <div className="space-y-3" style={{ border: 'none' }}>
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
                <EditorField
                  value={opt.jobDescription || ''}
                  onChange={(value) => updateAdvancedCardOption(opt.id, 'jobDescription', value)}
                  placeholder="Enter Job Description"
                  className="w-full"
                />
              </div>

              <div className="pt-3">
                <label className="block text-base font-semibold mb-4" style={{ color: '#464F5E' }}>
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
          ))}

          {/* Add Card Button */}
          {!disableAddCard && (
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

      {/* Selection Configuration */}
      {showSelectionConfig && (
        <SelectionConfiguration
          elementId={element.id}
          selectionType={element.config.selectionType}
          maxSelection={element.config.maxSelection}
          maxOptions={element.config.options?.length || 10}
          primaryColor={primaryColor}
          onSelectionTypeChange={(selectionType) => onUpdateElement(stepIndex, element.id, {
            config: { ...element.config, selectionType }
          })}
          onMaxSelectionChange={(maxSelection) => onUpdateElement(stepIndex, element.id, {
            config: { ...element.config, maxSelection }
          })}
        />
      )}
    </div>
  );
}
