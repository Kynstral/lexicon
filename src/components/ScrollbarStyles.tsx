import React from "react";

export const ScrollbarStyles = () => {
  return (
    <style type="text/css">
      {`
      /* Custom Scrollbar for webkit browsers */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background-color: hsl(var(--primary) / 0.4);
        border-radius: 20px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: hsl(var(--primary) / 0.6);
      }

      /* For Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: hsl(var(--primary) / 0.4) transparent;
      }

      /* Hide scrollbar when not in use for webkit */
      ::-webkit-scrollbar-thumb {
        background-color: hsl(var(--primary) / 0.4);
        transition: background-color 0.3s ease;
      }
      `}
    </style>
  );
};
