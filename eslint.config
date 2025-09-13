import js from "@eslint/js";
export default [
  {
    files: ["assets/js/**/*.js"],
    ignores: ["dist/**", "node_modules/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        console: "readonly",
        IntersectionObserver: "readonly",
        AbortController: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        ResizeObserver: "readonly",
        matchMedia: "readonly",
        sessionStorage: "readonly",
        scrollY: "readonly",
        getComputedStyle: "readonly",
        URL: "readonly",
        addEventListener: "readonly",
        HTMLElement: "readonly"
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-var": "error",
      "prefer-const": ["warn", { "destructuring": "all" }],
      "eqeqeq": ["warn", "smart"],
      "no-unused-vars": ["warn", { "args": "none", "ignoreRestSiblings": true }],
      "no-console": "off"
    }
  }
];
