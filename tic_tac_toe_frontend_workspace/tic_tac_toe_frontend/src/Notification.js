import React from "react";

/**
 * Renders transient or error messages.
 * PUBLIC_INTERFACE
 */
function Notification({ message, type }) {
  if (!message) return null;
  return (
    <div className={`ttt-notification ${type || ""}`}>
      {message}
    </div>
  );
}

export default Notification;
