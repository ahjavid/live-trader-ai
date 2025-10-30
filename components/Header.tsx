import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-surface shadow-md border-b border-white/10 flex-shrink-0">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            Live Trader AI
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;