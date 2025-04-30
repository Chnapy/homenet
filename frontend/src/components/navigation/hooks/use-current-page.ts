import React from "react";

export const useCurrentPage = (onChange?: (currentPage: string) => void) => {
  const [currentPage, setCurrentPage] = React.useState(
    window.location.hash.slice(1)
  );

  React.useEffect(() => {
    const listener = () => {
      const page = window.location.hash.slice(1);
      setCurrentPage(page);
      onChange?.(page);
    };
    window.addEventListener("popstate", listener);

    return () => {
      window.removeEventListener("popstate", listener);
    };
  }, [onChange]);

  return currentPage;
};
