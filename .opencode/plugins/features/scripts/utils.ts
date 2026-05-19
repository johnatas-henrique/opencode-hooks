const shellSpecialChars = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/g;

export const sanitizeArg = (arg: string): string => {
  return arg.replace(shellSpecialChars, '\\$&');
};
