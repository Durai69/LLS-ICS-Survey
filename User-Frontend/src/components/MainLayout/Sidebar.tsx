import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Logo from '../Logo';

interface SidebarProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  section: 'main' | 'others';
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      ),
      section: 'main',
    },
    {
      title: 'Survey',
      path: '/departments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      section: 'main',
    },
    {
      title: 'Excel',
      path: '/excel',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      section: 'main',
    },
    {
      title: 'Remarks & Response',
      path: '/remarks-response',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      section: 'main',
    },
    {
      title: 'Accounts',
      path: '/account',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      section: 'others',
    },
    {
      title: 'Help',
      path: '/help',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      section: 'others',
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}
      
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground h-screen flex flex-col z-50",
          isMobile
            ? "fixed top-0 left-0 w-64 transform transition-transform duration-200 ease-in-out"
            : "w-64 min-w-[16rem]",
          isMobile && !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="p-4 flex justify-center">
          <Logo />
        </div>
        
        <div className="mt-8 px-4">
          <div className="text-xs font-medium tracking-wider mb-4">MENU</div>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.section === 'main')
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-md transition-colors hover:bg-sidebar-accent",
                    location.pathname === item.path
                      ? "bg-sidebar-accent"
                      : "transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
          </nav>
        </div>
        
        <div className="mt-8 px-4">
          <div className="text-xs font-medium tracking-wider mb-4">OTHERS</div>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.section === 'others')
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-md transition-colors hover:bg-sidebar-accent",
                    location.pathname === item.path
                      ? "bg-sidebar-accent"
                      : "transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
          </nav>
        </div>

        <div className="mt-auto px-4 mb-8">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-3 rounded-md transition-colors hover:bg-sidebar-accent w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
