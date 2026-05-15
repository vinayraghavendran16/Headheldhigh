import { Linkedin } from 'lucide-react';

interface LinkedInInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function LinkedInInput({ value, onChange, error }: LinkedInInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Linkedin className="h-4 w-4 text-blue-500" />
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://linkedin.com/in/yourname"
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
