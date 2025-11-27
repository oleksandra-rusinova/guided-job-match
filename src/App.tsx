import { useState, useEffect } from 'react';
import { Prototype, QuestionTemplate, PrototypeTemplate } from './types';
import { getPrototypes, savePrototype, deletePrototype } from './utils/storage';
import { getPrototypeTemplates } from './utils/templates';
import HomePage from './components/HomePage';
import CreatePrototype from './components/CreatePrototype';
import PrototypeView from './components/PrototypeView';
import TemplatesPage from './components/TemplatesPage';
import TemplateSelector from './components/TemplateSelector';

type View = 'home' | 'create' | 'view' | 'edit' | 'templates';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [selectedPrototypeId, setSelectedPrototypeId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PrototypeTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [prototypeTemplates, setPrototypeTemplates] = useState<PrototypeTemplate[]>([]);

  useEffect(() => {
    setPrototypes(getPrototypes());
    setPrototypeTemplates(getPrototypeTemplates());
  }, []);

  const handleSavePrototype = (prototype: Prototype) => {
    savePrototype(prototype);
    setPrototypes(getPrototypes());
    setView('home');
  };

  const handleDeletePrototype = (id: string) => {
    if (confirm('Are you sure you want to delete this prototype?')) {
      deletePrototype(id);
      setPrototypes(getPrototypes());
    }
  };

  const handleEditPrototype = (id: string) => {
    setSelectedPrototypeId(id);
    setView('edit');
  };

  const handleDuplicatePrototype = (id: string) => {
    const prototype = prototypes.find(p => p.id === id);
    if (prototype) {
      const duplicated: Prototype = {
        ...prototype,
        id: crypto.randomUUID(),
        name: `${prototype.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      savePrototype(duplicated);
      setPrototypes(getPrototypes());
    }
  };

  const handleOpenPrototype = (id: string) => {
    setSelectedPrototypeId(id);
    setView('view');
  };

  const handleUseTemplate = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = (template: QuestionTemplate | PrototypeTemplate) => {
    if ('prototype' in template) {
      setSelectedTemplate(template);
      setShowTemplateSelector(false);
      setView('create');
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setView('create');
  };

  const selectedPrototype = prototypes.find(p => p.id === selectedPrototypeId);

  return (
    <>
      {view === 'home' && (
        <HomePage
          prototypes={prototypes}
          onCreateNew={handleCreateNew}
          onUseTemplate={handleUseTemplate}
          onOpenPrototype={handleOpenPrototype}
          onEditPrototype={handleEditPrototype}
          onDuplicatePrototype={handleDuplicatePrototype}
          onDeletePrototype={handleDeletePrototype}
          onOpenTemplates={() => setView('templates')}
        />
      )}

      {view === 'create' && (
        <CreatePrototype
          onSave={handleSavePrototype}
          onCancel={() => {
            setView('home');
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
        />
      )}

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleTemplateSelect}
        prototypeTemplates={prototypeTemplates}
        type="prototype"
      />

      {view === 'view' && selectedPrototype && (
        <PrototypeView
          prototype={selectedPrototype}
          onExit={() => setView('home')}
          onEdit={() => handleEditPrototype(selectedPrototype.id)}
        />
      )}

      {view === 'edit' && selectedPrototype && (
        <CreatePrototype
          editingPrototype={selectedPrototype}
          onSave={handleSavePrototype}
          onCancel={() => setView('home')}
        />
      )}

      {view === 'templates' && (
        <TemplatesPage
          onBack={() => setView('home')}
          onEditQuestionTemplate={(template) => {
            // For now, just go back - editing is handled in TemplatesPage
            setView('templates');
          }}
          onEditPrototypeTemplate={(template) => {
            // For now, just go back - editing is handled in TemplatesPage
            setView('templates');
          }}
        />
      )}
    </>
  );
}
