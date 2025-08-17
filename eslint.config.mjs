/* eslint-disable max-lines */
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import promisePlugin from 'eslint-plugin-promise';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
// eslint-disable-next-line import/default, import/namespace, import/no-named-as-default, import/no-named-as-default-member
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: ['bin', 'coverage', 'dist', 'node_modules', 'tmp']
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts'],
    extends: [
      js.configs.all,
      importPlugin.flatConfigs.recommended,
      promisePlugin.configs['flat/recommended'],
      sonarjsPlugin.configs.recommended,
      unicornPlugin.configs['flat/recommended'],
      eslintConfigPrettier
    ],
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 12,
      sourceType: 'module'
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true
      }
    },
    rules: {
      'arrow-parens': ['error', 'as-needed'],
      'capitalized-comments': 'off',
      'class-methods-use-this': 'off',
      'default-case': [
        'error',
        {
          commentPattern: '^exhaustive check$'
        }
      ],
      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: true
        }
      ],
      'id-length': ['error', { exceptions: ['_', 'i', 'n', 't'] }],
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc'
          },

          groups: [
            ['builtin', 'external'],
            ['internal', 'sibling', 'parent']
          ],
          'newlines-between': 'always'
        }
      ],
      'init-declarations': 'off',
      'max-params': ['error', 5],
      'max-statements': ['error', 20],
      'new-cap': [
        'error',
        {
          capIsNewExceptions: ['Ok', 'Some']
        }
      ],
      'no-continue': 'off',
      'no-duplicate-imports': 'off',
      'no-inline-comments': 'off',
      'no-loop-func': 'off',
      'no-magic-numbers': 'off',
      'no-plusplus': [
        'error',
        {
          allowForLoopAfterthoughts: true
        }
      ],
      'no-shadow': 'off',
      'no-ternary': 'off',
      'no-undefined': 'off',
      'no-use-before-define': [
        'error',
        {
          classes: false,
          functions: false
        }
      ],
      'one-var': ['error', 'never'],
      quotes: [
        'error',
        'single',
        {
          allowTemplateLiterals: false,
          avoidEscape: true
        }
      ],
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'sonarjs/no-unused-vars': 'off',
      'sort-imports': 'off',
      'sort-keys': 'off',
      'unicorn/catch-error-name': [
        'error',
        {
          name: 'err'
        }
      ],
      'unicorn/explicit-length-check': [
        'error',
        {
          'non-zero': 'not-equal'
        }
      ],
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-method-this-argument': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/throw-new-error': 'off'
    }
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...tsEslint.configs.strictTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.typescript
    ],
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 12,
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: 'module'
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public'
        }
      ],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          classes: [
            // Static fields & getters
            'static-field',
            'static-get',
            'static-set',
            'static-readonly-field',
            'public-static-field',
            'public-static-get',
            'public-static-set',
            'public-static-readonly-field',
            'protected-static-field',
            'protected-static-get',
            'protected-static-set',
            'protected-static-readonly-field',
            'private-static-field',
            'private-static-get',
            'private-static-set',
            'private-static-readonly-field',
            '#private-static-field',
            '#private-static-get',
            '#private-static-set',
            '#private-static-readonly-field',
            // Static initialization
            'static-initialization',
            // Static methods
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            '#private-static-method',
            // Index signature
            'signature',
            'readonly-signature',
            // Decorated fields
            'decorated-field',
            'decorated-get',
            'decorated-set',
            'decorated-readonly-field',
            'public-decorated-field',
            'public-decorated-get',
            'public-decorated-set',
            'public-decorated-readonly-field',
            'protected-decorated-field',
            'protected-decorated-get',
            'protected-decorated-set',
            'protected-decorated-readonly-field',
            'private-decorated-field',
            'private-decorated-get',
            'private-decorated-set',
            'private-decorated-readonly-field',
            // Fields & getters/setters
            'field',
            'instance-field',
            'abstract-field',
            'readonly-field',
            'instance-readonly-field',
            'abstract-readonly-field',
            'get',
            'set',
            'instance-get',
            'instance-set',
            'abstract-get',
            'abstract-set',
            'public-get',
            'public-set',
            'public-field',
            'public-instance-field',
            'public-abstract-field',
            'public-readonly-field',
            'public-instance-readonly-field',
            'public-abstract-readonly-field',
            'public-instance-get',
            'public-instance-set',
            'public-abstract-get',
            'public-abstract-set',
            'protected-field',
            'protected-instance-field',
            'protected-abstract-field',
            'protected-readonly-field',
            'protected-instance-readonly-field',
            'protected-abstract-readonly-field',
            'protected-get',
            'protected-set',
            'protected-instance-get',
            'protected-instance-set',
            'protected-abstract-get',
            'protected-abstract-set',
            'private-field',
            'private-instance-field',
            'private-readonly-field',
            'private-instance-readonly-field',
            'private-get',
            'private-set',
            'private-instance-get',
            'private-instance-set',
            '#private-field',
            '#private-instance-field',
            '#private-readonly-field',
            '#private-instance-readonly-field',
            '#private-get',
            '#private-set',
            '#private-instance-get',
            '#private-instance-set',
            // Constructors
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            // Methods
            'public-decorated-method',
            'protected-decorated-method',
            'private-decorated-method',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
            'public-abstract-method',
            'protected-abstract-method',
            '#private-instance-method'
          ]
        }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow'
        },
        {
          selector: 'enumMember',
          format: ['PascalCase']
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase']
        },
        {
          selector: 'typeLike',
          format: ['PascalCase']
        }
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true
        }
      ],
      '@typescript-eslint/no-invalid-this': 'error',
      '@typescript-eslint/no-invalid-void-type': [
        'error',
        {
          allowAsThisParameter: true
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          classes: false,
          functions: false
        }
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true
        }
      ],
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true
        }
      ],
      camelcase: 'off',
      'no-invalid-this': 'off',
      'no-use-before-define': 'off'
    }
  },
  {
    // Update this to match your test files
    files: ['**/*.test.ts'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals
    },
    rules: {
      ...jestPlugin.configs['flat/all'].rules,
      'jest/consistent-test-it': ['error', { fn: 'test' }],
      'jest/padding-around-all': 'off',
      'jest/padding-around-expect-groups': 'off',
      'jest/prefer-lowercase-title': ['error', { ignore: ['describe'] }],
      'max-lines': ['error', 500],
      'max-lines-per-function': ['error', 500]
    }
  }
);
