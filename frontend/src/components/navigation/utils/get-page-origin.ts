export const getPageOrigin = () => {
  if (import.meta.env.DEV) {
    return "https://homenet.richardhaddad.fr";
  }

  return window.location.origin;
};
