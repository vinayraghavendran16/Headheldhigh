import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  error?: string;
  selectedFile?: File | null;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
};

export default function ResumeUpload({
  onFileSelect,
  isUploading = false,
  error,
  selectedFile,
}: ResumeUploadProps) {
  const [dropError, setDropError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { errors: { message: string }[] }[]) => {
      setDropError('');
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0]?.message || 'Invalid file';
        setDropError(err);
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  const displayError = error || dropError;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : selectedFile
              ? 'border-green-400 bg-green-50'
              : displayError
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50',
          isUploading && 'opacity-60 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-medium text-green-700">{selectedFile.name}</p>
              <p className="text-sm text-green-600 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!isUploading && (
              <p className="text-xs text-gray-500">Click or drag to replace</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragActive ? (
              <>
                <Upload className="h-12 w-12 text-indigo-500 animate-bounce" />
                <p className="text-indigo-600 font-medium">Drop your resume here</p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-700">
                    Drag & drop your resume, or{' '}
                    <span className="text-indigo-600">browse</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PDF, DOCX, DOC, or TXT — max 10 MB</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
