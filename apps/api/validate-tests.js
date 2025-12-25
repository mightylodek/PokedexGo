#!/usr/bin/env node
/**
 * Test Validation Script
 * Validates that test files are properly structured without requiring Jest execution
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
  'src/user-pokemon/user-pokemon.service.spec.ts',
  'src/user-pokemon/user-pokemon.controller.spec.ts',
];

const serviceFile = 'src/user-pokemon/user-pokemon.service.ts';
const controllerFile = 'src/user-pokemon/user-pokemon.controller.ts';

console.log('=== Test File Validation ===\n');

let allPassed = true;

testFiles.forEach((testFile) => {
  const fullPath = path.join(__dirname, testFile);
  console.log(`Checking: ${testFile}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ❌ File not found\n`);
    allPassed = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const checks = [
    { name: 'Has describe blocks', test: /describe\(/g, required: true },
    { name: 'Has test/it blocks', test: /(it\(|test\()/g, required: true },
    { name: 'Has imports', test: /^import /gm, required: true },
    { name: 'Has beforeEach/setup', test: /beforeEach\(/g, required: false },
    { name: 'Has mocks', test: /jest\.fn\(\)|mock/g, required: false },
  ];
  
  let filePassed = true;
  checks.forEach(({ name, test, required }) => {
    const matches = content.match(test);
    const count = matches ? matches.length : 0;
    const status = required ? count > 0 : true;
    const icon = status ? '✓' : '✗';
    const reqText = required ? ' (required)' : ' (optional)';
    
    if (count > 0 || !required) {
      console.log(`  ${icon} ${name}: ${count} found${reqText}`);
    } else {
      console.log(`  ${icon} ${name}: MISSING${reqText}`);
      filePassed = false;
    }
  });
  
  // Check for common test patterns
  const hasAsyncTests = /async.*=>/.test(content);
  const hasExpects = /expect\(/.test(content);
  const hasMocks = /mock/.test(content);
  
  console.log(`  ${hasAsyncTests ? '✓' : '○'} Contains async tests`);
  console.log(`  ${hasExpects ? '✓' : '○'} Contains expect assertions`);
  console.log(`  ${hasMocks ? '✓' : '○'} Contains mocks`);
  
  if (filePassed) {
    console.log(`  ✅ File structure valid\n`);
  } else {
    console.log(`  ❌ File has issues\n`);
    allPassed = false;
  }
});

// Verify source files exist
console.log('=== Source File Verification ===\n');
[serviceFile, controllerFile].forEach((file) => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allPassed = false;
});

// Check test coverage
console.log('\n=== Test Coverage Analysis ===\n');
const serviceContent = fs.readFileSync(
  path.join(__dirname, serviceFile),
  'utf8'
);
const controllerContent = fs.readFileSync(
  path.join(__dirname, controllerFile),
  'utf8'
);

// Extract method names from service
const serviceMethods = serviceContent.match(
  /\s+(async\s+)?(\w+)\s*\(/g
)?.map((m) => m.trim().replace(/\s*\(.*/, '').replace('async ', '')) || [];

// Extract method names from controller
const controllerMethods = controllerContent.match(
  /(@\w+\s*\([^)]*\)\s*)?\s*(async\s+)?(\w+)\s*\(/g
)?.map((m) => {
  const clean = m.replace(/@\w+\s*\([^)]*\)\s*/g, '').trim();
  return clean.replace(/\s*\(.*/, '').replace('async ', '');
}) || [];

const testContent = fs.readFileSync(
  path.join(__dirname, testFiles[0]),
  'utf8'
);

console.log('Service Methods:');
serviceMethods.forEach((method) => {
  if (method === 'constructor' || method === 'private') return;
  const tested = testContent.includes(method) || testContent.includes(`'${method}'`);
  console.log(`  ${tested ? '✓' : '○'} ${method}`);
});

console.log('\nController Methods:');
const controllerTestContent = fs.readFileSync(
  path.join(__dirname, testFiles[1]),
  'utf8'
);
controllerMethods.forEach((method) => {
  if (method === 'constructor') return;
  const tested = controllerTestContent.includes(method);
  console.log(`  ${tested ? '✓' : '○'} ${method}`);
});

console.log('\n=== Summary ===\n');
if (allPassed) {
  console.log('✅ All test files are properly structured');
  console.log('\nTo run actual tests:');
  console.log('  1. Ensure dependencies are installed: npm install');
  console.log('  2. Start API server: npm run dev');
  console.log('  3. Run unit tests: npm test -- user-pokemon');
  console.log('  4. Run integration: ./test-user-pokemon.sh');
} else {
  console.log('❌ Some test files have issues');
  process.exit(1);
}

