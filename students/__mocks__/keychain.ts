type Credentials = { username: string; token: string };
let stored: Credentials | undefined;

export const getCredentials = jest.fn(async () => stored);
export const setCredentials = jest.fn(async (c: Credentials) => {
  stored = c;
});
export const resetCredentials = jest.fn(async () => {
  stored = undefined;
});

export const __seedCredentials = (c: Credentials) => {
  stored = c;
};
export const __resetKeychain = () => {
  stored = undefined;
};
