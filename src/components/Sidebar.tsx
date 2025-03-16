// noinspection ExceptionCaughtLocallyJS

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Library,
  LogOut,
  RefreshCcw,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthStatusProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({
  isCollapsed: externalCollapsed,
  setIsCollapsed: setExternalCollapsed,
}: SidebarProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, userRole, userId } = useAuth();

  const [directAvatarUrl, setDirectAvatarUrl] = useState<string | null>(null);
  const [hasAvatarError, setHasAvatarError] = useState(false);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = setExternalCollapsed || setInternalCollapsed;

  const [sidebarMode] = useState("dynamic");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    } else {
      if (sidebarMode === "alwaysCollapsed") {
        setCollapsed(true);
      } else if (sidebarMode === "alwaysExpanded") {
        setCollapsed(false);
      }
    }
  }, [isMobile, sidebarMode, setCollapsed]);

  useEffect(() => {
    if (userId) {
      fetchUserAvatar(userId);
    }

    return () => {
      if (directAvatarUrl && directAvatarUrl.startsWith("blob:")) {
        URL.revokeObjectURL(directAvatarUrl);
      }
    };
  }, [directAvatarUrl, userId]);

  const fetchUserAvatar = async (uid: string) => {
    try {
      const { data, error } = await supabase.storage.from("avatars").list("", {
        limit: 100,
        search: `avatar_${uid}`,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const sortedFiles = data.sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        const latestAvatar = sortedFiles[0];

        try {
          const { data: fileData, error: downloadError } =
            await supabase.storage.from("avatars").download(latestAvatar.name);

          if (downloadError) {
            console.error("Sidebar download error:", downloadError);
          } else if (fileData) {
            const objectUrl = URL.createObjectURL(fileData);
            setDirectAvatarUrl(objectUrl);
            setHasAvatarError(false);
            return;
          }
        } catch (downloadErr) {
          console.error("Error downloading file in sidebar:", downloadErr);
        }

        try {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(latestAvatar.name);

          if (urlData) {
            setDirectAvatarUrl(urlData.publicUrl);
            setHasAvatarError(false);
          }
        } catch (urlErr) {
          console.error("Error getting public URL in sidebar:", urlErr);
          setDirectAvatarUrl(null);
        }
      } else {
        setDirectAvatarUrl(null);
      }
    } catch (err) {
      console.error("Error in sidebar fetchUserAvatar:", err);
      setDirectAvatarUrl(null);
    }
  };

  const toggleSidebar = () => {
    if (sidebarMode === "dynamic") {
      setCollapsed(!collapsed);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (!user?.user_metadata?.full_name) return "U";
    return user.user_metadata.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getNavItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },

      {
        title: "Catalog",
        icon: Library,
        path: "/catalog",
      },
      {
        title: "Manage Books",
        icon: Boxes,
        path: "/books",
      },
      {
        title: "Manage Members",
        icon: Users,
        path: "/members",
      },
      {
        title: "Transactions",
        icon: ArrowLeftRight,
        path: "/transactions",
      },
    ];

    const libraryItems = [
      {
        title: "Book Circulation",
        icon: RefreshCcw,
        path: "/book-circulation",
      },
    ];

    const bookstoreItems = [];

    if (userRole === "Library") {
      return [...commonItems, ...libraryItems];
    } else if (userRole === "Book Store") {
      return [...commonItems, ...bookstoreItems];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        ref={sidebarRef}
        className={cn(
          "flex h-screen flex-col bg-background border-r transition-all duration-300 ease-in-out z-10",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex items-center h-16 px-3 py-5">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full py-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="lexicon-logo"
                  className="h-10 w-10 ml-2"
                />
                <h1 className="text-xl font-bold">Lexicon</h1>
              </Link>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-10 w-10 hidden md:flex"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Collapse Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full py-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/dashboard">
                    <img
                      src="/logo.png"
                      alt="collapsed-lexicon-logo "
                      className="h-10 w-10 text-primary"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Lexicon</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <hr className="my-2 mx-3" />

        <nav className="flex-1 overflow-y-auto py-5 px-3">
          <ul className="space-y-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return collapsed ? (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <li>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center justify-center h-10 w-10 rounded-md",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </Link>
                    </li>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <li key={item.title}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center h-10 px-3 rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <hr className="my-2 mx-3" />

        {collapsed && (
          <div className="flex justify-center mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8 hidden md:flex"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div
          className={cn("mt-auto py-4 px-3 space-y-4", collapsed ? "" : "pb-6")}
        >
          {user && (
            <div className="flex flex-col space-y-4">
              {collapsed ? (
                <div className="flex flex-col items-center space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center bg-primary text-primary-foreground cursor-pointer hover:opacity-80">
                        {directAvatarUrl && !hasAvatarError ? (
                          <img
                            src={directAvatarUrl}
                            alt="User avatar"
                            className="h-full w-full object-cover"
                            onError={() => setHasAvatarError(true)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-xs font-medium">
                            {getInitials()}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userRole}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/settings"
                        className={cn(
                          "flex items-center justify-center h-10 w-10 rounded-md",
                          location.pathname === "/settings"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Log Out</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col px-3 py-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-primary text-primary-foreground mr-3">
                        {directAvatarUrl && !hasAvatarError ? (
                          <img
                            src={directAvatarUrl}
                            alt="User avatar"
                            className="h-full w-full object-cover"
                            onError={() => setHasAvatarError(true)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-xs font-medium">
                            {getInitials()}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">
                          {user.user_metadata?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/settings"
                    className={cn(
                      "flex items-center h-10 px-3 rounded-md transition-colors",
                      location.pathname === "/settings"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    <span>Settings</span>
                  </Link>

                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Log Out</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
