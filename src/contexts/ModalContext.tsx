import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  isDeleting?: boolean;
}

interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: () => void;
  } | null>(null);

  const confirmStateRef = useRef(confirmState);
  confirmStateRef.current = confirmState;

  const alertStateRef = useRef(alertState);
  alertStateRef.current = alertState;

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options: { ...options, isDeleting: false },
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = useCallback(() => {
    const currentState = confirmStateRef.current;
    if (currentState && !currentState.options.isDeleting) {
      currentState.resolve(false);
      setConfirmState(null);
    }
  }, []);

  const handleConfirmConfirm = useCallback(() => {
    const currentState = confirmStateRef.current;
    if (currentState && !currentState.options.isDeleting) {
      const resolveFn = currentState.resolve;
      // Resolve the promise first, then clear state
      resolveFn(true);
      setConfirmState(null);
    }
  }, []);


  const handleAlertClose = useCallback(() => {
    const currentState = alertStateRef.current;
    if (currentState) {
      currentState.resolve();
      setAlertState(null);
    }
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      {confirmState && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={handleConfirmClose}
          onConfirm={handleConfirmConfirm}
          title={confirmState.options.title}
          message={confirmState.options.message}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
          confirmButtonColor={confirmState.options.confirmButtonColor}
          isDeleting={confirmState.options.isDeleting}
        />
      )}
      {alertState && (
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={handleAlertClose}
          title={alertState.options.title}
          message={alertState.options.message}
          buttonText={alertState.options.buttonText}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

