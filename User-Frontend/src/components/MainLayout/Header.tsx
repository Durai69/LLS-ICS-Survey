
import React from 'react';

interface HeaderProps {
  title: string;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, isMobile, toggleSidebar }) => {
  return (
    <header className="bg-white py-4 px-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-medium text-gray-800">
            LAKSHMI LIFE SCIENCES PRIVATE LIMITED
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
