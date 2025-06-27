import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Function to find all API calls in frontend
function findApiCalls(dir, apiCalls = new Set()) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      findApiCalls(fullPath, apiCalls);
    } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for fetch calls to /api/
        const fetchMatches = content.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (fetchMatches) {
          fetchMatches.forEach(match => {
            const urlMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (urlMatch && urlMatch[1].startsWith('/api/')) {
              apiCalls.add(urlMatch[1]);
            }
          });
        }
        
        // Look for useSWR calls to /api/
        const swrMatches = content.match(/useSWR\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (swrMatches) {
          swrMatches.forEach(match => {
            const urlMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (urlMatch && urlMatch[1].startsWith('/api/')) {
              apiCalls.add(urlMatch[1]);
            }
          });
        }
        
        // Look for template literals with /api/
        const templateMatches = content.match(/\$\{[^}]*\}/g);
        if (templateMatches) {
          const apiTemplates = content.match(/`[^`]*\/api\/[^`]*`/g);
          if (apiTemplates) {
            apiTemplates.forEach(template => {
              // Extract the base API path
              const baseApiMatch = template.match(/\/api\/[^`${\s?]+/);
              if (baseApiMatch) {
                apiCalls.add(baseApiMatch[0]);
              }
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  return apiCalls;
}

// Function to find all API routes in backend
function findApiRoutes(dir, routes = new Set()) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.')) {
      findApiRoutes(fullPath, routes);
    } else if (file.isFile() && file.name === 'route.js') {
      // Convert file path to API route
      const relativePath = path.relative(path.join(projectRoot, 'app', 'api'), fullPath);
      const apiPath = '/' + relativePath.replace(/\\/g, '/').replace('/route.js', '').replace(/\[([^\]]+)\]/g, ':$1');
      routes.add('/api' + apiPath);
    }
  }
  
  return routes;
}

async function performFrontendBackendSyncTest() {
  console.log('🔄 FRONTEND-BACKEND SYNCHRONIZATION TEST');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Find all API calls in frontend
    console.log('\n1️⃣ FRONTEND API CALLS ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const frontendDir = path.join(projectRoot, 'components');
    const appDir = path.join(projectRoot, 'app');
    const hooksDir = path.join(projectRoot, 'hooks');
    const libDir = path.join(projectRoot, 'lib');
    
    const apiCalls = new Set();
    
    // Search in all frontend directories
    if (fs.existsSync(frontendDir)) findApiCalls(frontendDir, apiCalls);
    if (fs.existsSync(appDir)) findApiCalls(appDir, apiCalls);
    if (fs.existsSync(hooksDir)) findApiCalls(hooksDir, apiCalls);
    if (fs.existsSync(libDir)) findApiCalls(libDir, apiCalls);
    
    console.log(`Found ${apiCalls.size} unique API calls in frontend:`);
    const sortedApiCalls = Array.from(apiCalls).sort();
    sortedApiCalls.forEach(call => {
      console.log(`   📤 ${call}`);
    });

    // 2. Find all API routes in backend
    console.log('\n2️⃣ BACKEND API ROUTES ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const backendApiDir = path.join(projectRoot, 'app', 'api');
    const apiRoutes = findApiRoutes(backendApiDir);
    
    console.log(`Found ${apiRoutes.size} API routes in backend:`);
    const sortedApiRoutes = Array.from(apiRoutes).sort();
    sortedApiRoutes.forEach(route => {
      console.log(`   📥 ${route}`);
    });

    // 3. Cross-reference analysis
    console.log('\n3️⃣ SYNCHRONIZATION ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Find frontend calls without backend routes
    const unmatchedCalls = [];
    const matchedCalls = [];
    
    for (const call of apiCalls) {
      let matched = false;
      
      for (const route of apiRoutes) {
        // Check for exact match or dynamic route match
        if (call === route || 
            call.match(new RegExp(route.replace(/:[\w]+/g, '[^/]+') + '$')) ||
            route.includes('[') && call.startsWith(route.split('[')[0])) {
          matched = true;
          break;
        }
      }
      
      if (matched) {
        matchedCalls.push(call);
      } else {
        unmatchedCalls.push(call);
      }
    }

    // Find backend routes without frontend calls
    const unusedRoutes = [];
    for (const route of apiRoutes) {
      let used = false;
      
      for (const call of apiCalls) {
        if (call === route || 
            call.match(new RegExp(route.replace(/:[\w]+/g, '[^/]+') + '$')) ||
            route.includes('[') && call.startsWith(route.split('[')[0])) {
          used = true;
          break;
        }
      }
      
      if (!used) {
        unusedRoutes.push(route);
      }
    }

    console.log(`✅ Matched API calls: ${matchedCalls.length}`);
    matchedCalls.forEach(call => {
      console.log(`   ✅ ${call}`);
    });

    if (unmatchedCalls.length > 0) {
      console.log(`\n❌ Frontend calls without backend routes: ${unmatchedCalls.length}`);
      unmatchedCalls.forEach(call => {
        console.log(`   ❌ ${call}`);
      });
    }

    if (unusedRoutes.length > 0) {
      console.log(`\n⚠️ Backend routes not used by frontend: ${unusedRoutes.length}`);
      unusedRoutes.forEach(route => {
        console.log(`   ⚠️ ${route}`);
      });
    }

    // 4. Mock data detection in components
    console.log('\n4️⃣ MOCK DATA DETECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const mockDataFound = [];
    
    function findMockData(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
          findMockData(fullPath);
        } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Look for mock data patterns
            const mockPatterns = [
              /const\s+mock\w*/i,
              /let\s+mock\w*/i,
              /var\s+mock\w*/i,
              /mock\w*\s*=/i,
              /mockData/i,
              /mock_data/i,
              /sampleData/i,
              /testData/i,
              /dummyData/i,
              /fakeData/i
            ];
            
            for (const pattern of mockPatterns) {
              if (pattern.test(content)) {
                const relativePath = path.relative(projectRoot, fullPath);
                mockDataFound.push({
                  file: relativePath,
                  pattern: pattern.source
                });
                break;
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    if (fs.existsSync(frontendDir)) findMockData(frontendDir);
    if (fs.existsSync(appDir)) findMockData(appDir);

    if (mockDataFound.length > 0) {
      console.log(`❌ Found ${mockDataFound.length} files with potential mock data:`);
      mockDataFound.forEach(item => {
        console.log(`   - ${item.file} (${item.pattern})`);
      });
    } else {
      console.log('✅ No mock data patterns detected in frontend components');
    }

    // 5. Real data usage verification
    console.log('\n5️⃣ REAL DATA USAGE VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const realDataPatterns = [
      'useState',
      'useEffect',
      'useSWR',
      'fetch(',
      'await fetch',
      '.json()',
      'connectToDatabase',
      'findByIdAndUpdate',
      'find(',
      'findOne(',
      'save()',
      'create(',
      'deleteOne(',
      'deleteMany('
    ];

    let realDataUsageCount = 0;
    
    function countRealDataUsage(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
          countRealDataUsage(fullPath);
        } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            for (const pattern of realDataPatterns) {
              if (content.includes(pattern)) {
                realDataUsageCount++;
                break;
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    if (fs.existsSync(frontendDir)) countRealDataUsage(frontendDir);
    if (fs.existsSync(appDir)) countRealDataUsage(appDir);
    if (fs.existsSync(hooksDir)) countRealDataUsage(hooksDir);

    console.log(`✅ Files using real data patterns: ${realDataUsageCount}`);

    // 6. Summary and recommendations
    console.log('\n6️⃣ SUMMARY & RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const syncScore = ((matchedCalls.length / (matchedCalls.length + unmatchedCalls.length)) * 100).toFixed(1);
    
    console.log(`📊 Frontend-Backend Synchronization Score: ${syncScore}%`);
    console.log(`📊 API Coverage: ${matchedCalls.length}/${apiCalls.size} calls matched`);
    console.log(`📊 Backend Utilization: ${(apiRoutes.size - unusedRoutes.length)}/${apiRoutes.size} routes used`);
    console.log(`📊 Mock Data Cleanliness: ${mockDataFound.length === 0 ? 'CLEAN' : 'NEEDS CLEANUP'}`);
    console.log(`📊 Real Data Usage: ${realDataUsageCount} files using real data patterns`);

    if (unmatchedCalls.length === 0 && mockDataFound.length === 0) {
      console.log('\n🎉 EXCELLENT SYNCHRONIZATION!');
      console.log('✅ All frontend API calls have corresponding backend routes');
      console.log('✅ No mock data detected in frontend components');
      console.log('✅ Real data is being used throughout the application');
    } else {
      console.log('\n⚠️ AREAS FOR IMPROVEMENT:');
      if (unmatchedCalls.length > 0) {
        console.log(`   - ${unmatchedCalls.length} frontend API calls need backend routes`);
      }
      if (mockDataFound.length > 0) {
        console.log(`   - ${mockDataFound.length} files contain mock data patterns`);
      }
      if (unusedRoutes.length > 0) {
        console.log(`   - ${unusedRoutes.length} backend routes are unused (consider removal)`);
      }
    }

    console.log('\n✅ FRONTEND-BACKEND SYNC TEST COMPLETE');

  } catch (error) {
    console.error('❌ Sync test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting frontend-backend synchronization test...');
performFrontendBackendSyncTest();