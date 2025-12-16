import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableCardOptionProps {
  id: string;
  children: (handleProps: {
    attributes: any;
    listeners: any;
    isDragging: boolean;
  }) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SortableCardOption({
  id,
  children,
  className = '',
  disabled = false,
}: SortableCardOptionProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}

