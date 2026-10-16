"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usersService } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";
import {
  User as UserIcon,
  Upload,
  KeyRound,
  LogOut,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function Account() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout, updateUser } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [del, setDel] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    } else if (user) {
      setUsername(user.username);
      setEmail(user.email || "");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    try {
      const d = await usersService.updateProfile(user.id, { username, email });
      updateUser(d);
      toast.success("Profile updated successfully!");
    } catch (e: unknown) {
      if (e && typeof e === "object" && "status" in e && e.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      toast.error(
        e instanceof Error ? e.message : "Failed to update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function upload() {
    if (!user || !file) return;
    setUploadLoading(true);
    try {
      const d = await usersService.uploadProfilePicture(user.id, file);
      updateUser(d);
      setFile(null);
      setPreview("");
      toast.success("Profile picture updated successfully!");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to upload picture."
      );
    } finally {
      setUploadLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      await usersService.changePassword({
        current_password: current,
        new_password: newPass,
      });
      setCurrent("");
      setNewPass("");
      setConfirm("");
      toast.success("Password changed successfully!");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function deleteAccount() {
    if (!user) return;
    setDeleteLoading(true);
    try {
      await usersService.deleteAccount(user.id);
      logout();
      toast.success("Account deleted successfully.");
      router.replace("/");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to delete account."
      );
      setDel(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (authLoading || !user) {
    return <div className="loading">Loading account...</div>;
  }
  return (
    <>
      <title>Account Settings | FastAPI Blog</title>
      <div className="content-section account-section">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Account Settings</h2>

        <div className="profile-head flex items-center gap-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-border">
          <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            {!imageError ? (
              <Image
                className="object-cover"
                src={user.image_path || "/default.jpg"}
                alt="Profile picture"
                fill
                sizes="96px"
                onError={() => setImageError(true)}
                unoptimized={user.image_path?.startsWith("http://127.0.0.1") || user.image_path?.startsWith("http://localhost")}
              />
            ) : (
              <UserIcon size={48} className="text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold m-0">{user.username}</h3>
            <p className="text-sm text-muted-foreground m-0 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="section-block mt-8">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <UserIcon size={18} />
            <span>Update Profile</span>
          </h3>
          <form onSubmit={updateProfile}>
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={50}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn primary inline-flex items-center gap-2" disabled={profileLoading}>
              {profileLoading && <Loader2 size={16} className="animate-spin" />}
              <span>{profileLoading ? "Updating..." : "Update Profile"}</span>
            </button>
          </form>
        </div>

        <hr />

        <div className="section-block">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Upload size={18} />
            <span>Profile Picture</span>
          </h3>
          {preview && (
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-primary">
              <Image
                className="object-cover"
                src={preview}
                alt="Image preview"
                fill
                sizes="128px"
                unoptimized
              />
            </div>
          )}
          <div className="upload-row flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) {
                  const url = URL.createObjectURL(f);
                  setPreview(url);
                } else setPreview("");
              }}
            />
            <button
              className="btn primary inline-flex items-center gap-2"
              onClick={upload}
              disabled={!file || uploadLoading}
            >
              {uploadLoading && <Loader2 size={16} className="animate-spin" />}
              <span>{uploadLoading ? "Uploading..." : "Upload"}</span>
            </button>
          </div>
          <small className="text-muted-foreground text-xs mt-1 block">
            Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP.
          </small>
        </div>

        <hr />
        <div className="section-block">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <KeyRound size={18} />
            <span>Change Password</span>
          </h3>
          <form onSubmit={changePassword}>
            <label>
              Current Password
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                minLength={8}
                required
              />
              <small className="text-muted-foreground text-xs mt-0.5 block">
                Password must be at least 8 characters.
              </small>
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <button type="submit" className="btn primary inline-flex items-center gap-2" disabled={passwordLoading}>
              {passwordLoading && <Loader2 size={16} className="animate-spin" />}
              <span>{passwordLoading ? "Saving..." : "Change Password"}</span>
            </button>
          </form>
        </div>

        <hr />

        <div className="section-block">
          <button
            className="btn secondary inline-flex items-center gap-2"
            onClick={() => {
              logout();
              router.replace("/");
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        <hr />

        <div className="section-block">
          <h3 className="danger-text flex items-center gap-2 mb-2 font-bold">
            <Trash2 size={18} />
            <span>Danger Zone</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. All your posts
            will also be permanently deleted.
          </p>
          <button className="btn outline-danger inline-flex items-center gap-2 text-sm" onClick={() => setDel(true)}>
            <Trash2 size={15} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {del && (
        <Modal title="Delete Account?" danger onClose={() => setDel(false)}>
          <div className="modal-body">
            <p className="modal-message">
              Are you sure you want to delete your account? This action cannot
              be undone. All your posts will be permanently deleted.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={() => setDel(false)}>
              Cancel
            </button>
            <button
              className="btn danger inline-flex items-center gap-1.5"
              onClick={deleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 size={15} className="animate-spin" />}
              <span>{deleteLoading ? "Deleting..." : "Delete Account"}</span>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
