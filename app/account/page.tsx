"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { getCurrentUser, invalidateUser, logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Modal, AlertModal } from "@/components/Modal";
export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null),
    [username, setUsername] = useState(""),
    [email, setEmail] = useState(""),
    [current, setCurrent] = useState(""),
    [newPass, setNewPass] = useState(""),
    [confirm, setConfirm] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [alert, setAlert] = useState<{
      kind: "success" | "error";
      message: string;
    } | null>(null),
    [del, setDel] = useState(false),
    [profileLoading, setProfileLoading] = useState(false),
    [uploadLoading, setUploadLoading] = useState(false),
    [passwordLoading, setPasswordLoading] = useState(false),
    [deleteLoading, setDeleteLoading] = useState(false);
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) router.replace("/login");
      else {
        setUser(u);
        setUsername(u.username);
        setEmail(u.email || "");
      }
    });
  }, [router]);
  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    try {
      const r = await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      const d = await r.json();
      invalidateUser();
      setUser(d);
      setAlert({ kind: "success", message: "Profile updated successfully!" });
    } catch (e: any) {
      setAlert({ kind: "error", message: e.message });
    } finally {
      setProfileLoading(false);
    }
  }
  async function upload() {
    if (!user || !file) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await apiFetch(`/api/users/${user.id}/picture`, {
        method: "PATCH",
        body: fd,
      });
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      const d = await r.json();
      invalidateUser();
      setUser(d);
      setFile(null);
      setPreview("");
      setAlert({
        kind: "success",
        message: "Profile picture updated successfully!",
      });
    } catch (e: any) {
      setAlert({ kind: "error", message: e.message });
    } finally {
      setUploadLoading(false);
    }
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) {
      setAlert({ kind: "error", message: "New passwords do not match." });
      return;
    }
    setPasswordLoading(true);
    try {
      const r = await apiFetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: current,
          new_password: newPass,
        }),
      });
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setAlert({ kind: "success", message: "Password changed successfully!" });
    } catch (e: any) {
      setAlert({ kind: "error", message: e.message });
    } finally {
      setPasswordLoading(false);
    }
  }
  async function deleteAccount() {
    if (!user) return;
    setDeleteLoading(true);
    try {
      const r = await apiFetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      logout();
      router.replace("/");
    } catch (e: any) {
      setAlert({ kind: "error", message: e.message });
      setDel(false);
    } finally {
      setDeleteLoading(false);
    }
  }
  if (!user) return <div className="loading">Loading account...</div>;
  return (
    <>
      <div className="content-section account-section">
        <h2>Account Settings</h2>
        <div className="profile-head">
          <img
            className="account-img"
            src={user.image_path}
            alt="Profile picture"
            width={125}
            height={125}
          />
          <div>
            <h3>{user.username}</h3>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="section-block">
          <h3>Update Profile</h3>
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
            <button className="btn primary" disabled={profileLoading}>
              Update Profile
            </button>
          </form>
        </div>
        <hr />
        <div className="section-block">
          <h3>Profile Picture</h3>
          {preview && (
            <img
              className="preview-img"
              src={preview}
              alt="Image preview"
              width={150}
              height={150}
            />
          )}
          <div className="upload-row">
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
              className="btn primary"
              onClick={upload}
              disabled={!file || uploadLoading}
            >
              {uploadLoading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <small>
            Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP.
          </small>
        </div>
        <hr />
        <div className="section-block">
          <h3>Change Password</h3>
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
              <small>Password must be at least 8 characters.</small>
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
            <button className="btn primary" disabled={passwordLoading}>
              Change Password
            </button>
          </form>
        </div>
        <hr />
        <div className="section-block">
          <button
            className="btn light"
            onClick={() => {
              logout();
              router.replace("/");
            }}
          >
            Logout
          </button>
        </div>
        <hr />
        <div className="section-block">
          <h3 className="danger-text">Danger Zone</h3>
          <p>
            Once you delete your account, there is no going back. All your posts
            will also be deleted.
          </p>
          <button className="btn outline-danger" onClick={() => setDel(true)}>
            Delete Account
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
              className="btn danger"
              onClick={deleteAccount}
              disabled={deleteLoading}
            >
              Delete Account
            </button>
          </div>
        </Modal>
      )}
      {alert && (
        <AlertModal
          kind={alert.kind}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </>
  );
}
