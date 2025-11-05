import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { authService } from "../services/authService";
import { updateUser } from "../features/authSlice";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const userName =
    typeof currentUser === "object"
      ? currentUser?.username || currentUser?.userName
      : currentUser;
  const currentAvatar =
    typeof currentUser === "object" ? currentUser?.avatar : null;

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar || null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [avatarErr, setAvatarErr] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const loadProfile = async () => {
      if (!userName) return;
      try {
        const res = await authService.getProfile(userName);
        if (!ignore && res) {
          dispatch(updateUser(res));
          if (res.avatar) setAvatarPreview(res.avatar);
        }
      } catch (_) {
      }
    };
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [userName, dispatch]);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    setAvatarMsg("");
    setAvatarErr("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarErr("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSaveAvatar = async (e) => {
    e.preventDefault();
    setAvatarMsg("");
    setAvatarErr("");
    if (!userName) return setAvatarErr("No user found");
    if (!avatarPreview) return setAvatarErr("Pick an image first");

    try {
      setSavingAvatar(true);
      const res = await authService.updateProfile({
        userName,
        avatar: avatarPreview,
      });
      if (res?.user) {
        dispatch(updateUser(res.user));
      } else {
        dispatch(updateUser({ avatar: avatarPreview }));
      }
      setAvatarMsg("Profile image updated successfully!");
    } catch (err) {
      setAvatarErr(
        err?.response?.data?.message || "Failed to update profile image"
      );
    } finally {
      setSavingAvatar(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdErr("");

    if (!userName) return setPwdErr("No user found");
    if (!currentPassword || !newPassword)
      return setPwdErr("Please fill in all fields");
    if (newPassword.length < 6)
      return setPwdErr("New password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return setPwdErr("Passwords do not match");

    try {
      setPwdLoading(true);
      const res = await authService.changePassword(
        userName,
        currentPassword,
        newPassword
      );
      setPwdMsg(res?.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdErr(err?.response?.data?.message || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] pt-4 md:pt-6 px-4 bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <div className="w-full h-full bg-white/80 backdrop-blur-md shadow-xl border border-indigo-100 overflow-auto transition-all duration-300">
        {/* Header Section */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="absolute -bottom-10 left-6 w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {userName ? userName.charAt(0) : "U"}
              </div>
            )}
          </div>
        </div>

        <div className="pt-14 pb-6 px-6 space-y-8">
          {/* Username */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {userName || "User"}
            </h2>
            <p className="text-sm text-gray-500">
              Manage your profile settings and security
            </p>
          </div>

          {/* Avatar Uploader */}
          <form
            onSubmit={onSaveAvatar}
            className="bg-gray-50/70 rounded-xl p-5 border border-gray-100 space-y-3 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-indigo-700 mb-2">
              Profile Image
            </h3>
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
            />
            <div className="flex gap-3 items-center">
              <button
                type="submit"
                disabled={savingAvatar}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {savingAvatar ? "Saving..." : "Save Image"}
              </button>
              {avatarMsg && (
                <span className="text-green-600 text-sm">{avatarMsg}</span>
              )}
              {avatarErr && (
                <span className="text-red-600 text-sm">{avatarErr}</span>
              )}
            </div>
          </form>

          {/* Password Change */}
          <form
            onSubmit={onChangePassword}
            className="bg-gray-50/70 rounded-xl p-5 border border-gray-100 space-y-4 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-indigo-700">
              Change Password
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {pwdLoading ? "Updating..." : "Update Password"}
              </button>
              {pwdMsg && (
                <span className="text-green-600 text-sm">{pwdMsg}</span>
              )}
              {pwdErr && <span className="text-red-600 text-sm">{pwdErr}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
