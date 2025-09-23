import { LoginForm } from "@/components/login-form";
import bg from "@/components/bg.jpg"


export default function Page() {
  return (
    <div 
      className="relative flex justify-center items-center p-6 md:p-10 w-full min-h-svh"
      style={{
        backgroundImage: `url('${bg.src}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        imageRendering: "high-quality" as const,
        WebkitImageRendering: "high-quality" as const
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="z-10 relative w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
