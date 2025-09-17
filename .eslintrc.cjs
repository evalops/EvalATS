module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  settings: {
    next: {
      rootDir: ["./"],
    },
  },
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "warn",
  },
};
