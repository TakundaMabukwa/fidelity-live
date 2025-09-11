'use client';

import React, { useEffect, useState } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
    first_name?: string;
  };
}

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    const fullName = user.user_metadata?.full_name;
    const firstName = user.user_metadata?.first_name;
    const email = user.email;
    
    if (fullName) return fullName;
    if (firstName) return firstName;
    if (email) return email.split('@')[0];
    return 'User';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-slate-800 shadow-sm border-slate-700 border-b text-white">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hover:bg-slate-700 text-white">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="font-bold text-lg">FIDELITY</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-sm">Loading...</span>
          ) : (
            <span className="text-sm">Good morning, {getUserDisplayName()}</span>
          )}
          <Button variant="ghost" size="sm" className="hover:bg-slate-700 text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="bg-slate-700 hover:bg-slate-700 rounded-full w-8 h-8 text-white">
            {loading ? '...' : getUserInitial()}
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-slate-700 text-white">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}