'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import RoleSelection from './RoleSelection';
import MentorOnboarding from './MentorOnboarding';
import InternOnboarding from './InternOnboarding';

export default function OnboardingFlow() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState('role-selection');
  const [selectedRole, setSelectedRole] = useState(null);
  const [onboardingData, setOnboardingData] = useState({});
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);

  useEffect(() => {
    // Check if this is demo mode from URL params or localStorage
    const isDemoMode = searchParams.get('demo') === 'true' || localStorage.getItem('demoMode') === 'true';
    const demoRole = searchParams.get('role');
    
    if (isDemoMode) {
      setDemoMode(true);
      
      if (demoRole) {
        const demoDemoUser = {
          id: demoRole === 'mentor' ? 'demo_mentor_1' : 'demo_intern_1',
          name: demoRole === 'mentor' ? 'Dr. Sarah Wilson' : 'John Smith',
          email: demoRole === 'mentor' ? 'mentor@demo.com' : 'intern@demo.com',
          gitlabId: demoRole === 'mentor' ? '999999' : '888888',
          gitlabUsername: demoRole === 'mentor' ? 'demo_mentor' : 'demo_intern',
          image: 'https://via.placeholder.com/150',
          role: demoRole,
          isDemo: true
        };
        setDemoUser(demoDemoUser);
        setSelectedRole(demoRole);
        setCurrentStep(demoRole === 'mentor' ? 'mentor-onboarding' : 'intern-onboarding');
      }
      setLoading(false);
      return;
    }

    if (status === 'loading') return;
    
    if (!session && !isDemoMode) {
      router.push('/');
      return;
    }

    if (session) {
      // Check if user has already completed onboarding
      checkOnboardingStatus();
    }
  }, [session, status, searchParams]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding');
      const data = await response.json();
      
      if (data.onboardingComplete) {
        // Redirect to appropriate dashboard
        if (data.role === 'mentor') {
          router.push('/mentor/dashboard');
        } else if (data.role === 'intern') {
          router.push('/intern/dashboard');
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setCurrentStep(role === 'mentor' ? 'mentor-onboarding' : 'intern-onboarding');
  };

  const handleOnboardingComplete = async (data) => {
    try {
      setLoading(true);
      
      if (demoMode) {
        // For demo mode, set localStorage and redirect to the appropriate dashboard
        localStorage.setItem('demoMode', 'true');
        localStorage.setItem('demoRole', selectedRole);
        if (selectedRole === 'mentor') {
          router.push('/mentor/dashboard?demo=true');
        } else if (selectedRole === 'intern') {
          router.push('/intern/dashboard?demo=true');
        }
        return;
      }

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          onboardingData: data
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to appropriate dashboard
        if (selectedRole === 'mentor') {
          router.push('/mentor/dashboard');
        } else if (selectedRole === 'intern') {
          router.push('/intern/dashboard');
        }
      } else {
        throw new Error(result.error || 'Onboarding failed');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'mentor-onboarding' || currentStep === 'intern-onboarding') {
      if (demoMode) {
        // In demo mode, go back to login
        router.push('/');
      } else {
        setCurrentStep('role-selection');
        setSelectedRole(null);
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session && !demoMode) {
    return null;
  }

  const userInfo = demoMode ? demoUser : session?.user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center justify-center">
              <span className="text-yellow-800 text-sm font-medium">
                🎭 Demo Mode - {selectedRole === 'mentor' ? 'Mentor' : 'Intern'} Experience
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Progress Tracker</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'role-selection' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                1
              </div>
              <div className="w-16 h-1 bg-gray-200">
                <div className={`h-full bg-blue-600 transition-all duration-300 ${
                  currentStep !== 'role-selection' ? 'w-full' : 'w-0'
                }`}></div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep !== 'role-selection' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'role-selection' && !demoMode && (
          <RoleSelection 
            onRoleSelect={handleRoleSelection}
            userInfo={userInfo}
          />
        )}

        {currentStep === 'mentor-onboarding' && (
          <MentorOnboarding 
            onComplete={handleOnboardingComplete}
            onBack={handleBack}
            userInfo={userInfo}
            demoMode={demoMode}
          />
        )}

        {currentStep === 'intern-onboarding' && (
          <InternOnboarding 
            onComplete={handleOnboardingComplete}
            onBack={handleBack}
            userInfo={userInfo}
            demoMode={demoMode}
          />
        )}
      </div>
    </div>
  );
}