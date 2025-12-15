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
import ActivityLog from './components/ActivityLog';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import Loader from './components/Loader';

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
  const { prototypes, updatePrototypeInState, removePrototypeFromState, isLoading } = useRealtimePrototypes();
  const { withLoading } = useLoading();
  const { confirm } = useModal();

  // Load prototype templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await getPrototypeTemplates();
        setPrototypeTemplates(templates);
      } catch (error) {
        console.error('Error loading prototype templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Reload templates when template selector opens to ensure we have the latest templates
  useEffect(() => {
    if (showTemplateSelector) {
      const loadTemplates = async () => {
        try {
          const templates = await getPrototypeTemplates();
          setPrototypeTemplates(templates);
        } catch (error) {
          console.error('Error loading prototype templates:', error);
        }
      };
      loadTemplates();
    }
  }, [showTemplateSelector]);

  const handleSavePrototype = async (prototype: Prototype) => {
    const result = await withLoading(() => savePrototype(prototype));
    // Update local state immediately for instant UI feedback
    if (result.success && result.data) {
      updatePrototypeInState(result.data);
    }
    // Realtime will also update, but local state update provides instant feedback
    navigate('/');
  };

  const handleDeletePrototype = async (id: string) => {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this prototype?',
    });
    if (confirmed) {
      await withLoading(() => deletePrototype(id));
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
      const result = await withLoading(() => savePrototype(duplicated));
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
    
    // Explicitly check if we're on the prototype route
    // React Router should handle this, but we add an extra check to ensure proper unmounting
    const isOnPrototypeRoute = location.pathname.startsWith('/prototype/') && !!id;
    
    // Create a stable callback for onExit that properly handles navigation
    const handleExit = useCallback(() => {
      console.log('PrototypeView onExit called, navigating to home');
      // Only navigate to home if authenticated, otherwise stay on page
      if (isAuthenticated) {
        // Use window.location.href to force a full navigation
        // This ensures React Router properly switches routes and unmounts the component
        window.location.href = '/';
      } else {
        // For public users, exit doesn't navigate anywhere
        // They can close the tab or use browser back button
        console.log('Public user - exit action ignored');
      }
    }, [isAuthenticated]);
    
    // If we're not on a prototype route anymore, don't render
    // This ensures the component doesn't render when navigating away
    if (!isOnPrototypeRoute) {
      return null;
    }
    
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
                isLoading={isLoading}
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

        {/* Activity Log - accessible only via direct link, not from app navigation */}
        <Route
          path="/activitylog"
          element={<ActivityLog />}
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
    <LoadingProvider>
      <ModalProvider>
        <BrowserRouter>
          <AppContent />
          <Loader />
        </BrowserRouter>
      </ModalProvider>
    </LoadingProvider>
  );
}
