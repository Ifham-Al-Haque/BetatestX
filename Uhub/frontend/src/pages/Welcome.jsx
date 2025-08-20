import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WelcomeNavbar from '../components/WelcomeNavbar';
import { 
  Car, 
  Shield, 
  Users, 
  BarChart3, 
  Calendar, 
  FileText,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const features = [
    {
      icon: Car,
      title: 'Fleet Management',
      description: 'Comprehensive driver and vehicle management system',
      color: 'from-[#2FF9B5] to-[#2562CF]'
    },
    {
      icon: Users,
      title: 'HR Operations',
      description: 'Employee management and performance tracking',
      color: 'from-[#FF51EB] to-[#2125DA]'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Data-driven insights and performance metrics',
      color: 'from-[#2562CF] to-[#2FF9B5]'
    },
    {
      icon: Calendar,
      title: 'Task Management',
      description: 'Efficient task assignment and tracking',
      color: 'from-[#2125DA] to-[#FF51EB]'
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, features.length]);

  // Remove automatic redirect - allow all users to access Welcome page
  // useEffect(() => {
  //   if (user && userProfile) {
  //     const userRole = userProfile.role || user.role;
  //     // Add a small delay to prevent immediate redirect
  //     const timer = setTimeout(() => {
  //       redirectToRolePage(userRole);
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [user, userProfile, navigate]);

  const redirectToRolePage = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'manager':
        navigate('/dashboard');
        break;
      case 'driver_management':
        navigate('/drivers');
        break;
      case 'hr_manager':
        navigate('/attendance');
        break;
      case 'cs_manager':
        navigate('/cspa');
        break;
      case 'employee':
        navigate('/tasks');
        break;
      case 'viewer':
        navigate('/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleFeatureClick = (index) => {
    setCurrentFeature(index);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // If user is logged in, show navbar layout
  if (user && userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Welcome Navbar */}
        <WelcomeNavbar />

        {/* Main content area */}
        <div className="pt-16">
          {/* Welcome content */}
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
                  Welcome back to{' '}
                  <span className="bg-gradient-to-r from-[#2FF9B5] to-[#FF51EB] bg-clip-text text-transparent">
                    UDrive Hub
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
                  Ready to continue managing your operations? Access your dashboard, 
                  manage tasks, or explore the latest features available to your role.
                </p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold text-[#2FF9B5] mb-3">
                    {userProfile.role === 'admin' ? 'Admin' : userProfile.role === 'cs_manager' ? 'CS Manager' : userProfile.role === 'hr_manager' ? 'HR Manager' : userProfile.role}
                  </div>
                  <div className="text-gray-600 text-base font-medium">Your Role</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold text-[#FF51EB] mb-3">
                    {userProfile.department || 'Department'}
                  </div>
                  <div className="text-gray-600 text-base font-medium">Department</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold text-[#2562CF] mb-3">
                    {userProfile.position || 'Position'}
                  </div>
                  <div className="text-gray-600 text-base font-medium">Position</div>
                </div>
              </div>

              {/* Feature showcase */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">System Features</h2>
                <div className="relative h-96 w-full">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentFeature
                          ? 'opacity-100 scale-100 rotate-0'
                          : 'opacity-0 scale-95 rotate-3'
                      }`}
                    >
                      <div className={`h-full w-full bg-gradient-to-br ${feature.color} rounded-3xl p-10 flex flex-col items-center justify-center text-center text-white shadow-2xl`}>
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
                          <feature.icon className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                        <p className="text-white/90 leading-relaxed text-lg">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature indicators */}
                <div className="flex justify-center space-x-4 mt-10">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleFeatureClick(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentFeature
                          ? 'bg-[#2FF9B5] scale-125'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Play/Pause control */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={togglePlayPause}
                    className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Play className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-logged in user - show full-screen welcome page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#14143A] via-[#2125DA] to-[#2562CF] overflow-hidden">
      {/* Welcome Navbar */}
      <WelcomeNavbar />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #2FF9B5 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #FF51EB 0%, transparent 50%)`,
          backgroundSize: '400px 400px'
        }} />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-8 py-24 pt-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-10">
            <div className="space-y-8">
              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-[#2FF9B5] to-[#FF51EB] bg-clip-text text-transparent">
                  UDrive Hub
                </span>
              </h1>
              <p className="text-2xl text-gray-200 leading-relaxed max-w-2xl">
                Your comprehensive fleet management and HR operations platform. 
                Streamline operations, enhance productivity, and drive success with our integrated solutions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={handleGetStarted}
                className="px-10 py-5 bg-gradient-to-r from-[#FF51EB] to-[#2125DA] text-white rounded-2xl hover:from-[#2125DA] hover:to-[#FF51EB] transition-all duration-300 transform hover:scale-105 font-semibold text-xl flex items-center justify-center space-x-3 shadow-2xl"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-6 h-6" />
              </button>
              <button className="px-10 py-5 border-2 border-white/30 text-white rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold text-xl">
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#2FF9B5]">500+</div>
                <div className="text-gray-300 text-base font-medium">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#FF51EB]">1000+</div>
                <div className="text-gray-300 text-base font-medium">Vehicles</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#2562CF]">99.9%</div>
                <div className="text-gray-300 text-base font-medium">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Side - Feature Showcase */}
          <div className="relative">
            <div className="relative h-96 w-full">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    index === currentFeature
                      ? 'opacity-100 scale-100 rotate-0'
                      : 'opacity-0 scale-95 rotate-3'
                  }`}
                >
                  <div className={`h-full w-full bg-gradient-to-br ${feature.color} rounded-3xl p-10 flex flex-col items-center justify-center text-center text-white shadow-2xl`}>
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
                      <feature.icon className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-white/90 leading-relaxed text-lg">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Indicators */}
            <div className="flex justify-center space-x-4 mt-10">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleFeatureClick(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentFeature
                      ? 'bg-[#2FF9B5] scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-8 mt-24">
        <div className="max-w-7xl mx-auto text-center">
          <div className="border-t border-white/20 pt-8">
            <p className="text-gray-400 text-base font-medium">
              © 2024 UDrive Hub. All rights reserved. Built with ❤️ for fleet excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
