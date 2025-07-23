#!/usr/bin/env node

/**
 * Application Health Check Script
 * Validates environment, dependencies, and configuration
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkRequired(condition, message, fix = null) {
  if (condition) {
    log(colors.green, `✅ ${message}`);
    return true;
  } else {
    log(colors.red, `❌ ${message}`);
    if (fix) log(colors.yellow, `   Fix: ${fix}`);
    return false;
  }
}

function checkOptional(condition, message, warning = null) {
  if (condition) {
    log(colors.green, `✅ ${message}`);
  } else {
    log(colors.yellow, `⚠️  ${message}`);
    if (warning) log(colors.yellow, `   Note: ${warning}`);
  }
}

async function main() {
  log(colors.bold + colors.blue, '\n🔍 InternLink Health Check\n');
  
  let issues = 0;
  let warnings = 0;

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (!checkRequired(majorVersion >= 18, `Node.js version ${nodeVersion} (requires 18+)`, 'Update Node.js to version 18 or higher')) {
    issues++;
  }

  // Check if required files exist
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'middleware.js',
    'app/layout.js',
    'app/page.js',
    'lib/mongoose.js',
    'models/User.js',
    'app/api/auth/[...nextauth]/route.js'
  ];

  requiredFiles.forEach(file => {
    if (!checkRequired(fs.existsSync(file), `Required file: ${file}`, `Create the missing file`)) {
      issues++;
    }
  });

  // Check environment variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GITLAB_CLIENT_ID',
    'GITLAB_CLIENT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const envExists = fs.existsSync('.env') || fs.existsSync('.env.local');
  checkOptional(envExists, 'Environment file exists', 'Create .env file from .env.example');

  if (envExists) {
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent += fs.readFileSync('.env', 'utf8');
    }
    if (fs.existsSync('.env.local')) {
      envContent += fs.readFileSync('.env.local', 'utf8');
    }
    
    requiredEnvVars.forEach(envVar => {
      const regex = new RegExp(`^${envVar}=.+`, 'm');
      const exists = regex.test(envContent);
      if (!checkRequired(exists, `Environment variable: ${envVar}`, `Add ${envVar} to your .env file`)) {
        issues++;
      }
    });
  } else {
    issues += requiredEnvVars.length;
  }

  // Check package.json scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'start', 'lint'];
  
  requiredScripts.forEach(script => {
    if (!checkRequired(packageJson.scripts[script], `npm script: ${script}`, `Add "${script}" script to package.json`)) {
      issues++;
    }
  });

  // Check dependencies
  const criticalDeps = [
    'next',
    'react',
    'next-auth',
    'mongoose',
    'socket.io'
  ];

  criticalDeps.forEach(dep => {
    const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    if (!checkRequired(exists, `Dependency: ${dep}`, `Run: npm install ${dep}`)) {
      issues++;
    }
  });

  // Check for security vulnerabilities
  try {
    log(colors.blue, '\n🔒 Checking for security vulnerabilities...');
    const auditOutput = execSync('npm audit --audit-level high --json', { encoding: 'utf8', stdio: 'pipe' });
    const audit = JSON.parse(auditOutput);
    
    const highVulns = audit.metadata?.vulnerabilities?.high || 0;
    const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
    
    if (highVulns + criticalVulns === 0) {
      log(colors.green, '✅ No high or critical security vulnerabilities found');
    } else {
      log(colors.red, `❌ Found ${highVulns} high and ${criticalVulns} critical vulnerabilities`);
      log(colors.yellow, '   Fix: Run npm audit fix');
      warnings++;
    }
  } catch (error) {
    log(colors.yellow, '⚠️  Could not check security vulnerabilities');
    warnings++;
  }

  // Check database models
  const modelFiles = fs.readdirSync('models').filter(file => file.endsWith('.js'));
  checkOptional(modelFiles.length > 0, 'Database models exist', 'Ensure you have the required models');

  // Check API routes structure
  const apiExists = fs.existsSync('app/api') && fs.statSync('app/api').isDirectory();
  checkOptional(apiExists, 'API routes directory exists');

  if (apiExists) {
    const adminApiExists = fs.existsSync('app/api/admin');
    checkOptional(adminApiExists, 'Admin API routes exist');
  }

  // Check for proper error handling
  const errorBoundaryExists = fs.existsSync('components/ErrorBoundary.js');
  checkOptional(errorBoundaryExists, 'Error boundary component exists', 'Consider adding error boundaries for better UX');

  // Check for development tools
  const hasEslintConfig = fs.existsSync('.eslintrc.json') || fs.existsSync('.eslintrc.js') || packageJson.eslintConfig;
  checkOptional(hasEslintConfig, 'ESLint configuration exists');

  const hasTailwindConfig = fs.existsSync('tailwind.config.js');
  checkOptional(hasTailwindConfig, 'Tailwind CSS configuration exists');

  // Final summary
  log(colors.bold + colors.blue, '\n📊 Health Check Summary:');
  log(colors.bold, `Issues: ${issues}`);
  log(colors.bold, `Warnings: ${warnings}`);

  if (issues === 0 && warnings === 0) {
    log(colors.bold + colors.green, '\n🎉 All checks passed! Your application looks healthy.');
  } else if (issues === 0) {
    log(colors.bold + colors.yellow, '\n⚠️  Application is functional but has some warnings to address.');
  } else {
    log(colors.bold + colors.red, '\n🚨 Critical issues found! Please fix them before running the application.');
  }

  // Provide next steps
  log(colors.bold + colors.blue, '\n📋 Recommended next steps:');
  if (issues > 0) {
    log(colors.yellow, '1. Fix all critical issues listed above');
    log(colors.yellow, '2. Run this health check again');
  }
  if (warnings > 0) {
    log(colors.yellow, '3. Address security vulnerabilities with: npm audit fix');
  }
  log(colors.yellow, '4. Test the application with: npm run dev');
  log(colors.yellow, '5. Run linting with: npm run lint');
  log(colors.yellow, '6. Build for production with: npm run build');

  process.exit(issues > 0 ? 1 : 0);
}

main().catch(console.error);