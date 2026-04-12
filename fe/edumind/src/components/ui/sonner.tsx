"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "rgb(31, 41, 55)",
          "--normal-border": "rgb(229, 231, 235)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
