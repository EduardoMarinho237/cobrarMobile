export const translateRole = (role: string, t: (key: string) => string): string => {
  const roleKey = `userRoles.${role}`;
  return t(roleKey);
};
