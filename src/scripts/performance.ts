#!/usr/bin/env node
/* eslint-disable no-console */

const autocannon = require('autocannon');

interface AutocannonOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  connections?: number;
  duration?: number;
  body?: string;
}

interface TestConfig {
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  connections?: number;
  duration?: number;
}

// Load test configuration
const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
const token = process.env.TEST_TOKEN || '';

const tests: TestConfig[] = [
  {
    name: 'Health Check',
    url: `${baseUrl}/api/health`,
    method: 'GET',
    connections: 10,
    duration: 10,
  },
  {
    name: 'Root Endpoint',
    url: `${baseUrl}/`,
    method: 'GET',
    connections: 20,
    duration: 10,
  },
  {
    name: 'API Versions',
    url: `${baseUrl}/api/versions`,
    method: 'GET',
    connections: 10,
    duration: 10,
  },
  {
    name: 'Weather Current (Auth Required)',
    url: `${baseUrl}/api/weather/current?city=London`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    connections: 5,
    duration: 10,
  },
  {
    name: 'User Registration',
    url: `${baseUrl}/api/auth/register`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123',
    }),
    connections: 5,
    duration: 10,
  },
];

async function runTest(config: TestConfig): Promise<void> {
  console.log(`\n🚀 Running test: ${config.name}`);
  console.log(`URL: ${config.url}`);

  const options: AutocannonOptions = {
    url: config.url,
    method: config.method || 'GET',
    headers: config.headers || {},
    connections: config.connections || 10,
    duration: config.duration || 10,
    body: config.body,
  };

  try {
    const result = await autocannon(options);

    console.log(`✅ Test completed: ${config.name}`);
    console.log(`   Requests: ${result.requests.total}`);
    console.log(`   Throughput: ${result.throughput.average} req/sec`);
    console.log(`   Latency: ${result.latency.average}ms avg`);
    console.log(`   Errors: ${result.errors}`);
    console.log(
      `   Success Rate: ${(((result.requests.total - result.errors) / result.requests.total) * 100).toFixed(2)}%`
    );

    if (result.errors > 0) {
      console.log(`⚠️  ${result.errors} errors occurred during test`);
    }
  } catch (error) {
    console.error(`❌ Test failed: ${config.name}`);
    console.error(error);
  }
}

async function runAllTests(): Promise<void> {
  console.log('🔥 Starting Performance Tests');
  console.log(`Base URL: ${baseUrl}`);
  console.log(
    `Token: ${token ? 'Provided' : 'Not provided (some tests will fail)'}`
  );

  for (const test of tests) {
    await runTest(test);
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 All tests completed!');
}

async function runSingleTest(testName: string): Promise<void> {
  const test = tests.find(t =>
    t.name.toLowerCase().includes(testName.toLowerCase())
  );

  if (!test) {
    console.error(`❌ Test not found: ${testName}`);
    console.log('Available tests:');
    tests.forEach(t => console.log(`  - ${t.name}`));
    return;
  }

  await runTest(test);
}

async function runStressTest(): Promise<void> {
  console.log('\n💪 Running Stress Test');

  const stressConfig: TestConfig = {
    name: 'Stress Test - Health Check',
    url: `${baseUrl}/api/health`,
    method: 'GET',
    connections: 100,
    duration: 60,
  };

  await runTest(stressConfig);
}

// CLI Interface
const command = process.argv[2];
const testName = process.argv[3];

switch (command) {
  case 'all':
    runAllTests().catch(console.error);
    break;
  case 'test':
    if (!testName) {
      console.error('❌ Please provide a test name');
      process.exit(1);
    }
    runSingleTest(testName).catch(console.error);
    break;
  case 'stress':
    runStressTest().catch(console.error);
    break;
  default:
    console.log('🔧 Performance Testing Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npm run perf:test all              # Run all tests');
    console.log('  npm run perf:test test <name>      # Run specific test');
    console.log('  npm run perf:test stress           # Run stress test');
    console.log('');
    console.log('Environment Variables:');
    console.log(
      '  BASE_URL    - Base URL for testing (default: http://localhost:4000)'
    );
    console.log('  TEST_TOKEN  - JWT token for authenticated endpoints');
    console.log('');
    console.log('Examples:');
    console.log(
      '  BASE_URL=https://hostaway-assessment-api.onrender.com npm run perf:test all'
    );
    console.log('  TEST_TOKEN=your-jwt-token npm run perf:test test weather');
    break;
}
