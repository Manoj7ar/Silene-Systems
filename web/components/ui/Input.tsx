import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-xl border border-primary/20 bg-background px-4 py-3 text-foreground transition-[border-color,box-shadow] duration-[var(--duration-short)] focus:border-primary/50 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-0";

export function inputClassName(extra = "") {
  return `${fieldClass} min-h-[48px] ${extra}`;
}

export function textareaClassName(extra = "") {
  return `${fieldClass} min-h-[120px] resize-y leading-relaxed ${extra}`;
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { className?: string }
) {
  const { className = "", ...rest } = props;
  return <input className={inputClassName(className)} {...rest} />;
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
) {
  const { className = "", ...rest } = props;
  return <textarea className={textareaClassName(className)} {...rest} />;
}
