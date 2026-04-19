#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AI Image Generator - Setup Script\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📄 Creating .env file from template...');
  fs.copyFileSync('.env.example', '.env');
  console.log('✅ .env created. Please edit it with your settings.\n');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Check if Docker is running
try {
  execSync('docker ps', { stdio: 'ignore' });
  console.log('🐳 Docker detected. Starting database services...');
  
  try {
    execSync('docker-compose up -d postgres redis', { stdio: 'inherit' });
    console.log('✅ Database services started\n');
    
    // Wait for databases to be ready
    console.log('⏳ Waiting for databases to be ready...');
    setTimeout(() => {
      console.log('🔄 Running Prisma setup...\n');
      
      try {
        // Generate Prisma client
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma client generated\n');
        
        // Run migrations
        console.log('🗄️  Running database migrations...');
        execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
        console.log('✅ Database migrations complete\n');
        
        console.log('🎉 Setup complete!\n');
        console.log('Start the development server with:');
        console.log('  npm run dev\n');
        console.log('Available URLs:');
        console.log('  - Frontend: http://localhost:3000');
        console.log('  - Backend:  http://localhost:5000');
        console.log('  - Bull Board: http://localhost:5000/admin/queues');
        
      } catch (error) {
        console.error('\n❌ Prisma setup failed. Make sure your DATABASE_URL in .env is correct.');
        console.log('\nTo try again, run:');
        console.log('  npx prisma migrate dev');
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to start Docker services');
    console.log('\nMake sure Docker is running and try again:');
    console.log('  docker-compose up -d postgres redis');
  }
  
} catch (error) {
  console.log('⚠️  Docker not detected. Make sure you have PostgreSQL and Redis running locally.\n');
  console.log('Update DATABASE_URL and REDIS_URL in .env, then run:');
  console.log('  npx prisma migrate dev');
  console.log('  npm run dev\n');
}
