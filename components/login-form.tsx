"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Redirect to dashboard after successful login
      router.push("/protected/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Fidelity Logo - Above the login box */}
      <div className="flex justify-center">
        <Image 
          src="https://fidelity-services.com/wp-content/uploads/2021/08/Fidelity-logo.svg" 
          alt="Fidelity Logo" 
          width={280}
          height={90}
          className="w-auto h-20"
        />
      </div>
      
      <Card className="shadow-lg mx-auto w-full max-w-xl">
        <CardHeader className="space-y-6 text-center">
          <div className="space-y-2">
            <CardTitle className="font-bold text-gray-900 text-3xl">Welcome Back!</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Let&apos;s get you signed in securely.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-gray-700 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Your Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-medium text-gray-700 text-sm">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                >
                  Forgot Your Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12 h-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="top-1/2 right-3 absolute focus:outline-none text-gray-500 hover:text-gray-700 -translate-y-1/2 transform"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <Button 
              type="submit" 
              className="bg-gray-900 hover:bg-gray-800 w-full h-12 font-medium text-white text-base" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Log in with Email"}
            </Button>
          </form>
          
        </CardContent>
      </Card>
    </div>
  );
}
