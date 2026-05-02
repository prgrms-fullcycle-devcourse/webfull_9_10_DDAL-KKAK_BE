import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import configPrettier from 'eslint-config-prettier';
import importPluginX from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**', // 빌드 결과물
      'node_modules/**', // 의존성 라이브러리
      'src/generated/**', // Prisma Client 자동 생성 모듈
      'prisma/migrations/**', // 프리즈마 마이그레이션 파일 (자동 생성됨)
      'package-lock.json', // 패키지 잠금 파일
      '.env*', // 환경 변수 파일
    ],
  },
  {
    files: ['*.config.js', '*.config.ts'],
    languageOptions: {
      parser: tsParser,

      parserOptions: {
        project: null,
      },
    },
    rules: {
      'multiline-comment-style': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        // ecmaVersion: 'latest',
        // sourceType: 'module',
        project: './tsconfig.json', // src는 타입 정보를 사용함
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      'import-x': importPluginX,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...configPrettier.rules,
      'no-console': 'off',

      // 1. 들여쓰기
      'prettier/prettier': 'error',
      indent: ['error', 2],
      'no-mixed-spaces-and-tabs': 'error',

      // 2. 문자의 종료 세미콜론
      semi: ['error', 'always'],
      'max-statements-per-line': ['error', { max: 1 }],

      // 3. 명명은 카멜 케이스
      camelcase: 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        // 3-1. 기본 규칙: 모든 이름은 카멜 케이스(camelCase)를 사용함
        // 범용 약어(URL, HTML 등)를 위해 대문자 연속 허용
        {
          selector: 'default',
          format: ['camelCase'],
          filter: { regex: '^_', match: false }, // 인자(parameter) 중 사용하지 않는 것은 언더바 허용
          leadingUnderscore: 'forbid', // _로 시작하는 것 금지
        },

        // 3-2. 변수 및 함수: 카멜 케이스 사용
        {
          selector: ['variable', 'function'],
          format: ['camelCase'],
        },

        // 3-3. 상수: 영문 대문자 스네이크 케이스(UPPER_CASE) 사용
        {
          selector: 'variable',
          modifiers: ['const', 'global'],
          format: ['UPPER_CASE', 'camelCase'], // 전역 상수는 대문자, 일반 const는 카멜 허용
        },

        // 3-4. 생성자(클래스), 인터페이스, 타입: 대문자 카멜 케이스(PascalCase) 사용
        {
          selector: ['class', 'interface', 'typeAlias', 'enum'],
          format: ['PascalCase'],
        },

        // 3-5. 객체 리터럴 속성: 카멜 케이스 기본, 하지만 상수는 대문자 허용
        {
          selector: 'objectLiteralProperty',
          format: ['camelCase', 'UPPER_CASE'],
        },
      ],

      // 3-6. 예약어 사용 금지: 변수 섀도잉 (13-1에서 관리)

      // 4. 전역 변수 사용 제한
      'no-implicit-globals': 'error',
      'no-undef': 'error',

      // 5. 선언과 할당
      // 5-1. 변수
      'no-var': 'error', // var 금지
      'prefer-const': 'error', // 값이 변하지 않으면 const 강제
      'no-self-assign': 'error', // 자기 참조 할당 금지
      // 사용 시점에 선언 (TS 규칙 사용)
      '@typescript-eslint/no-use-before-define': [
        'error',
        { variables: true, functions: false },
      ],

      // 5-2. 배열 객체
      'no-array-constructor': 'error', // 배열 리터럴 사용
      'no-new-object': 'error', // 객체 리터럴 사용
      'prefer-spread': 'error', // 배열 복사 시 순환문 대신 스프레드 문법 권장
      'object-shorthand': ['error', 'always'], // 객체 메서드 축약 표기 사용
      // 메서드 사이 개행

      // 5-3. 구조 분해 (Destructuring)
      'prefer-destructuring': [
        'error',
        { object: true, array: false },
        {
          enforceForRenamedProperties: false,
        },
      ],

      // 5-4. 템플릿 문자열
      'prefer-template': 'error',

      // 5-5. 모듈 관리 (Import 순서, 공백)
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
          'newlines-between': 'always', // 외부/내부 모듈 사이 공백 강제
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // 6. 클래스와 생성자
      // 6-1. 프로토타입 직접 조작 금지: 객체 생성 및 상속 시 class와 extends를 사용하도록 유도
      'no-proto': 'error',

      // 6-2. 상속 시 super() 호출 강제: extends로 상속받은 자식 클래스의 생성자에서는 반드시 super()를 호출해야 함
      'constructor-super': 'error',

      // 6-3. super() 호출 전 this 사용 금지: 생성자 내에서 super()가 호출되기 전에 this를 참조하면 발생하는 런타임 에러 방지
      'no-this-before-super': 'error',

      // 6-4. 중복 클래스 멤버 금지: 클래스 내에 동일한 이름의 메서드나 프로퍼티가 정의되는 것을 방지
      'no-dupe-class-members': 'error',

      // 6-5. 불필요한 생성자 금지: 아무 작업도 하지 않고 super()만 호출하는 생성자는 생략하도록 권장
      'no-useless-constructor': 'error',

      // 7. 모듈
      // 7-1. 모듈 구문 강제 (TS 기본 문법)

      // 7-2. wildcard import (*) 금지: 명시적으로 필요한 것만 import 하여 의존성을 명확히 함
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ImportDeclaration[specifiers.0.type='ImportNamespaceSpecifier']",
          message: 'Wildcard import (import * as ...)는 금지됩니다.',
        },
      ],

      // 7-3. import문으로부터 직접 export 금지: import와 export를 분리하여 가독성 확보
      // (예: export { x } from 'y' 금지 -> import { x } from 'y'; export { x }; 권장)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration[source]',
          message:
            '다른 모듈에서 가져온 요소를 직접 export 할 수 없습니다. import 후 별도로 export 하세요.',
        },
        {
          selector: 'ExportAllDeclaration',
          message: "export * from '...' (Wildcard Export)는 금지됩니다.",
        },
      ],

      // 8. 블록 구문
      // 8-1. 중괄호({}) 생략 금지: 한 줄이라도 반드시 중괄호를 사용하고 줄 바꿈함
      curly: ['error', 'all'],

      // 8-2. 키워드 전후 빈칸 사용: if, while, switch 등 키워드와 괄호 사이 공백 강제
      'keyword-spacing': ['error', { before: true, after: true }],

      // 8-3. switch-case 규칙
      'no-fallthrough': 'error', // break/return/throw 없는 case 금지 (단, 빈 case는 허용)
      'default-case': 'off', // default문 강제 대신 주석 처리를 위해 off
      // default문이 없을 때 // no default 주석을 강제하는 규칙
      'default-case-last': 'error',

      // 8-4. case문 이전 개행 (첫 번째 case 제외)

      // 8-5. do-while문 세미콜론 강제 (기본 semi 규칙에서 처리됨)
      semi: ['error', 'always'],

      // 9. 데이터형 확인
      // 9-1. typeof 비교 시 유효한 문자열과 비교하는지 검사
      // (예: typeof x === 'strnig' 오타 방지)
      'valid-typeof': 'error',

      // 9-2. 타입 비교 시 일치 연산자(===) 사용 강제
      eqeqeq: ['error', 'always'],

      // 9-3. 배열 확인 시 Array.isArray() 사용 권장
      // (TS 환경에서는 기본 제공 기능과 함께 더 강력하게 작동)

      // 10. 조건 확인
      // 10-1. 불필요한 불리언 리터럴 비교 금지
      'no-unneeded-ternary': 'error', // 불필요한 삼항 연산자 금지

      // 10-2. 타입스크립트의 엄격한 불리언 체크 (TS 전용)
      // 조건문 안에 불리언이 아닌 값이 들어가는 것을 방지합니다.
      '@typescript-eslint/strict-boolean-expressions': 'warn',

      // 11. 데이터 반환
      // 11-1. Early Return 이후 불필요한 else 블록 금지
      // (if문에서 return했다면 다음 로직은 else 없이 바로 작성)
      'no-else-return': ['error', { allowElseIf: false }],

      // 11-2. return 문 직전 빈 줄 강제

      // 12. 데이터 순회
      // 12-1. for-in문 사용 시 반드시 if문으로 prototype 체크 강제
      'guard-for-in': 'error',

      // 12-2. 더 안전한 hasOwnProperty 사용 권장
      // (Object.hasOwn() 등 최신 문법 사용 유도)
      'no-prototype-builtins': 'error',

      // 13. 콜백 함수의 스코프
      // 13-1. 외부 스코프 변수와 이름이 겹치는 지역 변수 선언 금지 (Shadowing 방지)
      // 이는 클로저 사용 시 어떤 변수를 참조하는지 혼란을 주는 것을 막아줍니다.
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // 13-2. 루프 내 함수 선언 금지
      'no-loop-func': 'error',

      // 13-3. 미사용 변수 경고
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', args: 'after-used' },
      ],

      // 14. 주석
      // 14-1. 주석 들여쓰기 일치
      'spaced-comment': [
        'error',
        'always',
        {
          line: { markers: ['/'], exceptions: ['-', '+'] },
          block: { markers: ['!'], exceptions: ['*'], balanced: true },
        },
      ],
      'multiline-comment-style': ['error', 'starred-block'], // 여러 줄 주석은 * 스타일 사용

      // 15. 공백 (Whitespace)
      // 15-1. 키워드, 연산자 주변 공백
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error', // 연산자(+, -, =, 등) 주변 공백

      // 15-2. 괄호 안의 공백 금지 (foo ) -> (foo)
      'space-in-parens': ['error', 'never'],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'], // 객체는 가독성을 위해 한 칸 권장

      // 15-3. 콤마 뒤 공백
      'comma-spacing': ['error', { before: false, after: true }],

      // 개행 규칙 통합 (5-2, 8-4, 11-2)
      'padding-line-between-statements': [
        'error',
        // 메서드나 함수 등 블록 형태 구문 다음에는 개행 (method 대용)
        {
          blankLine: 'always',
          prev: 'multiline-block-like',
          next: 'multiline-block-like',
        },
        { blankLine: 'always', prev: 'case', next: 'case' }, // case 사이
        { blankLine: 'always', prev: 'default', next: 'case' }, // default-case 사이
        { blankLine: 'always', prev: '*', next: 'return' }, // return 직전
        { blankLine: 'any', prev: 'directive', next: 'return' },
        { blankLine: 'any', prev: 'expression', next: 'return' },
      ],
    },
  },
];
