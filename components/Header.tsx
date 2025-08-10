import * as React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto flex items-center">
        <i className="fa-solid fa-cloud-bolt text-3xl text-cyan-400 mr-4"></i>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">
          Hurricane Tracker
        </h1>
      </div>
    </header>
  );
};

export default Header;