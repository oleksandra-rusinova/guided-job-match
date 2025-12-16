export type ElementType =
  | 'text_field'
  | 'simple_cards'
  | 'image_cards'
  | 'advanced_cards'
  | 'image_only_card'
  | 'dropdown'
  | 'checkboxes'
  | 'calendar_field'
  | 'yes_no_cards'
  | 'application_card';

export interface Element {
  id: string;
  type: ElementType;
  config: {
    label?: string;
    hasLabel?: boolean;
    placeholder?: string;
    heading?: string;
    subheading?: string;
    link?: string;
    imageUrl?: string;
    imageUploadMode?: 'upload' | 'url';
    selectionType?: 'single' | 'multiple';
    maxSelection?: number;
    options?: Array<{
      id: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      imageUploadMode?: 'upload' | 'url';
      heading?: string;
      subheading?: string;
      link?: string;
      // Advanced cards specific config
      mainText?: string;
      linkSupportingText?: string;
      linkEnabled?: boolean;
      linkUrl?: string;
      linkText?: string;
      // Application card specific config
      jobTitle?: string;
      location?: string;
      department?: string;
      jobType?: string;
      jobId?: string;
      jobDescription?: string;
      primaryButtonLink?: string;
      learnMoreButtonLink?: string;
    }>;
    // Calendar field specific config
    dateFormat?: string;
    minDate?: string;
    maxDate?: string;
    defaultDate?: string;
    required?: boolean;
    // Yes/No cards specific config
    yesText?: string;
    noText?: string;
  };
}

export interface Step {
  id: string;
  name: string;
  question: string;
  description: string;
  splitScreenWithImage: boolean;
  imageUrl?: string;
  imageUploadMode?: 'upload' | 'url';
  imagePosition?: 'left' | 'right';
  imageHasTitle?: boolean;
  imageTitle?: string;
  imageSubtitle?: string;
  elements: Element[];
  isApplicationStep?: boolean;
  applicationStepHeading?: string;
  applicationStepSubheading?: string;
  tags?: Array<{
    id: string;
    name: string;
    elementId?: string; // Reference to element this tag depends on
  }>;
}

export interface Prototype {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  logoUrl?: string;
  logoUploadMode: 'upload' | 'url';
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}

export type WidgetType =
  | 'selectable_cards'
  | 'form'
  | 'cards'
  | 'dropdown'
  | 'checkboxes'
  | 'image_cards';

export interface Widget {
  id: string;
  type: WidgetType;
  config: {
    title?: string;
    description?: string;
    options?: Array<{
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
    }>;
    fields?: Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
    }>;
  };
  position: number;
}

export interface QuestionTemplate {
  id: string;
  name: string;
  step: Step;
  createdAt: string;
}

export interface PrototypeTemplate {
  id: string;
  name: string;
  prototype: Omit<Prototype, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: string;
}

export interface ApplicationStepTemplate {
  id: string;
  name: string;
  step: Step;
  createdAt: string;
}
