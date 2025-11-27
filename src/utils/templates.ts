import { QuestionTemplate, PrototypeTemplate, ApplicationStepTemplate, Step, Prototype } from '../types';

const QUESTION_TEMPLATES_KEY = 'questionTemplates';
const PROTOTYPE_TEMPLATES_KEY = 'prototypeTemplates';
const APPLICATION_STEP_TEMPLATES_KEY = 'applicationStepTemplates';

// Question Templates
export const getQuestionTemplates = (): QuestionTemplate[] => {
  const data = localStorage.getItem(QUESTION_TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveQuestionTemplate = (template: QuestionTemplate): void => {
  const templates = getQuestionTemplates();
  const index = templates.findIndex(t => t.id === template.id);

  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  localStorage.setItem(QUESTION_TEMPLATES_KEY, JSON.stringify(templates));
};

export const deleteQuestionTemplate = (id: string): void => {
  const templates = getQuestionTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(QUESTION_TEMPLATES_KEY, JSON.stringify(filtered));
};

export const updateQuestionTemplate = (id: string, updates: Partial<QuestionTemplate>): void => {
  const templates = getQuestionTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates };
    localStorage.setItem(QUESTION_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const getQuestionTemplate = (id: string): QuestionTemplate | undefined => {
  const templates = getQuestionTemplates();
  return templates.find(t => t.id === id);
};

export const createQuestionTemplate = (name: string, step: Step): QuestionTemplate => {
  return {
    id: crypto.randomUUID(),
    name,
    step: { ...step, id: crypto.randomUUID() }, // Create new ID for the step
    createdAt: new Date().toISOString(),
  };
};

// Prototype Templates
export const getPrototypeTemplates = (): PrototypeTemplate[] => {
  const data = localStorage.getItem(PROTOTYPE_TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePrototypeTemplate = (template: PrototypeTemplate): void => {
  const templates = getPrototypeTemplates();
  const index = templates.findIndex(t => t.id === template.id);

  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(templates));
};

export const deletePrototypeTemplate = (id: string): void => {
  const templates = getPrototypeTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(filtered));
};

export const updatePrototypeTemplate = (id: string, updates: Partial<PrototypeTemplate>): void => {
  const templates = getPrototypeTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates };
    localStorage.setItem(PROTOTYPE_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const getPrototypeTemplate = (id: string): PrototypeTemplate | undefined => {
  const templates = getPrototypeTemplates();
  return templates.find(t => t.id === id);
};

export const createPrototypeTemplate = (
  name: string,
  prototype: Prototype
): PrototypeTemplate => {
  const { id, createdAt, updatedAt, ...prototypeData } = prototype;
  return {
    id: crypto.randomUUID(),
    name,
    prototype: {
      ...prototypeData,
      steps: prototypeData.steps.map(step => ({
        ...step,
        id: crypto.randomUUID(), // Create new IDs for steps
        elements: step.elements.map(el => ({
          ...el,
          id: crypto.randomUUID(), // Create new IDs for elements
        })),
      })),
    },
    createdAt: new Date().toISOString(),
  };
};

// Application Step Templates
export const getApplicationStepTemplates = (): ApplicationStepTemplate[] => {
  const data = localStorage.getItem(APPLICATION_STEP_TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveApplicationStepTemplate = (template: ApplicationStepTemplate): void => {
  const templates = getApplicationStepTemplates();
  const index = templates.findIndex(t => t.id === template.id);

  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, JSON.stringify(templates));
};

export const deleteApplicationStepTemplate = (id: string): void => {
  const templates = getApplicationStepTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, JSON.stringify(filtered));
};

export const updateApplicationStepTemplate = (id: string, updates: Partial<ApplicationStepTemplate>): void => {
  const templates = getApplicationStepTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates };
    localStorage.setItem(APPLICATION_STEP_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const getApplicationStepTemplate = (id: string): ApplicationStepTemplate | undefined => {
  const templates = getApplicationStepTemplates();
  return templates.find(t => t.id === id);
};

export const createApplicationStepTemplate = (name: string, step: Step): ApplicationStepTemplate => {
  return {
    id: crypto.randomUUID(),
    name,
    step: { ...step, id: crypto.randomUUID() }, // Create new ID for the step
    createdAt: new Date().toISOString(),
  };
};

