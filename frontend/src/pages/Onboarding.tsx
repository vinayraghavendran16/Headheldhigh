import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import LinkedInInput from '../components/LinkedInInput';
import { registerUser, uploadResume, refreshJobs } from '../services/api';
import type { UserCreate } from '../types';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  name: string;
  email: string;
  linkedin_url: string;
  location: string;
  desired_role: string;
  open_to_remote: boolean;
}

const INITIAL_FORM: FormData = {
  name: '',
  email: '',
  linkedin_url: '',
  location: '',
  desired_role: '',
  open_to_remote: false,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [uploadError, setUploadError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  function updateForm(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validateStep2(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!file) { setUploadError('Please select a resume file.'); return; }
    if (!validateStep2()) { setStep(2); return; }

    setStep(3);
    setIsProcessing(true);

    try {
      // 1) Register user
      setProcessingStatus('Creating your profile...');
      const userData: UserCreate = {
        name: form.name,
        email: form.email,
        linkedin_url: form.linkedin_url || undefined,
        location: form.location || undefined,
        desired_role: form.desired_role || undefined,
        open_to_remote: form.open_to_remote,
        is_public: true,
      };
      const user = await registerUser(userData);

      // 2) Upload & parse resume
      setProcessingStatus('Parsing your resume with AI...');
      await uploadResume(user.id, file);

      // 3) Refresh jobs + match
      setProcessingStatus('Finding and scoring job matches...');
      await refreshJobs(user.id);

      // 4) Done
      setProcessingStatus('All done!');
      localStorage.setItem('userId', String(user.id));

      setStep(4);
      setTimeout(() => navigate(`/dashboard/${user.id}`), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setUploadError(message);
      setStep(2);
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s
                    ? 'bg-green-500 text-white'
                    : step === s
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step 1: Resume upload */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your resume</h2>
              <p className="text-gray-500 text-sm mb-6">
                We'll use AI to extract your skills and experience automatically.
              </p>
              <ResumeUpload
                onFileSelect={(f) => { setFile(f); setUploadError(''); }}
                selectedFile={file}
                error={uploadError}
              />
              <button
                onClick={() => {
                  if (!file) { setUploadError('Please select a file first.'); return; }
                  setUploadError('');
                  setStep(2);
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Profile info */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about you</h2>
              <p className="text-gray-500 text-sm mb-6">
                This helps us tailor job matches and makes you findable by recruiters.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <LinkedInInput
                  value={form.linkedin_url}
                  onChange={(v) => updateForm('linkedin_url', v)}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateForm('location', e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired role
                  </label>
                  <input
                    type="text"
                    value={form.desired_role}
                    onChange={(e) => updateForm('desired_role', e.target.value)}
                    placeholder="Senior Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.open_to_remote}
                    onChange={(e) => updateForm('open_to_remote', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Open to remote roles
                  </span>
                </label>
              </div>

              {uploadError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Find My Matches <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Loading */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-6">
                <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Working on it...</h2>
              <p className="text-indigo-600 font-medium">{processingStatus}</p>
              <p className="text-gray-500 text-sm mt-2">This usually takes 20–40 seconds</p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
