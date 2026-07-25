"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useId, useState } from "react";

const FIELD_CLASS =
  "peer w-full rounded-lg border border-sand bg-white px-3 pt-5 pb-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-forest";

const LABEL_BASE = "pointer-events-none absolute left-3 transition-all duration-150";
const LABEL_FLOATED = "top-2 text-[11px] text-ink/60 peer-focus:text-forest";
// Tailwind needs each utility individually prefixed — can't interpolate a
// multi-class string after "peer-placeholder-shown:" and expect it to apply
// to every token, so the empty-state classes are spelled out per variant.
const LABEL_SHOWN_PEER =
  "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ink/40";
const LABEL_SHOWN_JS = "top-1/2 -translate-y-1/2 text-sm text-ink/40";

type FloatingInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string;
  wrapperClassName?: string;
};

export function FloatingInput({ label, className = "", wrapperClassName = "", id, ...props }: FloatingInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={`relative ${wrapperClassName}`}>
      <input {...props} id={inputId} placeholder=" " className={`${FIELD_CLASS} ${className}`} />
      <label htmlFor={inputId} className={`${LABEL_BASE} ${LABEL_FLOATED} ${LABEL_SHOWN_PEER}`}>
        {label}
      </label>
    </div>
  );
}

type FloatingTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder"> & {
  label: string;
  wrapperClassName?: string;
};

export function FloatingTextarea({ label, className = "", wrapperClassName = "", id, ...props }: FloatingTextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={`relative ${wrapperClassName}`}>
      <textarea {...props} id={inputId} placeholder=" " className={`${FIELD_CLASS} ${className}`} />
      <label htmlFor={inputId} className={`${LABEL_BASE} ${LABEL_FLOATED} ${LABEL_SHOWN_PEER}`}>
        {label}
      </label>
    </div>
  );
}

type FloatingSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  wrapperClassName?: string;
};

// Native <select> always renders its current option's text, so it can't rely on
// :placeholder-shown like input/textarea — the "floated" state is derived from
// value/focus in JS instead. Callers must give the empty/placeholder <option>
// blank text (not the label) so it doesn't double up with the floating label.
export function FloatingSelect({ label, className = "", wrapperClassName = "", id, value, onFocus, onBlur, children, ...props }: FloatingSelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== "";
  const floated = focused || hasValue;

  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        aria-label={label}
        {...props}
        id={inputId}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`${FIELD_CLASS} ${className}`}
      >
        {children}
      </select>
      <label
        htmlFor={inputId}
        className={`${LABEL_BASE} ${floated ? LABEL_FLOATED : LABEL_SHOWN_JS}`}
      >
        {label}
      </label>
    </div>
  );
}
