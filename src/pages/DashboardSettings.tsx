import { useState, useEffect } from "react";
import { ArrowLeft, User, Lock, Trash2, Camera, Github, Globe, Linkedin, CreditCard, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { IntroVideoUploader } from "@/components/dashboard/IntroVideoUploader";
import { COMMON_TIMEZONES } from "@/components/profile/LocalTimeDisplay";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription, PRICING_TIERS } from "@/hooks/useSubscription";
import { isBlockedText, isBlockedUrl } from "@/lib/content-moderation";
import { authFetch } from "@/lib/auth-fetch";

const DashboardSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser({ id: user.id, email: user.email });
    };
    getUser();
  }, []);
  const { subscription, loading: subLoading, cancelSubscription, reactivateSubscription, openCustomerPortal } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [profileData, setProfileData] = useState({
    username: "",
    fullName: "",
    bio: "",
    profileImage: "",
  });

  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    instagram: "",
    youtube: "",
    github: "",
    linkedin: "",
    website: "",
  });

  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [location, setLocation] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Load profile data from Supabase
  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || "",
        fullName: profile.full_name || "",
        bio: profile.bio || "",
        profileImage: profile.avatar_url || "",
      });
      // Load social links from profile JSONB column
      const saved = profile.social_links as Record<string, string> | null;
      if (saved && typeof saved === "object") {
        setSocialLinks((prev) => ({
          ...prev,
          twitter: saved.twitter || "",
          instagram: saved.instagram || "",
          youtube: saved.youtube || "",
          github: saved.github || "",
          linkedin: saved.linkedin || "",
          website: saved.website || "",
        }));
        setIntroVideoUrl(saved.intro_video_url || "");
        setTimezone(saved.timezone || "");
        setLocation(saved.location || "");
      }
    }
  }, [profile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialLinks((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      if (!currentUser) throw new Error("Not authenticated");

      // Content moderation checks
      if (isBlockedText(profileData.bio)) {
        throw new Error("Your bio contains content that violates our community guidelines. Adult and explicit content is not allowed.");
      }
      if (isBlockedText(profileData.fullName)) {
        throw new Error("Your display name contains inappropriate content.");
      }
      // Check social links for adult URLs
      for (const [, url] of Object.entries(socialLinks)) {
        if (url && isBlockedUrl(url)) {
          throw new Error("One of your social links points to a site that violates our community guidelines. Adult content links are not allowed.");
        }
      }

      // Filter out empty social links
      const filteredSocials: Record<string, string> = {};
      for (const [key, val] of Object.entries(socialLinks)) {
        if (val.trim()) filteredSocials[key] = val.trim();
      }
      // Persist intro video URL and timezone alongside social links
      if (introVideoUrl.trim()) {
        filteredSocials.intro_video_url = introVideoUrl.trim();
      }
      if (timezone) {
        filteredSocials.timezone = timezone;
      }
      if (location.trim()) {
        filteredSocials.location = location.trim();
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: currentUser.id,
          full_name: profileData.fullName,
          username: profileData.username,
          bio: profileData.bio,
          avatar_url: profileData.profileImage,
          social_links: filteredSocials as unknown as import("@/integrations/supabase/types").Json,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      // Refetch profile data to update sidebar and other components
      await refetch();

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Validate password fields
    const errors: Record<string, string> = {};
    if (!passwordData.currentPassword) errors.currentPassword = "Current password is required";
    if (!passwordData.newPassword) errors.newPassword = "New password is required";
    else if (passwordData.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters";
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      // Verify current password by re-authenticating
      if (!currentUser?.email) throw new Error("No email found for current user");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
        return;
      }

      // Now update to the new password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Delete profile data from Supabase
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", currentUser.id);
      
      if (deleteError) {
        console.error("Error deleting profile:", deleteError);
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
        variant: "destructive",
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, profileImage: reader.result as string }));
        toast({
          title: "Image uploaded",
          description: "Your profile image has been updated.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Sidebar />
        <MobileSidebar />
        <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="h-8 bg-muted-foreground/20 rounded w-1/3 mb-6" />
              <div className="h-24 bg-muted-foreground/10 rounded mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-muted-foreground/10 rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings</p>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Settings
            </h2>

            {/* Profile Image */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary-foreground">
                      {profileData.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Profile Image</h3>
                <p className="text-sm text-muted-foreground">Click the camera icon to upload</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  sharethelink.app/{profileData.username}
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  placeholder="Tell the world about yourself..."
                />
              </div>

              {/* Social Media Handles */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Social Media Handles</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <XIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="twitter"
                      value={socialLinks.twitter}
                      onChange={handleSocialChange}
                      placeholder="Twitter / X username"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <InstagramIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="instagram"
                      value={socialLinks.instagram}
                      onChange={handleSocialChange}
                      placeholder="Instagram username"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <YouTubeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="youtube"
                      value={socialLinks.youtube}
                      onChange={handleSocialChange}
                      placeholder="YouTube channel URL"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="github"
                      value={socialLinks.github}
                      onChange={handleSocialChange}
                      placeholder="GitHub username"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="linkedin"
                      value={socialLinks.linkedin}
                      onChange={handleSocialChange}
                      placeholder="LinkedIn profile URL"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="website"
                      value={socialLinks.website}
                      onChange={handleSocialChange}
                      placeholder="Personal website URL"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-foreground mb-2">
                  Your Timezone
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Display your local time on your public profile so visitors know what timezone you are in.
                </p>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., London, UK"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Displayed on your public profile alongside your timezone.
                </p>
              </div>

              {/* Intro Video (VideoAsk-style) */}
              {currentUser && (
                <IntroVideoUploader
                  currentVideoUrl={introVideoUrl}
                  userId={currentUser.id}
                  onVideoChange={setIntroVideoUrl}
                />
              )}

              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full py-6 gradient-button text-primary-foreground hover:opacity-90"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    passwordErrors.currentPassword ? "border-destructive" : "border-border"
                  }`}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-destructive text-sm mt-1">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    passwordErrors.newPassword ? "border-destructive" : "border-border"
                  }`}
                />
                {passwordErrors.newPassword && (
                  <p className="text-destructive text-sm mt-1">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    passwordErrors.confirmPassword ? "border-destructive" : "border-border"
                  }`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-destructive text-sm mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="outline"
                className="w-full py-6"
              >
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </div>

          {/* Billing & Subscription */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Billing & Subscription
            </h2>

            {/* Current Plan Info */}
            <div className="rounded-xl border-2 border-border p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold text-foreground capitalize">
                    {subscription?.tier || "Free"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {subscription?.cancelAtPeriodEnd ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Cancels soon
                    </span>
                  ) : subscription?.subscribed ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                      Free tier
                    </span>
                  )}
                </div>
              </div>

              {subscription?.subscribed && subscription.tier !== "free" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Price: <span className="text-foreground font-medium">
                      {subscription.tier === "pro" ? "\u00A37/mo" : subscription.tier === "business" ? "\u00A323/mo" : "\u00A3100/mo"}
                    </span>
                  </p>
                  {subscription.currentPeriodEnd && (
                    <p>
                      {subscription.cancelAtPeriodEnd ? "Access until" : "Next billing date"}:{" "}
                      <span className="text-foreground font-medium">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Manage Billing (Stripe Portal) */}
              {subscription?.subscribed && subscription.tier !== "free" && (
                <Button
                  variant="outline"
                  className="w-full py-5 justify-between"
                  onClick={() => openCustomerPortal()}
                  disabled={subLoading}
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Manage Billing & Invoices
                  </span>
                  <span className="text-muted-foreground text-xs">Opens Stripe Portal</span>
                </Button>
              )}

              {/* Cancel / Reactivate */}
              {subscription?.subscribed && subscription.tier !== "free" && (
                <>
                  {subscription.cancelAtPeriodEnd ? (
                    <Button
                      variant="outline"
                      className="w-full py-5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                      onClick={async () => {
                        await reactivateSubscription();
                      }}
                      disabled={subLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {subLoading ? "Reactivating..." : "Reactivate Subscription"}
                    </Button>
                  ) : !showCancelConfirm ? (
                    <Button
                      variant="outline"
                      className="w-full py-5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  ) : (
                    <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Are you sure you want to cancel?</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your subscription will remain active until the end of your current billing period.
                            After that, you will be downgraded to the Free plan and lose access to premium features.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 py-5"
                        >
                          Keep Subscription
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            const success = await cancelSubscription();
                            if (success) setShowCancelConfirm(false);
                          }}
                          disabled={subLoading}
                          className="flex-1 py-5"
                        >
                          {subLoading ? "Cancelling..." : "Yes, Cancel"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Upgrade CTA for free users */}
              {(!subscription?.subscribed || subscription.tier === "free") && (
                <Button
                  asChild
                  className="w-full py-5 gradient-button text-primary-foreground hover:opacity-90"
                >
                  <Link to="/pricing">Upgrade Your Plan</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-2xl p-6 shadow-lg border-2 border-destructive/20">
            <h2 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-6"
              >
                Delete Account
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-destructive font-medium">
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="flex-1 py-6"
                  >
                    {isLoading ? "Deleting..." : "Yes, Delete My Account"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSettings;
