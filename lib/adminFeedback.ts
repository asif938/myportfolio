import Swal from "sweetalert2";
import type { ActionResult } from "@/lib/validations";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export function showSuccess(message: string) {
  void toast.fire({ icon: "success", title: message });
}

export function showError(message: string) {
  void toast.fire({ icon: "error", title: message, timer: 5000 });
}

/** Ask before deleting. Resolves true only when the user confirms. */
export async function confirmDelete(itemLabel: string): Promise<boolean> {
  const result = await Swal.fire({
    title: `Delete ${itemLabel}?`,
    text: "This cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    focusCancel: true,
  });
  return result.isConfirmed;
}

/**
 * Run an admin Server Action and show a toast with the outcome.
 * Returns true when the action succeeded.
 */
export async function runAdminAction(
  action: () => Promise<ActionResult>,
  successMessage: string,
): Promise<boolean> {
  try {
    const result = await action();
    if (result.ok) {
      showSuccess(successMessage);
      return true;
    }
    showError(result.error);
  } catch {
    showError("Request failed. Your session may have expired; please sign in again.");
  }
  return false;
}
