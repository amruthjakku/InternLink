'use client';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Security Information</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">About InternLink</h2>
              <p className="text-gray-600">
                InternLink is a legitimate internship management application designed to help educational institutions 
                track and manage their internship programs. This application is built with modern web technologies 
                and follows security best practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Technology Stack</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Frontend: Next.js 14 with React 18</li>
                <li>Backend: Node.js with MongoDB</li>
                <li>Authentication: NextAuth.js with GitLab OAuth</li>
                <li>Hosting: Render.com with SSL/TLS encryption</li>
                <li>Database: MongoDB Atlas with encryption at rest</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Security Measures</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>HTTPS encryption for all communications</li>
                <li>Content Security Policy (CSP) headers</li>
                <li>XSS protection and content type validation</li>
                <li>Secure authentication with OAuth 2.0</li>
                <li>Regular security audits and dependency updates</li>
                <li>Input validation and sanitization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Protection</h2>
              <p className="text-gray-600">
                We take data protection seriously. All user data is encrypted in transit and at rest. 
                We only collect necessary information for the internship management process and follow 
                privacy best practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Reporting Security Issues</h2>
              <p className="text-gray-600">
                If you discover a security vulnerability, please report it responsibly by contacting 
                our security team. We appreciate your help in keeping our platform secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">False Positive Notice</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  <strong>Important:</strong> If you're seeing a security warning for this site, it may be a false positive. 
                  This is a legitimate educational application with no malicious content. The warning may be triggered by:
                </p>
                <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                  <li>OAuth authentication flows with GitLab</li>
                  <li>Dynamic content generation</li>
                  <li>Automated security scanning false positives</li>
                </ul>
                <p className="text-yellow-800 mt-2">
                  We have reported this as a false positive to Google Safe Browsing and are working to resolve it.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}