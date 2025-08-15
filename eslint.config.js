// eslint.config.js - Modern flat config format
import js from '@eslint/js';

export default [
  // Apply to all JS files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Image: 'readonly',
        requestAnimationFrame: 'readonly',

        // Storage APIs
        localStorage: 'readonly',
        sessionStorage: 'readonly',

        // More Web APIs
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        XMLHttpRequest: 'readonly',
        WebSocket: 'readonly',

        // Event-related
        Event: 'readonly',
        CustomEvent: 'readonly',
        EventTarget: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',

        // Performance/Animation
        performance: 'readonly',
        cancelAnimationFrame: 'readonly',

        // Audio/Media
        Audio: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLVideoElement: 'readonly',

        // Saving/Loading
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        CompressionStream: 'readonly',
        DecompressionStream: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',

        // Node globals (for build scripts if needed)
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',

        // Game-specific globals (if you have any)
        gameState: 'writable',
      },
    },
    rules: {
      // Start with recommended rules
      ...js.configs.recommended.rules,

      // Spacing rules that Prettier doesn't handle
      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: false,
        },
      ],

      // Require newlines in specific places
      'padding-line-between-statements': [
        'error',
        // Require newline after imports
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },

        // Require newline before exports
        { blankLine: 'always', prev: '*', next: 'export' },

        // Require newline after variable declarations
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },

        // Require newline before return statements
        { blankLine: 'always', prev: '*', next: 'return' },

        // Require newline after blocks
        { blankLine: 'always', prev: 'block-like', next: '*' },

        // Require newline before function declarations
        { blankLine: 'always', prev: '*', next: 'function' },

        // Require newline before class declarations
        { blankLine: 'always', prev: '*', next: 'class' },
      ],

      // Other useful rules
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off', // Allow console.log in game development
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',

      // Function spacing
      'func-style': 'off',
      'space-before-function-paren': 'off', // Let Prettier handle this

      // Allow empty catch blocks (sometimes needed in games)
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Ignore certain files/directories
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'assets/**',
      '**/*.test.js',
      '**/*.spec.js',
      '**/*.json',
    ],
  },

  // Special rules for JSON files (if you want to lint them)
  {
    files: ['**/*.json'],
    rules: {
      // JSON files don't need most JS rules
      'no-unused-expressions': 'off',
    },
  },

  // Special rules for config files
  {
    files: ['eslint.config.js', 'prettier.config.js', '*.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        exports: 'writable',
        require: 'readonly',
      },
    },
  },
];
