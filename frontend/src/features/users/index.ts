// src/features/users/index.ts
// Public API exports for the Users feature module

// Pages
export { ProfileSettingsPage } from "./pages/ProfileSettingsPage";

// Components (for advanced usage)
export { AccountSettingsCard } from "./components/AccountSettingsCard";
export { PasswordChangeForm } from "./components/PasswordChangeForm";
export { ProfileForm } from "./components/ProfileForm";
export { ProfileHeader } from "./components/ProfileHeader";
export { ProfileSkeleton } from "./components/ProfileSkeleton";

// Hooks
export { useUserProfile } from "./hooks/useUserProfile";

// Services
export {
  changePassword,
  deactivateAccount,
  fetchUserProfile,
  updateUserProfile,
} from "./services/usersApi";

// Types
export type {
  ChangePasswordPayload,
  IUserProfile,
  PasswordChangeApiResponse,
  ProfileApiResponse,
  UpdateProfilePayload,
} from "./types";

// Constants
export { FORM_FIELD_RULES, ROLE_LABELS } from "./constants";
