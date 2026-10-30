const SITE = "https://yousuf-git.github.io/relic";

export const pages = {
  privacy: `${SITE}/privacy.html`,
  terms: `${SITE}/terms.html`,
  deleteAccount: `${SITE}/delete-account.html`,
} as const;

export const queryKeys = {
  waitlist: ["waitlist"] as const,
};
