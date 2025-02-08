
export function Button({ children, className, onClick }) {
    return (
      <button
        className={`px-4 py-2 rounded-md text-white ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  