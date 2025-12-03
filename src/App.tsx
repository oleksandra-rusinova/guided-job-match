import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Prototype, QuestionTemplate, PrototypeTemplate } from './types';
import { savePrototype, deletePrototype } from './utils/storage';
import { getPrototypeTemplates } from './utils/templates';
import { useRealtimePrototypes } from './hooks/useRealtimePrototypes';
import HomePage from './components/HomePage';
import CreatePrototype from './components/CreatePrototype';
import PrototypeView from './components/PrototypeView';
import TemplatesPage from './components/TemplatesPage';
import TemplateSelector from './components/TemplateSelector';
import Login from './components/Login';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Login onLogin={() => window.location.reload()} />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<PrototypeTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [prototypeTemplates, setPrototypeTemplates] = useState<PrototypeTemplate[]>([]);

  // Use Realtime hook for prototypes - automatically updates on changes
  const { prototypes, updatePrototypeInState, removePrototypeFromState } = useRealtimePrototypes();

  useEffect(() => {
    setPrototypeTemplates(getPrototypeTemplates());
  }, []);

  const handleSavePrototype = async (prototype: Prototype) => {
    const result = await savePrototype(prototype);
    // Update local state immediately for instant UI feedback
    if (result.success && result.data) {
      updatePrototypeInState(result.data);
    }
    // Realtime will also update, but local state update provides instant feedback
    navigate('/');
  };

  const handleDeletePrototype = async (id: string) => {
    if (confirm('Are you sure you want to delete this prototype?')) {
      await deletePrototype(id);
      // Update local state immediately for instant UI feedback
      removePrototypeFromState(id);
      // Realtime will also update, but local state update provides instant feedback
    }
  };

  const handleEditPrototype = (id: string) => {
    navigate(`/edit/${id}`);
  };

  const handleDuplicatePrototype = async (id: string) => {
    const prototype = prototypes.find(p => p.id === id);
    if (prototype) {
      const duplicated: Prototype = {
        ...prototype,
        id: crypto.randomUUID(),
        name: `${prototype.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = await savePrototype(duplicated);
      // Update local state immediately for instant UI feedback
      if (result.success && result.data) {
        updatePrototypeInState(result.data);
      }
      // Realtime will also update, but local state update provides instant feedback
    }
  };

  const handleOpenPrototype = (id: string) => {
    console.log('handleOpenPrototype called with id:', id);
    navigate(`/prototype/${id}`);
  };

  const handleUseTemplate = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = (template: QuestionTemplate | PrototypeTemplate) => {
    if ('prototype' in template) {
      setSelectedTemplate(template);
      setShowTemplateSelector(false);
      navigate('/create');
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    navigate('/create');
  };

  // Wrapper components for routes that need params
  const PrototypeViewRoute = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    // Check authentication status - logged-in users get full functionality, public users get restricted view
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // If we're not on a prototype route anymore, don't render
    if (!id || !location.pathname.startsWith('/prototype/')) {
      return null;
    }
    
    // Create a stable callback for onExit that properly handles navigation
    const handleExit = useCallback(() => {
      console.log('PrototypeView onExit called');
      // Only navigate to home if authenticated, otherwise stay on page
      if (isAuthenticated) {
        // Use navigate with replace to ensure React Router updates
        navigate('/', { replace: true });
        // Fallback: if React Router doesn't update the view, force navigation
        // This ensures the user always gets navigated back to home
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }, 50);
      } else {
        // For public users, exit doesn't navigate anywhere
        // They can close the tab or use browser back button
        console.log('Public user - exit action ignored');
      }
    }, [isAuthenticated, navigate]);
    
    return (
      <PrototypeView
        key={`${id}-${location.pathname}`}
        prototypeId={id}
        prototype={prototypes.find(p => p.id === id)}
        // showActions controls visibility of edit/exit buttons and presence indicator
        // true for logged-in users (full functionality), false for public users (restricted)
        showActions={isAuthenticated}
        onExit={handleExit}
        onEdit={() => {
          // Only allow editing if authenticated
          if (isAuthenticated) {
            handleEditPrototype(id);
          } else {
            // Redirect to login by navigating to home
            navigate('/');
          }
        }}
      />
    );
  };

  const EditPrototypeRoute = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return null;
    
    return (
      <CreatePrototype
        editingPrototype={prototypes.find(p => p.id === id) || undefined}
        onSave={handleSavePrototype}
        onCancel={() => navigate('/')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public route - prototype view */}
        <Route
          path="/prototype/:id"
          element={<PrototypeViewRoute />}
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage
                prototypes={prototypes}
                onCreateNew={handleCreateNew}
                onUseTemplate={handleUseTemplate}
                onOpenPrototype={handleOpenPrototype}
                onEditPrototype={handleEditPrototype}
                onDuplicatePrototype={handleDuplicatePrototype}
                onDeletePrototype={handleDeletePrototype}
                onOpenTemplates={() => navigate('/templates')}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePrototype
                onSave={handleSavePrototype}
                onCancel={() => {
                  navigate('/');
                  setSelectedTemplate(null);
                }}
                template={selectedTemplate}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditPrototypeRoute />
            </ProtectedRoute>
          }
        />

        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage
                onBack={() => navigate('/')}
                onEditQuestionTemplate={() => {
                  // For now, just stay on templates - editing is handled in TemplatesPage
                }}
                onEditPrototypeTemplate={() => {
                  // For now, just stay on templates - editing is handled in TemplatesPage
                }}
              />
            </ProtectedRoute>
          }
        />
      </Routes>

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleTemplateSelect}
        prototypeTemplates={prototypeTemplates}
        type="prototype"
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
