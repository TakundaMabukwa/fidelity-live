import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div 
      className="relative flex justify-center items-center p-6 md:p-10 w-full min-h-svh"
      style={{
        backgroundImage: "url('https://scontent-jnb2-1.xx.fbcdn.net/v/t39.30808-6/482266998_9344935868927595_6100885459771978650_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=0b6b33&_nc_ohc=HxPYQgdZUvAQ7kNvwGHYvJk&_nc_oc=Adkth1ayN_-9moWsQ_4zY1zeMPH41Bq72Im4qieLOaOhEAtsO2xZUdOk2aFMJnZKRBc&_nc_zt=23&_nc_ht=scontent-jnb2-1.xx&_nc_gid=YyZMKFy8yElapRYzyTSDlg&oh=00_AfaPinFgKKW8b6BkJrDrHGuVQK0Zwrb9Wr6_pUOZilB7IQ&oe=68C7A70A')",
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
