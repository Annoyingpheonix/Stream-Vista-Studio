
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile } from '../types';
import { Search, Bell, Menu, X, User } from 'lucide-react';
import ProfileModal from './ProfileModal';

interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, userProfile, onUpdateProfile }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', view: AppView.HOME },
    { label: 'TV Shows', view: AppView.SERIES },
    { label: 'Movies', view: AppView.MOVIES },
    { label: 'My List', view: AppView.MY_LIST },
    { label: 'Studio', view: AppView.STUDIO },
  ];

  return (
    <>
      <nav className={`fixed top-0 w-full z-40 transition-colors duration-300 ${scrolled || mobileMenuOpen ? 'bg-zinc-950' : 'bg-transparent'}`}>
        <div className="px-4 md:px-16 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div 
               className="text-emerald-400 font-bold text-2xl md:text-3xl cursor-pointer tracking-tighter" 
               onClick={() => onChangeView(AppView.HOME)}
            >
              STREAMVISTA
            </div>
            
            <div className="hidden md:flex gap-6">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onChangeView(item.view)}
                  className={`text-sm font-medium transition-colors ${currentView === item.view ? 'text-white' : 'text-zinc-300 hover:text-emerald-400'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-white">
            <button 
               onClick={() => onChangeView(AppView.SEARCH)}
               className="hover:text-emerald-400 transition-colors"
            >
              <Search size={20} />
            </button>
            <button className="hidden md:block hover:text-emerald-400 transition-colors">
              <Bell size={20} />
            </button>
            
            {/* User Profile Trigger */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-emerald-600/50 group-hover:border-emerald-500 transition-colors">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-black font-bold text-xs">
                    {userProfile.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </button>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950 absolute top-full w-full py-4 border-t border-zinc-800 flex flex-col gap-2 px-4 shadow-xl">
             <div className="flex items-center gap-3 px-4 py-3 mb-2 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                   <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                   <p className="font-bold text-white">{userProfile.username}</p>
                   <button onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }} className="text-xs text-emerald-400 hover:underline">Edit Profile</button>
                </div>
             </div>
             {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                      onChangeView(item.view);
                      setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${currentView === item.view ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                >
                  {item.label}
                </button>
              ))}
          </div>
        )}
      </nav>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        profile={userProfile}
        onSave={onUpdateProfile}
      />
    </>
  );
};

export default Navbar;
