import React from "react";

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function H1({ children, className = "" }: HeadingProps) {
  return (
    <h1
      className={`text-3xl font-bold text-gray-900 mb-6 tracking-tight ${className}`}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: HeadingProps) {
  return (
    <h2
      className={`text-2xl font-bold text-gray-900 mb-4 tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className = "" }: HeadingProps) {
  return (
    <h3
      className={`text-xl font-bold text-gray-900 mb-3 tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className = "" }: HeadingProps) {
  return (
    <h4
      className={`text-lg font-semibold text-gray-900 mb-2 tracking-tight ${className}`}
    >
      {children}
    </h4>
  );
}

type TextProps = {
  children: React.ReactNode;
  className?: string;
};

export function Text({ children, className = "" }: TextProps) {
  return (
    <p className={`text-base text-gray-800 leading-relaxed mb-4 ${className}`}>
      {children}
    </p>
  );
}

export function LargeText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-lg text-gray-800 leading-relaxed mb-4 ${className}`}>
      {children}
    </p>
  );
}

export function SmallText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-sm text-gray-700 leading-relaxed mb-3 ${className}`}>
      {children}
    </p>
  );
}

type LabelProps = {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
};

export function Label({ children, className = "", htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-base font-medium text-gray-900 mb-1 ${className}`}
    >
      {children}
    </label>
  );
}

export function ErrorText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-base text-danger-600 font-medium mb-3 ${className}`}>
      {children}
    </p>
  );
}

export function SuccessText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-base text-accent-600 font-medium mb-3 ${className}`}>
      {children}
    </p>
  );
}

export function Caption({ children, className = "" }: TextProps) {
  return (
    <p className={`text-xs text-gray-600 mb-2 ${className}`}>{children}</p>
  );
}

export function Blockquote({ children, className = "" }: TextProps) {
  return (
    <blockquote
      className={`pl-4 border-l-4 border-gray-300 text-gray-700 italic mb-4 ${className}`}
    >
      {children}
    </blockquote>
  );
}
