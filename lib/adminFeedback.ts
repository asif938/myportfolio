import Swal from "sweetalert2";
import type { ActionResult } from "@/lib/validations";

/**
 * Run an admin Server Action and show an error dialog if it fails.
 * Returns true when the action succeeded.
 */
export async function runAdminAction(action: () => Promise<ActionResult>): Promise<boolean> {
  let error: string;
  try {
    const result = await action();
    if (result.ok) return true;
    error = result.error;
  } catch {
    error = "Request failed. Your session may have expired; please sign in again.";
  }
  await Swal.fire({ title: "Error", text: error, icon: "error", confirmButtonColor: "#4f46e5" });
  return false;
}
