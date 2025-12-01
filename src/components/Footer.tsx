import { ArrowLeft, ArrowRight } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface FooterProps {
  onExit: () => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  primaryColor: string;
  isNextDisabled?: boolean;
  isApplicationStep?: boolean;
  onRefineSelection?: () => void;
}

export default function Footer({ 
  onExit, 
  onNext, 
  onBack, 
  canGoBack, 
  canGoNext, 
  primaryColor,
  isNextDisabled = false,
  isApplicationStep = false,
  onRefineSelection
}: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 py-3">
      <div className="mx-auto px-4 flex items-center justify-between">
        {/* Left side buttons */}
        <div className="flex items-center gap-4">
          {/* Exit button */}
        <SecondaryButton onClick={onExit}>
          Exit
        </SecondaryButton>

          {/* Refine Selection button - only for application steps */}
          {isApplicationStep && onRefineSelection && (
            <SecondaryButton onClick={onRefineSelection}>
              Refine Selection
            </SecondaryButton>
          )}
        </div>

        {/* Right side buttons */}
        {isApplicationStep ? (
          /* Application step: only Back button */
          <div className="flex items-center gap-4">
            {canGoBack && (
              <SecondaryButton
                onClick={onBack}
                icon={<ArrowLeft size={20} />}
                aria-label="Previous"
              >
                {''}
              </SecondaryButton>
            )}
          </div>
        ) : (
          /* Regular step: Back and Next buttons */
        <div className="flex items-center gap-4">
          {/* Back button with arrow - only show if can go back */}
          {canGoBack && (
            <SecondaryButton
              onClick={onBack}
              icon={<ArrowLeft size={20} />}
              aria-label="Previous"
            >
              {''}
            </SecondaryButton>
          )}

          {/* Next button with primary color */}
          <PrimaryButton
            onClick={onNext}
            disabled={!canGoNext || isNextDisabled}
            primaryColor={primaryColor}
          >
            Next
            <ArrowRight size={20} />
          </PrimaryButton>
        </div>
        )}
      </div>
    </footer>
  );
}
