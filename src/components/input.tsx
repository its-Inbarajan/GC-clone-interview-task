import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps
  extends InputHTMLAttributes<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | Element
  > {
  className: string;
  error?: string;
}

export const Inputs = forwardRef<HTMLInputElement, InputProps>(
  ({ className, name, id, error, ...props }, ref) => {
    return (
      <>
        <input className={className} name={name} id={id} {...props} ref={ref} />
        {error && (
          <span className="font-poppins leading-6 tracking-wide text-xs text-red-500 block text-start">
            {error ?? ""}
          </span>
        )}
      </>
    );
  }
);
