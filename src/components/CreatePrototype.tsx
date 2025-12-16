import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, RotateCcw, Save, GripVertical, Bookmark, Pencil } from 'lucide-react';
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
import SystemMessageModal from './SystemMessageModal';
import Tooltip from './Tooltip';
import PresenceIndicator from './PresenceIndicator';
import { usePresence } from '../hooks/usePresence';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';
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
import { SortableItem } from './SortableItem';
import { dndLog, dndWarn, dndError } from '../utils/dndDebug';
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
  getTemplateStorageInfo,
  getStorageUsage,
} from '../utils/templates';
import { updatePrototype } from '../utils/storage';

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

  // Build current prototype state for auto-save
  const currentPrototype: Prototype | null = editingPrototype ? {
    id: editingPrototype.id,
    name,
    description,
    primaryColor,
    logoUrl: logoUploadMode === 'url' ? logoUrl : logoFile ? logoUrl : editingPrototype.logoUrl,
    logoUploadMode,
    steps,
    createdAt: editingPrototype.createdAt,
    updatedAt: new Date().toISOString(),
  } : null;

  // Auto-save when editing existing prototype
  const autoSaveResult = useAutoSave({
    prototype: currentPrototype,
    enabled: !!editingPrototype && !!editingPrototype.id,
    debounceMs: 1500, // 1.5 second debounce
    onSave: (savedPrototype) => {
      // Update local state if needed
      console.log('Auto-saved:', savedPrototype.name);
    },
  });
  const { isSaving, lastSaved, saveNow } = autoSaveResult;
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [openElementMenuStepId, setOpenElementMenuStepId] = useState<string | null>(null);
  const [newlyAddedElementId, setNewlyAddedElementId] = useState<string | null>(null);
  const [editingStepNameId, setEditingStepNameId] = useState<string | null>(null);
  const [editingStepNameValue, setEditingStepNameValue] = useState<string>('');
  const editingStepNameRef = useRef<HTMLDivElement | null>(null);

  // Handle clicks outside the editing field
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingStepNameId && editingStepNameRef.current && !editingStepNameRef.current.contains(event.target as Node)) {
        if (editingStepNameValue.trim()) {
          setSteps(prevSteps => 
            prevSteps.map(step => 
              step.id === editingStepNameId 
                ? { ...step, name: editingStepNameValue.trim() }
                : step
            )
          );
        }
        setEditingStepNameId(null);
        setEditingStepNameValue('');
      }
    };

    if (editingStepNameId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingStepNameId, editingStepNameValue]);
  const [newlyAddedStepId, setNewlyAddedStepId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [activeElementStepId, setActiveElementStepId] = useState<string | null>(null);

  // Configure sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Template-related state
  const [showQuestionTemplateModal, setShowQuestionTemplateModal] = useState(false);
  const [showPrototypeTemplateModal, setShowPrototypeTemplateModal] = useState(false);
  const [showApplicationStepTemplateModal, setShowApplicationStepTemplateModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateSelectorType, setTemplateSelectorType] = useState<'question' | 'prototype' | 'applicationStep'>('question');
  
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
  const [stepToSaveAsTemplate, setStepToSaveAsTemplate] = useState<string | null>(null);
  const [showAddStepDropdown, setShowAddStepDropdown] = useState(false);
  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>([]);
  const [prototypeTemplates, setPrototypeTemplates] = useState<PrototypeTemplate[]>([]);
  const [applicationStepTemplates, setApplicationStepTemplates] = useState<ApplicationStepTemplate[]>([]);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
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
      }
    };
    loadTemplates();
  }, []);

  // Store initial state for reset functionality
  // This captures the state when the component first mounts
  const initialStateRef = useRef<{
    name: string;
    description: string;
    primaryColor: string;
    logoUploadMode: 'upload' | 'url';
    logoUrl: string;
    steps: Step[];
  } | null>(null);

  // Initialize the initial state ref on mount
  useEffect(() => {
    if (initialStateRef.current === null) {
      // Store original steps without cloning (we'll clone when resetting)
      const originalSteps = template?.prototype?.steps 
        ? template.prototype.steps
        : editingPrototype?.steps || [];

      // When using a template, branding fields use defaults (not from template)
      // When editing, use the prototype's values
      // When creating new, use defaults
      // This should match the initial useState values above
      initialStateRef.current = {
        name: editingPrototype?.name || '',
        description: editingPrototype?.description || '',
        primaryColor: editingPrototype?.primaryColor || '#2563EB',
        logoUploadMode: editingPrototype?.logoUploadMode || 'upload',
        logoUrl: editingPrototype?.logoUrl || '',
        steps: originalSteps,
      };
    }
  }, []); // Only run on mount to capture initial state

  const handleReset = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Ensure initial state is set (fallback to current values if somehow not initialized)
    if (!initialStateRef.current) {
      initialStateRef.current = {
        name: editingPrototype?.name || '',
        description: editingPrototype?.description || '',
        primaryColor: editingPrototype?.primaryColor || '#2563EB',
        logoUploadMode: editingPrototype?.logoUploadMode || 'upload',
        logoUrl: editingPrototype?.logoUrl || '',
        steps: template?.prototype?.steps || editingPrototype?.steps || [],
      };
    }

    try {
      // Capture reset state
      const resetState = initialStateRef.current;
      
      // User confirmed - reset all form fields
      setName(resetState.name);
      setDescription(resetState.description);
      setPrimaryColor(resetState.primaryColor);
      setLogoUploadMode(resetState.logoUploadMode);
      setLogoUrl(resetState.logoUrl);
      setLogoFile(null);
      
      // Clone steps with new IDs when resetting to ensure React detects the change
      const resetSteps = resetState.steps.map(step => ({
        ...step,
        id: crypto.randomUUID(),
        elements: step.elements.map(el => ({
          ...el,
          id: crypto.randomUUID(),
        })),
      }));
      setSteps(resetSteps);
      
      // Reset UI state
      setExpandedStepId(null);
      setOpenElementMenuStepId(null);
      setNewlyAddedElementId(null);
      setEditingStepNameId(null);
      setEditingStepNameValue('');
      setNewlyAddedStepId(null);
    } catch (error) {
      console.error('Error during reset:', error);
    }
  };

  const handleLogoUpload = (file: File | null, fileInfo: { name: string; size: number; dataUrl: string } | null) => {
    setLogoFile(file);
    setLogoUrl(fileInfo?.dataUrl || '');
  };

  const handleStepImageUpload = (stepId: string, _file: File | null, fileInfo: { name: string; size: number; dataUrl: string } | null) => {
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

  const handleSaveQuestionTemplate = async (templateName: string) => {
    if (!stepToSaveAsTemplate) return;
    const step = steps.find(s => s.id === stepToSaveAsTemplate);
    if (step) {
      const template = await createQuestionTemplate(templateName, step);
      await saveQuestionTemplate(template);
      const updatedTemplates = await getQuestionTemplates();
      setQuestionTemplates(updatedTemplates);
      setStepToSaveAsTemplate(null);
    }
  };

  const handleSaveApplicationStepTemplate = async (templateName: string) => {
    if (!stepToSaveAsTemplate) return;
    const step = steps.find(s => s.id === stepToSaveAsTemplate);
    if (step && step.isApplicationStep) {
      const template = await createApplicationStepTemplate(templateName, step);
      await saveApplicationStepTemplate(template);
      const updatedTemplates = await getApplicationStepTemplates();
      setApplicationStepTemplates(updatedTemplates);
      setStepToSaveAsTemplate(null);
    }
  };

  const handleSavePrototypeTemplate = async (templateName: string) => {
    try {
      console.log('Starting template save process...', { templateName, stepsCount: steps.length });
      
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
      
      // Log steps with images for debugging
      const stepsWithImages = steps.filter(s => s.imageUrl && s.imageUrl.startsWith('data:'));
      console.log(`Found ${stepsWithImages.length} steps with base64 images`);
      
      // Create template with image compression (async)
      console.log('Creating template with image compression...');
      const template = await createPrototypeTemplate(templateName, prototype);
      console.log('Template created successfully:', { 
        templateId: template.id, 
        stepsCount: template.prototype.steps.length,
        stepsWithImages: template.prototype.steps.filter(s => s.imageUrl).length
      });
      
      console.log('Saving template to IndexedDB/localStorage...');
      try {
        await savePrototypeTemplate(template);
        console.log('Template saved successfully');
      } catch (saveError) {
        console.error('Error saving template:', saveError);
        throw saveError; // Re-throw to be caught by outer catch
      }
      
      // Reload templates to verify it was saved
      const updatedTemplates = await getPrototypeTemplates();
      console.log('Templates after save:', updatedTemplates.length);
      const savedTemplate = updatedTemplates.find(t => t.id === template.id);
      if (savedTemplate) {
        console.log('Template verified in storage:', savedTemplate.name);
        console.log('Template steps:', savedTemplate.prototype.steps.length);
        savedTemplate.prototype.steps.forEach((step, idx) => {
          const hasImage = !!step.imageUrl;
          const imageLength = step.imageUrl?.length || 0;
          console.log(`Step ${idx}: hasImage=${hasImage}, imageUrl length=${imageLength}, imageUrl preview=${step.imageUrl?.substring(0, 50) || 'none'}...`);
        });
      } else {
        console.error('Template NOT found in storage after save!');
        throw new Error('Template was not saved successfully - not found in storage after save operation');
      }
      
      setPrototypeTemplates(updatedTemplates);
      setShowPrototypeTemplateModal(false);
      
      console.log('Template saved successfully. Images were compressed to reduce storage size.');
    } catch (error) {
      console.error('Error saving prototype template:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
        const storageInfo = await getTemplateStorageInfo();
        const storageUsage = await getStorageUsage();
        setSystemMessage({
          isOpen: true,
          message: `Storage quota exceeded (${storageUsage.percentage.toFixed(1)}% used). Please:`,
          instructions: [
            'Remove some existing templates, or',
            'Clear browser localStorage',
          ],
          additionalInfo: `Images are compressed before saving, but you may have too many templates stored.\n\nCurrent storage:\n- Prototype templates: ${storageInfo.prototypeTemplates.count} (${(storageInfo.prototypeTemplates.size / 1024 / 1024).toFixed(2)} MB)\n- Question templates: ${storageInfo.questionTemplates.count} (${(storageInfo.questionTemplates.size / 1024 / 1024).toFixed(2)} MB)\n- Application templates: ${storageInfo.applicationStepTemplates.count} (${(storageInfo.applicationStepTemplates.size / 1024 / 1024).toFixed(2)} MB)`,
        });
      } else {
        setSystemMessage({
          isOpen: true,
          message: `Failed to save template: ${errorMessage}`,
          additionalInfo: 'Check the browser console for more details.',
        });
      }
    }
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

  const handleSelectApplicationStepTemplate = (template: ApplicationStepTemplate) => {
    if ('step' in template) {
      const newStep: Step = {
        ...template.step,
        id: crypto.randomUUID(),
        name: 'Application Step',
        elements: template.step.elements.map(el => ({
          ...el,
          id: crypto.randomUUID(),
        })),
      };
      // Application steps always go at the end
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

  const deleteStep = async (stepId: string) => {
    const DEBUG_DELETION = true; // Set to false to disable debug logs
    
    try {
      if (DEBUG_DELETION) {
        console.log('[DELETE STEP CreatePrototype] === DELETION STARTED ===', { stepId });
        console.log('[DELETE STEP CreatePrototype] Current steps:', steps.map(s => ({ id: s.id, name: s.name || 'Unnamed', isApplicationStep: s.isApplicationStep })));
      }
      
      const step = steps.find(s => s.id === stepId);
      if (DEBUG_DELETION) {
        console.log('[DELETE STEP CreatePrototype] Step found:', step ? { id: step.id, name: step.name || 'Unnamed', elementCount: step.elements.length } : 'NOT FOUND');
        console.log('[DELETE STEP CreatePrototype] Updating state...');
      }
      
      // Use functional update to avoid stale closure issues
      let updatedStepsForSave: Step[] = [];
      setSteps(prevSteps => {
        const beforeCount = prevSteps.length;
        const stepExists = prevSteps.some(s => s.id === stepId);
        
        if (DEBUG_DELETION) {
          console.log('[DELETE STEP CreatePrototype] State update - before:', { stepCount: beforeCount, stepExists });
        }
        
        const updatedSteps = prevSteps.filter(step => step.id !== stepId);
        const afterCount = updatedSteps.length;
        const stepStillExists = updatedSteps.some(s => s.id === stepId);
        
        if (DEBUG_DELETION) {
          console.log('[DELETE STEP CreatePrototype] State update - after:', { 
            stepCount: afterCount, 
            stepStillExists,
            success: !stepStillExists && afterCount === beforeCount - 1,
            remainingStepIds: updatedSteps.map(s => s.id)
          });
        }
        
        if (stepStillExists) {
          console.error('[DELETE STEP CreatePrototype] ERROR: Step still exists after deletion!', {
            stepId,
            remainingStepIds: updatedSteps.map(s => s.id)
          });
        }
        
        // Store for database save
        updatedStepsForSave = updatedSteps;
        return updatedSteps;
      });
      
      // Clear related state
      if (expandedStepId === stepId) setExpandedStepId(null);
      if (openElementMenuStepId === stepId) setOpenElementMenuStepId(null);
      if (editingStepNameId === stepId) {
        setEditingStepNameId(null);
        setEditingStepNameValue('');
      }
      
      // Save to database immediately (no delay)
      if (editingPrototype?.id) {
        try {
          await updatePrototype(editingPrototype.id, {
            name,
            description,
            primaryColor,
            logoUrl: logoUploadMode === 'url' ? logoUrl : logoFile ? logoUrl : editingPrototype.logoUrl,
            logoUploadMode,
            steps: updatedStepsForSave,
          });
          
          if (DEBUG_DELETION) {
            console.log('[DELETE STEP CreatePrototype] Successfully saved to database');
          }
        } catch (error) {
          console.error('[DELETE STEP CreatePrototype] Error saving step deletion:', error);
          throw error; // Re-throw to be caught by outer try-catch
        }
      }
      
      if (DEBUG_DELETION) {
        console.log('[DELETE STEP CreatePrototype] === DELETION COMPLETE ===');
      }
    } catch (error) {
      console.error('[DELETE STEP CreatePrototype] Error in deleteStep:', error);
      throw error; // Re-throw for caller to handle
    }
  };

  const handleStepDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const stepId = active.id as string;
    const step = steps.find(s => s.id === stepId);
    
    // Prevent dragging application steps
    if (step?.isApplicationStep) {
      dndWarn('Cannot drag application steps');
      return;
    }
    
    setActiveStepId(stepId);
    dndLog('Step drag started:', stepId);
  };

  const handleStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    dndLog('Step drag ended:', { activeId: active.id, overId: over?.id });

    if (!over || active.id === over.id) {
      setActiveStepId(null);
      return;
    }

    const draggedStep = steps.find(s => s.id === active.id);
    const targetStep = steps.find(s => s.id === over.id);

    // Prevent dragging application steps
    if (draggedStep?.isApplicationStep) {
      dndWarn('Cannot drag application steps');
      setActiveStepId(null);
      return;
    }
    
    // Prevent dropping before application steps
    if (targetStep?.isApplicationStep) {
      dndWarn('Cannot drop before application steps');
      setActiveStepId(null);
      return;
    }

    // Separate regular steps and application steps
    const regularSteps = steps.filter(s => !s.isApplicationStep);
    const applicationSteps = steps.filter(s => s.isApplicationStep);
    
    const draggedIndex = regularSteps.findIndex(s => s.id === active.id);
    const targetIndex = regularSteps.findIndex(s => s.id === over.id);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      dndWarn('Invalid step indices:', { draggedIndex, targetIndex });
      setActiveStepId(null);
      return;
    }

    // Quality check
    if (regularSteps.length === 0) {
      dndWarn('Cannot reorder: no regular steps available');
      setActiveStepId(null);
      return;
    }

    const newRegularSteps = arrayMove(regularSteps, draggedIndex, targetIndex);
    
    // Quality check
    if (newRegularSteps.length !== regularSteps.length) {
      dndError('Step reorder error: length mismatch', { 
        original: regularSteps.length, 
        reordered: newRegularSteps.length 
      });
      setActiveStepId(null);
      return;
    }

    dndLog('Reordering steps:', { from: draggedIndex, to: targetIndex });
    setSteps([...newRegularSteps, ...applicationSteps]);
    setActiveStepId(null);
  };

  const handleStepDragCancel = () => {
    dndLog('Step drag cancelled');
    setActiveStepId(null);
  };

  const handleElementDragStart = (event: DragStartEvent, stepId: string) => {
    const { active } = event;
    setActiveElementId(active.id as string);
    setActiveElementStepId(stepId);
    dndLog('Element drag started:', { elementId: active.id, stepId });
  };

  const handleElementDragEnd = (event: DragEndEvent, stepId: string) => {
    const { active, over } = event;
    
    dndLog('Element drag ended:', { activeId: active.id, overId: over?.id, stepId });

    if (!over || active.id === over.id || activeElementStepId !== stepId) {
      setActiveElementId(null);
      setActiveElementStepId(null);
      return;
    }

    const step = steps.find(s => s.id === stepId);
    if (!step) {
      dndWarn('Step not found:', stepId);
      setActiveElementId(null);
      setActiveElementStepId(null);
      return;
    }

    const draggedIndex = step.elements.findIndex(el => el.id === active.id);
    const targetIndex = step.elements.findIndex(el => el.id === over.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      dndWarn('Invalid element indices:', { draggedIndex, targetIndex });
      setActiveElementId(null);
      setActiveElementStepId(null);
      return;
    }

    // Quality check
    if (step.elements.length === 0) {
      dndWarn('Cannot reorder: no elements available');
      setActiveElementId(null);
      setActiveElementStepId(null);
      return;
    }

    const newElements = arrayMove(step.elements, draggedIndex, targetIndex);
    
    // Quality check
    if (newElements.length !== step.elements.length) {
      dndError('Element reorder error: length mismatch', { 
        original: step.elements.length, 
        reordered: newElements.length 
      });
      setActiveElementId(null);
      setActiveElementStepId(null);
      return;
    }

    dndLog('Reordering elements:', { from: draggedIndex, to: targetIndex, stepId });
    updateStep(stepId, { elements: newElements });
    setActiveElementId(null);
    setActiveElementStepId(null);
  };

  const handleElementDragCancel = () => {
    dndLog('Element drag cancelled');
    setActiveElementId(null);
    setActiveElementStepId(null);
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

    // Ensure the step is expanded before adding the element
    if (expandedStepId !== stepId) {
      setExpandedStepId(stepId);
    }

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
      // Use requestAnimationFrame and a longer delay to ensure DOM is fully updated
      // This accounts for step expansion animation and element rendering
      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(`element-${newlyAddedElementId}`);
        if (element) {
          // Use requestAnimationFrame for smoother animation
          requestAnimationFrame(() => {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          });
        }
        // Reset the newly added element ID
        setNewlyAddedElementId(null);
      }, 300); // Increased delay to account for step expansion

      return () => clearTimeout(scrollTimeout);
    }
  }, [newlyAddedElementId, expandedStepId]);

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
    // Remove element from state
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              elements: step.elements.filter(el => el.id !== elementId),
              ...(step.tags && { tags: step.tags.filter(tag => tag.elementId !== elementId) })
            }
          : step
      )
    );
    
    // Clear related state
    if (newlyAddedElementId === elementId) setNewlyAddedElementId(null);
    if (openElementMenuStepId === stepId) setOpenElementMenuStepId(null);
    
    // Save to database
    if (editingPrototype?.id) {
      setTimeout(() => {
        saveNow().catch(error => {
          console.error('Error saving element deletion:', error);
        });
      }, 100);
    }
  };

  const updateElement = (stepId: string, elementId: string, updates: Partial<Element>) => {
    setSteps(prevSteps => prevSteps.map(step =>
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
        <div className="flex items-center justify-between mb-6">
          <TextButton
            onClick={onCancel}
            icon={<ArrowLeft size={20} />}
          >
            Back to Home
          </TextButton>
          {editingPrototype && (
            <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
          )}
        </div>

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
                {steps.length > 0 && (
                  <div className="flex items-center h-8">
                    <SecondaryButton
                      onClick={() => setShowPrototypeTemplateModal(true)}
                      size="sm"
                    >
                      <Bookmark size={16} />
                      Save as template
                    </SecondaryButton>
                  </div>
                )}
                <div className="relative flex items-center h-8">
              <TextButton
                    onClick={() => setShowAddStepDropdown(!showAddStepDropdown)}
                size="sm"
                className="h-8 flex items-center"
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
                      <div className="absolute left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20" style={{ top: 'calc(100% + 4px)' }}>
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
                          Add from template
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2" key={`steps-container-${steps.length}-${steps.map(s => s.id).join('-')}`}>
              {(() => {
                const regularSteps = steps.filter(s => !s.isApplicationStep);
                const applicationSteps = steps.filter(s => s.isApplicationStep);
                
                return (
                  <>
                    {/* Regular Steps with DnD */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleStepDragStart}
                      onDragEnd={handleStepDragEnd}
                      onDragCancel={handleStepDragCancel}
                    >
                      <SortableContext
                        key={`sortable-${regularSteps.length}-${regularSteps.map(s => s.id).join('-')}`}
                        items={regularSteps.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {regularSteps.map((step, index) => {
                          return (
                          <SortableItem
                            key={`step-${step.id}-${index}`}
                            id={step.id}
                            className="mb-2"
                          >
                            {({ attributes, listeners, isDragging }) => {
                              return (
                              <div
                                id={`step-${step.id}`}
                                className={`border rounded-lg transition-all duration-300 ${
                                  isDragging ? 'opacity-50' : 'border-gray-200 opacity-100'
                                }`}
                                style={isDragging ? { borderColor: '#4D3EE0' } : {}}
                              >
                                <div
                          className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-t-lg transition-colors ${
                            expandedStepId !== step.id ? 'rounded-b-lg' : ''
                          }`}
                          onClick={(e) => {
                            // Only toggle if click wasn't on a button or interactive element
                            const target = e.target as HTMLElement;
                            // Check if click was directly on a button or inside a button
                            const clickedButton = target.closest('button');
                            // Only prevent toggle if we actually clicked a button
                            if (clickedButton) {
                              return; // Don't toggle if clicking a button
                            }
                            setExpandedStepId(expandedStepId === step.id ? null : step.id);
                          }}
                        >
                                <div className="flex items-center gap-3">
                                  <span
                                    {...attributes}
                                    {...listeners}
                                    className="inline-flex cursor-grab active:cursor-grabbing touch-none"
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical 
                                      size={16} 
                                      className="text-gray-400 hover:text-gray-600 pointer-events-none" 
                                    />
                                  </span>
                            <div className="flex items-center gap-2">
                              {editingStepNameId === step.id ? (
                                <div 
                                  ref={editingStepNameRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="min-w-[200px]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editingStepNameValue.trim()) {
                                        updateStep(step.id, { name: editingStepNameValue.trim() });
                                      }
                                      setEditingStepNameId(null);
                                      setEditingStepNameValue('');
                                    } else if (e.key === 'Escape') {
                                      setEditingStepNameId(null);
                                      setEditingStepNameValue('');
                                    }
                                  }}
                                >
                                  <SystemField
                                    type="text"
                                    value={editingStepNameValue}
                                    onChange={setEditingStepNameValue}
                                    showLabel={false}
                                    className="font-medium"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="font-medium" style={{ color: '#464F5E' }}>
                                    {step.name}
                                  </span>
                                  <Tooltip content="Edit step name">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingStepNameId(step.id);
                                        setEditingStepNameValue(step.name);
                                      }}
                                      className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                                {step.question && expandedStepId !== step.id && (
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
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip content="Save as template">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStepToSaveAsTemplate(step.id);
                            setShowQuestionTemplateModal(true);
                          }}
                          className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Bookmark size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete step">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await deleteStep(step.id);
                            } catch (error) {
                              console.error('[DELETE STEP] Error from deleteStep:', error);
                            }
                          }}
                          className="flex items-center justify-center p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip content={expandedStepId === step.id ? "Collapse" : "Expand"}>
                        <div className="flex items-center justify-center">
                          {expandedStepId === step.id ? (
                            <ChevronUp size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                          )}
                        </div>
                      </Tooltip>
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
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={(e) => handleElementDragStart(e, step.id)}
                            onDragEnd={(e) => handleElementDragEnd(e, step.id)}
                            onDragCancel={handleElementDragCancel}
                          >
                            <SortableContext
                              items={step.elements.map(el => el.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {step.elements.map((element) => {
                                  const canDrag = step.elements.length > 1;
                                  
                                  return (
                                    <SortableItem
                                      key={element.id}
                                      id={element.id}
                                      disabled={!canDrag}
                                      className="mb-2"
                                    >
                                      {({ attributes, listeners, isDragging }) => (
                                        <div
                                          id={`element-${element.id}`}
                                          className={`bg-gray-50 rounded-lg border transition-all ${
                                            isDragging ? 'opacity-50' : 'border-gray-200'
                                          }`}
                                          style={isDragging ? { borderColor: '#4D3EE0' } : {}}
                                        >
                                          <div className="flex justify-between items-center p-3">
                                            <span 
                                              className="text-sm font-medium flex items-center gap-2" 
                                              style={{ color: '#464F5E' }}
                                            >
                                              {canDrag && (
                                                <span
                                                  {...attributes}
                                                  {...listeners}
                                                  className="inline-flex cursor-grab active:cursor-grabbing touch-none"
                                                  onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                  <GripVertical 
                                                    size={16} 
                                                    className="text-gray-400 hover:text-gray-600 pointer-events-none" 
                                                  />
                                                </span>
                                              )}
                                              {getElementLabel(element.type)}
                                            </span>
                                    <div className="flex items-center justify-center gap-2">
                                      <Tooltip content="Delete element">
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            try {
                                              await deleteElement(step.id, element.id);
                                            } catch (error) {
                                              console.error('Failed to delete element:', error);
                                            }
                                          }}
                                          className="flex items-center justify-center p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>

                                  <div className="pt-1 px-3 pb-3 space-y-3">
                                {(element.type === 'text_field') && (
                                  <div className="space-y-2">
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
                                  <div className="space-y-2">
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
                                    onDeleteElement={async (stepIndex, elementId) => {
                                      const targetStep = steps[stepIndex];
                                      await deleteElement(targetStep.id, elementId);
                                    }}
                                    primaryColor={primaryColor}
                                    showSelectionConfig={true}
                                  />
                                )}

                                {(element.type === 'calendar_field') && (
                                  <div className="space-y-2">
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

                                 {(element.type === 'simple_cards' || element.type === 'checkboxes' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards' || element.type === 'application_card') && (
                                   <CardEditor
                                     element={element}
                                     stepIndex={steps.findIndex(s => s.id === step.id)}
                                     onUpdateElement={(stepIndex, elementId, updates) => {
                                       const targetStep = steps[stepIndex];
                                       updateElement(targetStep.id, elementId, updates);
                                     }}
                                     onDeleteElement={async (stepIndex, elementId) => {
                                       const targetStep = steps[stepIndex];
                                       await deleteElement(targetStep.id, elementId);
                                     }}
                                     primaryColor={primaryColor}
                                     showSelectionConfig={element.type === 'simple_cards' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards'}
                                   />
                                 )}
                                          </div>
                                        </div>
                                      )}
                                    </SortableItem>
                                  );
                                })}
                              </div>
                            </SortableContext>
                            <DragOverlay>
                              {activeElementId && activeElementStepId === step.id ? (
                                <div className="bg-gray-50 rounded-lg border shadow-lg opacity-90 rotate-2 p-3" style={{ borderColor: '#4D3EE0' }}>
                                  <div className="flex items-center gap-2">
                                    <GripVertical size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600">
                                      {getElementLabel(step.elements.find(el => el.id === activeElementId)?.type || 'text_field')}
                                    </span>
                                  </div>
                                </div>
                              ) : null}
                            </DragOverlay>
                          </DndContext>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No elements added yet</p>
                        )}
                      </div>
                    </div>
                            )}
                              </div>
                            );
                            }}
                          </SortableItem>
                          );
                        })}
                      </SortableContext>
                      <DragOverlay>
                        {activeStepId ? (
                          <div className="border rounded-lg bg-white shadow-lg opacity-90 rotate-2 p-4" style={{ borderColor: '#4D3EE0' }}>
                            <div className="flex items-center gap-3">
                              <GripVertical size={16} className="text-gray-400" />
                              <span className="font-medium text-gray-600">
                                {regularSteps.find(s => s.id === activeStepId)?.name || 'Step'}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                    
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
                          className="border-2 rounded-lg transition-all"
                          style={{
                            borderColor: addOpacity(systemPrimaryColor, 0.1),
                            backgroundColor: addOpacity(systemPrimaryColor, 0.06),
                          }}
                        >
                          <div
                            className={`p-4 flex justify-between items-center cursor-pointer transition-colors rounded-t-lg ${
                              expandedStepId !== step.id ? 'rounded-b-lg' : ''
                            }`}
                            style={{
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = addOpacity(systemPrimaryColor, 0.08);
                              const borderRadius = expandedStepId === step.id 
                                ? '0.5rem 0.5rem 0 0' 
                                : '0.5rem';
                              e.currentTarget.style.borderRadius = borderRadius;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              const borderRadius = expandedStepId === step.id 
                                ? '0.5rem 0.5rem 0 0' 
                                : '0.5rem';
                              e.currentTarget.style.borderRadius = borderRadius;
                            }}
                            onClick={(e) => {
                            // Only toggle if click wasn't on a button or interactive element
                            const target = e.target as HTMLElement;
                            // Check if click was directly on a button or inside a button
                            const clickedButton = target.closest('button');
                            // Only prevent toggle if we actually clicked a button
                            if (clickedButton) {
                              return; // Don't toggle if clicking a button
                            }
                            setExpandedStepId(expandedStepId === step.id ? null : step.id);
                          }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: systemPrimaryColor }}
                              >
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingStepNameId === step.id ? (
                                  <div 
                                    ref={editingStepNameRef}
                                    onClick={(e) => e.stopPropagation()}
                                    className="min-w-[200px]"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingStepNameValue.trim()) {
                                          updateStep(step.id, { name: editingStepNameValue.trim() });
                                        }
                                        setEditingStepNameId(null);
                                        setEditingStepNameValue('');
                                      } else if (e.key === 'Escape') {
                                        setEditingStepNameId(null);
                                        setEditingStepNameValue('');
                                      }
                                    }}
                                  >
                                    <SystemField
                                      type="text"
                                      value={editingStepNameValue}
                                      onChange={setEditingStepNameValue}
                                      showLabel={false}
                                      className="font-medium"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span 
                                      className="font-medium"
                                      style={{ color: darkenColor(systemPrimaryColor, 20) }}
                                    >
                                      {step.name}
                                    </span>
                                    <Tooltip content="Edit step name">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingStepNameId(step.id);
                                          setEditingStepNameValue(step.name);
                                        }}
                                        className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                              {step.applicationStepHeading && expandedStepId !== step.id && (
                                <span 
                                  className="text-sm"
                                  style={{ color: darkenColor(systemPrimaryColor, 10) }}
                                >
                                  - {step.applicationStepHeading}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip content="Save as template">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStepToSaveAsTemplate(step.id);
                                    setShowApplicationStepTemplateModal(true);
                                  }}
                                  className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Bookmark size={18} />
                                </button>
                              </Tooltip>
                              <Tooltip content="Delete step">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      await deleteStep(step.id);
                                    } catch (error) {
                                      console.error('[DELETE STEP] Error from deleteStep:', error);
                                    }
                                  }}
                                  className="flex items-center justify-center p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </Tooltip>
                              <Tooltip content={expandedStepId === step.id ? "Collapse" : "Expand"}>
                                <div className="flex items-center justify-center">
                                  {expandedStepId === step.id ? (
                                    <ChevronUp size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                                  ) : (
                                    <ChevronDown size={20} className="text-gray-400 hover:text-gray-600 transition-colors" />
                                  )}
                                </div>
                              </Tooltip>
                            </div>
                          </div>

                          {expandedStepId === step.id && (
                            <div 
                              className="p-4 border-t space-y-4 bg-white rounded-b-lg"
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

                              <div className="pt-2">
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
                                        <div>
                                          <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-base font-medium" style={{ color: '#464F5E' }}>
                                              Application cards configuration
                                            </h4>
                                          </div>
                                          {applicationCardElements.length > 0 ? (
                                            applicationCardElements.map((element, index) => (
                                              <div key={element.id} id={`element-${element.id}`} className={index < applicationCardElements.length - 1 ? "mb-1" : ""}>
                                                <CardEditor
                                                  element={element}
                                                  stepIndex={steps.findIndex(s => s.id === step.id)}
                                                  onUpdateElement={(stepIndex, elementId, updates) => {
                                                    const targetStep = steps[stepIndex];
                                                    updateElement(targetStep.id, elementId, updates);
                                                  }}
                                                  onDeleteElement={async (stepIndex, elementId) => {
                                                    const targetStep = steps[stepIndex];
                                                    await deleteElement(targetStep.id, elementId);
                                                  }}
                                                  primaryColor={primaryColor}
                                                  showSelectionConfig={false}
                                                  disableAddCard={false}
                                                />
                                              </div>
                                            ))
                                          ) : (
                                            <div className="pt-2 px-2 pb-1 bg-gray-50 rounded-lg border border-gray-200">
                                              <p className="text-sm text-gray-500 text-center mb-1">No cards added yet</p>
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
                                            {otherElements.map((element) => {
                                              return (
                                                <div
                                                  key={element.id}
                                                  id={`element-${element.id}`}
                                                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span 
                                                      className="text-sm font-medium flex items-center gap-2" 
                                                      style={{ color: '#464F5E' }}
                                                    >
                                                      {getElementLabel(element.type)}
                                                    </span>
                                                    <div className="flex items-center justify-center gap-2">
                                                      <Tooltip content="Delete element">
                                                        <button
                                                          type="button"
                                                          onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                          }}
                                                          onClick={async (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            try {
                                                              await deleteElement(step.id, element.id);
                                                            } catch (error) {
                                                              console.error('Failed to delete element:', error);
                                                            }
                                                          }}
                                                          className="flex items-center justify-center p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        >
                                                          <Trash2 size={16} />
                                                        </button>
                                                      </Tooltip>
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
                                            onDeleteElement={async (stepIndex, elementId) => {
                                              const targetStep = steps[stepIndex];
                                              await deleteElement(targetStep.id, elementId);
                                            }}
                                            primaryColor={primaryColor}
                                            showSelectionConfig={element.type === 'simple_cards' || element.type === 'image_cards' || element.type === 'image_only_card' || element.type === 'advanced_cards'}
                                          />
                                        )}
                                      </div>
                                              );
                                            })}
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
                type="button"
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
        onSelect={(template) => {
          if (templateSelectorType === 'prototype') {
            handleSelectPrototypeTemplate(template as PrototypeTemplate);
          } else if ('step' in template && (template as ApplicationStepTemplate).step.isApplicationStep) {
            handleSelectApplicationStepTemplate(template as ApplicationStepTemplate);
          } else if ('step' in template) {
            handleSelectQuestionTemplate(template as QuestionTemplate);
          }
        }}
        questionTemplates={questionTemplates}
        prototypeTemplates={prototypeTemplates}
        applicationStepTemplates={applicationStepTemplates}
        type={templateSelectorType}
        showTabs={templateSelectorType !== 'prototype'} // Show tabs for step templates, not prototype templates
      />

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

