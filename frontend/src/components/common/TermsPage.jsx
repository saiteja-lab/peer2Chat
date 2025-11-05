import React from "react";

export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white shadow-2xl rounded-2xl p-8 border border-indigo-100">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
          Terms & Conditions
        </h1>

        <div className="space-y-4 text-gray-700 leading-relaxed h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100">
          <p>
            Welcome to our Chat Application. By accessing or using our service,
            you agree to comply with these Terms and Conditions. Please read
            them carefully before using the app.
          </p>

          <h2 className="text-xl font-semibold text-indigo-600 mt-4">
            1. Usage Guidelines
          </h2>
          <p>
            You agree not to misuse the platform for harassment, spamming, or
            sharing inappropriate content. Respect other users’ privacy and
            communication boundaries.
          </p>

          <h2 className="text-xl font-semibold text-indigo-600 mt-4">
            2. Account Responsibility
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials. Any activity under your account is your
            responsibility.
          </p>

          <h2 className="text-xl font-semibold text-indigo-600 mt-4">
            3. Data & Privacy
          </h2>
          <p>
            We collect limited personal information to improve your chat
            experience. Your data will not be shared with third parties without
            consent, except as required by law.
          </p>

          <h2 className="text-xl font-semibold text-indigo-600 mt-4">
            4. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms or engage in harmful activity.
          </p>

          <h2 className="text-xl font-semibold text-indigo-600 mt-4">
            5. Updates to Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the
            service after changes implies acceptance of the new terms.
          </p>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
