import * as React from "react"
import { cn } from "@/lib/utils"
import { OTPInput, OTPInputContext } from "input-otp"

// shadcn's one-time code as our six boxes: apart rather than joined, 44×52
// (40×48 on a phone) with 16px digits, three and three around a short dash,
// and, while the field has focus, the box the next digit goes in outlined in
// the primary. No drawn caret: the outline says where the digit goes.

function InputOTP({
  className,
  containerClassName,
  ...props
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props} />
  );
}

function InputOTPGroup({
  className,
  ...props
}) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-2", className)}
      {...props} />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-13 w-11 phone:h-12 phone:w-10 items-center justify-center rounded-lg border border-border bg-background text-base text-foreground transition-[border-color] duration-150 outline-none aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-primary data-[active=true]:aria-invalid:border-destructive",
        className
      )}
      {...props}>
      {char}
    </div>
  );
}

function InputOTPSeparator({
  ...props
}) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className="text-disabled"
      {...props}>
      -
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
