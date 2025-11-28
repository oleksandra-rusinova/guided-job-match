import React, { useRef, useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface FileInfo {
  name: string;
  size: number;
  dataUrl: string;
}

interface FileUploaderProps {
  value?: FileInfo; // Current file info
  onChange: (file: File | null, fileInfo: FileInfo | null) => void;
  onMultipleChange?: (files: File[], fileInfos: FileInfo[]) => void; // For multiple file selection
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  multiple?: boolean; // Enable multiple file selection
}

export default function FileUploader({
  value,
  onChange,
  onMultipleChange,
  accept = 'image/*',
  maxSize = 5, // 5MB default
  className = '',
  disabled = false,
  showPreview = true,
  multiple = false
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError('');
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError('Invalid file type');
      return false;
    }

    return true;
  }, [maxSize, accept]);

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string
      };
      onChange(file, fileInfo);
    };
    reader.readAsDataURL(file);
  }, [validateFile, onChange]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (multiple && onMultipleChange) {
      // Handle multiple files
      const validFiles: File[] = [];
      const fileInfos: FileInfo[] = [];
      let processedCount = 0;
      const totalFiles = files.length;

      Array.from(files).forEach((file) => {
        if (!validateFile(file)) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
            dataUrl: reader.result as string
          };
          validFiles.push(file);
          fileInfos.push(fileInfo);
          processedCount++;

          // Call onMultipleChange when all files are processed
          if (processedCount === totalFiles) {
            onMultipleChange(validFiles, fileInfos);
            // Reset input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      // Handle single file (backward compatible)
      const file = files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (multiple && onMultipleChange) {
      // Handle multiple files from drag and drop
      const validFiles: File[] = [];
      const fileInfos: FileInfo[] = [];
      let processedCount = 0;
      let validCount = 0;
      const totalFiles = files.length;

      Array.from(files).forEach((file) => {
        if (!validateFile(file)) {
          processedCount++;
          if (processedCount === totalFiles && validFiles.length > 0) {
            onMultipleChange(validFiles, fileInfos);
          }
          return;
        }

        validCount++;
        const reader = new FileReader();
        reader.onloadend = () => {
          const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
            dataUrl: reader.result as string
          };
          validFiles.push(file);
          fileInfos.push(fileInfo);
          processedCount++;

          // Call onMultipleChange when all files are processed
          if (processedCount === totalFiles && validFiles.length > 0) {
            onMultipleChange(validFiles, fileInfos);
          }
        };
        reader.readAsDataURL(file);
      });

      // If no valid files, still increment processedCount for invalid ones
      if (validCount === 0) {
        processedCount = totalFiles;
      }
    } else {
      // Handle single file (backward compatible)
      const file = files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  }, [disabled, handleFileSelect, multiple, onMultipleChange, validateFile]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasValue = value && value.dataUrl && value.dataUrl.trim() !== '';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 bytes';
    if (bytes < 1024) return bytes + ' bytes';
    
    const k = 1024;
    const sizes = ['KB', 'MB', 'GB'];
    
    // Find the appropriate unit by checking ranges
    let index = 0;
    let size = bytes / k;
    
    if (size >= k) {
      size = bytes / (k * k);
      index = 1;
      if (size >= k) {
        size = bytes / (k * k * k);
        index = 2;
      }
    }
    
    return parseFloat(size.toFixed(2)) + ' ' + sizes[index];
  };

  // isEmpty is computed but not used - keeping for potential future use
  // const isEmpty = !(hasValue && showPreview);

return (
  <div className={`file-uploader ${className}`}>
    {hasValue && showPreview ? (
      // Show only the file card when file is uploaded
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm">
        <div className="flex-shrink-0">
          <img
            src={value.dataUrl}
            alt="Preview"
            className="w-10 h-10 object-cover border-gray-200 rounded-lg"
          />
        </div>

        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">{value.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(value.size)}</p>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
          disabled={disabled}
          aria-label="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    ) : (
      // Show upload area when no file is uploaded
      <div
        className={[
          // base
          "border border-dashed rounded-lg transition-colors duration-200 cursor-pointer bg-white h-48 flex flex-col items-center justify-center px-6 py-8",
          isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          error ? "border-red-300 bg-red-50" : ""
        ].join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          multiple={multiple}
        />

        <div className="text-center">
          {/* Upload Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
              <Upload size={24} className="text-gray-600" />
            </div>
          </div>
          
          {/* Main instruction text */}
          <div className="mb-2">
            <span className="text-gray-600 font-medium cursor-pointer hover:text-gray-700 transition-colors">
              {multiple ? 'Select files to upload' : 'Select a file to upload'}
            </span>
            <span className="text-gray-600"> or drag and drop {multiple ? 'them' : 'it'} here</span>
          </div>
          
          {/* File restrictions */}
          <p className="text-sm text-gray-500">
            {accept.includes('image') ? 'PNG, JPG, GIF up to' : 'File up to'} {maxSize}MB
          </p>
        </div>
      </div>
    )}

    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
  );
}