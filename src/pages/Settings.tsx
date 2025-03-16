// noinspection ExceptionCaughtLocallyJS

import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme-provider";
import { Moon, Sun, Upload, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/AuthStatusProvider";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, userRole, userId } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [directAvatarUrl, setDirectAvatarUrl] = useState<string | null>(null);

  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  const isLibrary = userRole === "Library";

  const loadSettings = useCallback(() => {
    try {
      const settingsKey = isLibrary ? "librarySettings" : "bookstoreSettings";
      const savedSettings = localStorage.getItem(settingsKey);

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setOrganizationName(parsedSettings.name || "");
        setContactEmail(parsedSettings.contactEmail || "");
        setPhoneNumber(parsedSettings.phoneNumber || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, [isLibrary]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");

      const metadata = user.user_metadata;
      if (metadata) {
        setFullName(metadata.full_name || user.email?.split("@")[0] || "User");

        if (!organizationName && metadata.full_name) {
          setOrganizationName(metadata.full_name);
        }
      } else {
        setFullName(user.email?.split("@")[0] || "User");
      }

      loadSettings();
    }

    if (userId) {
      fetchUserAvatar(userId);
    }

    return () => {
      if (directAvatarUrl && directAvatarUrl.startsWith("blob:")) {
        URL.revokeObjectURL(directAvatarUrl);
      }
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [
    avatarPreview,
    directAvatarUrl,
    loadSettings,
    organizationName,
    user,
    userId,
  ]);

  const fetchUserAvatar = async (uid: string) => {
    try {
      console.log("Fetching avatar for user:", uid);

      const { data, error } = await supabase.storage.from("avatars").list("", {
        limit: 100,
        search: `avatar_${uid}`,
      });

      if (error) {
        console.error("Error listing avatars:", error);
        throw error;
      }

      console.log("Avatar files found:", data ? data.length : 0, data);

      if (data && data.length > 0) {
        const sortedFiles = data.sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        const latestAvatar = sortedFiles[0];
        console.log("Latest avatar file:", latestAvatar);

        try {
          const { data: fileData, error: downloadError } =
            await supabase.storage.from("avatars").download(latestAvatar.name);

          if (downloadError) {
            console.error("Download error:", downloadError);
          } else if (fileData) {
            const objectUrl = URL.createObjectURL(fileData);
            console.log("Created object URL:", objectUrl);
            setDirectAvatarUrl(objectUrl);
            return;
          }
        } catch (downloadErr) {
          console.error("Error downloading file:", downloadErr);
        }

        try {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(latestAvatar.name);

          if (urlData) {
            console.log("Public URL:", urlData.publicUrl);

            const testImg = new Image();
            testImg.onload = () => {
              console.log("Image URL is valid");
              setDirectAvatarUrl(urlData.publicUrl);
            };
            testImg.onerror = () => {
              console.error("Public URL image failed to load");
              setDirectAvatarUrl(null);
            };
            testImg.src = urlData.publicUrl;
          }
        } catch (urlErr) {
          console.error("Error getting public URL:", urlErr);
          setDirectAvatarUrl(null);
        }
      } else {
        console.log("No avatar files found");
        setDirectAvatarUrl(null);
      }
    } catch (err) {
      console.error("Error in fetchUserAvatar:", err);
      setDirectAvatarUrl(null);
    }
  };

  const saveOrganizationSettings = () => {
    setIsSavingOrg(true);
    try {
      const settingsKey = isLibrary ? "librarySettings" : "bookstoreSettings";
      const settings = {
        name: organizationName,
        contactEmail,
        phoneNumber,
      };

      localStorage.setItem(settingsKey, JSON.stringify(settings));

      toast({
        title: "Settings saved",
        description: `Your ${isLibrary ? "library" : "book store"} settings have been updated successfully.`,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar image must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);

      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;

    setIsSavingProfile(true);
    try {
      if (avatarFile) {
        setIsUploading(true);

        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;

        console.log("Uploading file to path:", fileName);

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            upsert: true,
            contentType: avatarFile.type,
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          throw uploadError;
        }

        console.log("File uploaded successfully, updating user metadata");

        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            role: userRole,
          },
        });

        if (updateError) {
          console.error("Auth update error details:", updateError);
          throw updateError;
        }

        setIsUploading(false);
      } else {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            role: userRole,
          },
        });

        if (updateError) {
          console.error("Auth update error details:", updateError);
          throw updateError;
        }
      }

      setAvatarPreview(null);

      await fetchUserAvatar(userId);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description:
          "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const initials = getInitials(fullName);

  const displayAvatar = avatarPreview || directAvatarUrl;

  return (
    <div className="page-transition space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and {isLibrary ? "library" : "book store"}{" "}
          settings.
        </p>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your personal profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="relative">
              {/* Custom avatar implementation */}
              <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                {displayAvatar ? (
                  <img
                    src={
                      avatarPreview ||
                      (directAvatarUrl ? `${directAvatarUrl}` : undefined)
                    }
                    alt="User avatar"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error("Avatar image failed to load:", e);
                      if (directAvatarUrl) {
                        console.log("Failed URL:", directAvatarUrl);
                      }
                      e.currentTarget.style.display = "none";

                      if (
                        directAvatarUrl &&
                        directAvatarUrl.startsWith("blob:")
                      ) {
                        URL.revokeObjectURL(directAvatarUrl);
                        setDirectAvatarUrl(null);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-xl font-medium">
                    {initials || <User className="h-12 w-12" />}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Label
                  htmlFor="avatar-upload"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload avatar</span>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveProfile}
              disabled={isUploading || isSavingProfile}
            >
              {isUploading
                ? "Uploading..."
                : isSavingProfile
                  ? "Saving..."
                  : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLibrary ? "Library Information" : "Book Store Information"}
          </CardTitle>
          <CardDescription>
            Manage your {isLibrary ? "library" : "book store"} details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">
              {isLibrary ? "Library Name" : "Store Name"}
            </Label>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={isLibrary ? "Central Library" : "Book Haven"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveOrganizationSettings} disabled={isSavingOrg}>
              {isSavingOrg ? "Saving..." : "Save Information"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex items-center space-x-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const prefersDark = window.matchMedia(
                    "(prefers-color-scheme: dark)",
                  ).matches;
                  setTheme(prefersDark ? "dark" : "light");
                }}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
