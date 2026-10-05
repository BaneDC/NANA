import { Toaster as Sonner } from "sonner";

// shadcn's Sonner, without its own look: our toasts draw themselves
// (src/components/family/Toast.jsx), so the toaster only places them, above
// everything (60).
const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group z-60"
      toastOptions={{ unstyled: true, classNames: { toast: "w-full" } }}
      {...props} />
  );
}

export { Toaster }
