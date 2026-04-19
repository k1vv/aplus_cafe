import { ShoppingCart, Truck, User, LogOut, Package, CalendarDays, Settings, UserCircle, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const { totalItems, setIsCartOpen, cartBadgeKey } = useCart();
  const { user, logout } = useAuth();

  // Check if user has admin role
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
      <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4 md:px-10">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <Link to="/book" className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Book</span>
            <span className="hidden sm:inline">Book a Table</span>
          </Link>
          <Link to="/order" className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Order</span>
          </Link>
        </div>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            APlus
          </h1>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
                <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{user.fullName?.split(' ')[0] || 'Account'}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="flex items-center gap-2 cursor-pointer">
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/security" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" />
                    Security
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
          <ThemeToggle className="text-primary-foreground hover:text-primary-foreground/70" />
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity relative"
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {totalItems > 0 && (
              <span
                key={cartBadgeKey}
                className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-[9px] sm:text-[10px] font-bold cart-badge-bounce"
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
