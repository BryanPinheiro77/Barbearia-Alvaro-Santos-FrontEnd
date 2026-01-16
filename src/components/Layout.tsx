import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">
        <span className="font-bold">Barbearia Alvaro Santos</span>

        <div className="flex gap-4 items-center">
          <span>{user?.nome}</span>
          <button
            onClick={handleLogout}
            className="text-sm underline hover:text-gray-300"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 bg-gray-100 p-6">
        {children}
      </main>
    </div>
  );
}
