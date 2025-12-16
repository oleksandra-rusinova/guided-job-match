import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode | ((props: {
    attributes: any;
    listeners: any;
    isDragging: boolean;
  }) => React.ReactNode);
  className?: string;
  disabled?: boolean;
  dragHandleId?: string;
}

export function SortableItem({
  id,
  children,
  className = '',
  disabled = false,
  dragHandleId,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderProps = { attributes, listeners, isDragging };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
    >
      {typeof children === 'function' ? children(renderProps) : children}
    </div>
  );
}

// Hook to get drag handle props for a specific handle element
export function useSortableDragHandle(id: string) {
  const { attributes, listeners } = useSortable({ id });
  return {
    ...attributes,
    ...listeners,
    className: 'cursor-grab active:cursor-grabbing touch-none',
  };
}

