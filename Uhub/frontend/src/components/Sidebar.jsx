// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "./Sidebar.css";
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  Receipt,
  Shield,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  BarChart3
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  // Check if we're on desktop
  const isDesktop = window.innerWidth >= 1024;
  
  // On desktop, sidebar should always be open
  const sidebarIsOpen = isDesktop ? true : isOpen;

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Assets", href: "/assets", icon: Building2 },
    { name: "Tickets", href: "/tickets", icon: Ticket },
    { name: "Expenses", href: "/expense-tracker", icon: Receipt },
    { name: "Attendance", href: "/attendance", icon: Calendar },
    { name: "Analytics", href: "/admin", icon: BarChart3 },
  ];

  const adminNavigation = [
    { name: "Access Requests", href: "/access-requests", icon: Shield },
    { name: "Access Management", href: "/access-management", icon: Settings },
    { name: "User Management", href: "/user-management", icon: Users },
  ];

  const userNavigation = [
    { name: "Profile", href: "/profile", icon: User },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // The AuthContext will handle the redirect to login
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Animation variants
  const sidebarVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const menuButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  const navItemVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    hover: { 
      x: 5,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { delay: 0.1, type: "spring", stiffness: 200 }
    }
  };

  const userInfoVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { delay: 0.2, type: "spring", stiffness: 200 }
    }
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <>
      {/* Mobile menu button */}
      <motion.div 
        className="lg:hidden fixed top-4 left-4 z-50"
        variants={menuButtonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-lg hover:shadow-xl transition-shadow duration-200"
          whileHover={{ 
            backgroundColor: "#f3f4f6",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <img
              src="/Uhub.png"
              alt="Uhub Logo"
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.href);
                
                return (
                  <div key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isItemActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                      }`}
                    >
                      {/* Icon */}
                      <Icon className={`w-5 h-5 mr-3 ${isItemActive ? 'text-white' : 'text-gray-600'}`} />
                      
                      {/* Text */}
                      <span>{item.name}</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Admin Navigation */}
            {role === "admin" && (
              <motion.div 
                className="pt-4 border-t border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.h3 
                  className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Admin
                </motion.h3>
                <motion.div 
                  className="mt-2 space-y-1"
                  initial="initial"
                  animate="animate"
                  transition={{ staggerChildren: 0.1, delayChildren: 0.4 }}
                >
                  {adminNavigation.map((item, index) => {
                    const Icon = item.icon;
                    const isItemActive = isActive(item.href);
                    
                    return (
                      <motion.div
                        key={item.name}
                        variants={navItemVariants}
                        whileHover="hover"
                        custom={index}
                      >
                        <Link
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden group ${
                            isItemActive
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                              : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                          }`}
                        >
                          {isItemActive && (
                            <motion.div
                              className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                              layoutId="adminActiveIndicator"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          
                          <motion.div
                            className="mr-3"
                            whileHover={{ rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Icon className={`w-5 h-5 ${isItemActive ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}`} />
                          </motion.div>
                          
                          <span className="relative z-10">{item.name}</span>
                          
                          {!isItemActive && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg"
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* User Navigation */}
            <motion.div 
              className="pt-4 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.h3 
                className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Account
              </motion.h3>
              <motion.div 
                className="mt-2 space-y-1"
                initial="initial"
                animate="animate"
                transition={{ staggerChildren: 0.1, delayChildren: 0.6 }}
              >
                {userNavigation.map((item, index) => {
                  const Icon = item.icon;
                  const isItemActive = isActive(item.href);
                  
                  return (
                    <motion.div
                      key={item.name}
                      variants={navItemVariants}
                      whileHover="hover"
                      custom={index}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden group ${
                          isItemActive
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                        }`}
                      >
                        {isItemActive && (
                          <motion.div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                            layoutId="userActiveIndicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                        
                        <motion.div
                          className="mr-3"
                          whileHover={{ rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Icon className={`w-5 h-5 ${isItemActive ? 'text-white' : 'text-gray-600 group-hover:text-green-600'}`} />
                        </motion.div>
                        
                        <span className="relative z-10">{item.name}</span>
                        
                        {!isItemActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </nav>

          {/* User Info & Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {role || "User"}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3 text-gray-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />
    </>
  );
}
