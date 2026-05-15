import Navbar from '../components/Navbar';
import WeeklyDigestExport from '../components/WeeklyDigestExport';

export default function AdminDigest() {
  const userId = localStorage.getItem('userId');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userId={userId ? Number(userId) : undefined} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin – Weekly Digest</h1>
          <p className="text-gray-500 text-sm mt-1">
            View and export the list of professionals who joined this week.
          </p>
        </div>
        <WeeklyDigestExport />
      </div>
    </div>
  );
}
