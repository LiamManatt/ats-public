import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      backgroundColor: "#dc2626",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      padding: "8px 16px",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
)
