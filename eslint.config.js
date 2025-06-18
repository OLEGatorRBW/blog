@'
import eslint from "eslint";

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "*.min.js",
      ".idea/",
      ".vscode/",
      "*.log"
    ]
  },
  {
    files: ["src/js/**/*.js"],
    rules: {
      "semi": ["warn", "always"],
      "no-unused-vars": "warn"
    }
  }
];
'@ | Out-File -FilePath eslint.config.js -Encoding utf8