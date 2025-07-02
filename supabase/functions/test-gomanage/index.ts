import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GOMANAGE_URL = 'http://buyled.clonico.es:8181'
    const username = 'distri'
    const password = 'GOtmt%'
    
    console.log('🧪 TESTING GO!MANAGE API CONNECTION')
    console.log('================================')
    
    // Test 1: Try login
    console.log('🔐 Test 1: Authentication')
    const loginData = `j_username=${encodeURIComponent(username)}&j_password=${encodeURIComponent(password)}`
    
    const loginResponse = await fetch(`${GOMANAGE_URL}/gomanage/static/auth/j_spring_security_check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Test Bot)'
      },
      body: loginData,
      redirect: 'manual'
    })
    
    console.log(`Login Status: ${loginResponse.status}`)
    console.log(`Login Headers: ${JSON.stringify([...loginResponse.headers.entries()])}`)
    
    const setCookieHeaders = loginResponse.headers.get('set-cookie')
    console.log(`Set-Cookie: ${setCookieHeaders}`)
    
    let jsessionid = null
    if (setCookieHeaders) {
      const sessionMatch = setCookieHeaders.match(/JSESSIONID=([^;]+)/)
      if (sessionMatch) {
        jsessionid = `JSESSIONID=${sessionMatch[1]}`
        console.log(`✅ JSESSIONID extracted: ${jsessionid}`)
      }
    }
    
    if (!jsessionid) {
      console.log('❌ Login failed - no JSESSIONID')
      return new Response(JSON.stringify({
        test: 'login',
        success: false,
        error: 'No JSESSIONID received'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Test 2: Try REST API for customers
    console.log('\n📋 Test 2: REST API - Customers List')
    const restUrl = `${GOMANAGE_URL}/gomanage/web/data/apitmt-customers/List?start=0&limit=10`
    
    const restResponse = await fetch(restUrl, {
      method: 'GET',
      headers: {
        'Cookie': jsessionid,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Test Bot)'
      }
    })
    
    console.log(`REST Status: ${restResponse.status}`)
    const restText = await restResponse.text()
    console.log(`REST Response: ${restText.substring(0, 500)}...`)
    
    // Test 3: Try GraphQL
    console.log('\n🔄 Test 3: GraphQL API - Simple Query')
    const graphqlQuery = {
      query: `
        query {
          master_files {
            customers(first: 5) {
              totalCount
              nodes {
                customer_id
                name
              }
            }
          }
        }
      `
    }
    
    const graphqlResponse = await fetch(`${GOMANAGE_URL}/gomanage/web/data/graphql`, {
      method: 'POST',
      headers: {
        'Cookie': jsessionid,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Test Bot)'
      },
      body: JSON.stringify(graphqlQuery)
    })
    
    console.log(`GraphQL Status: ${graphqlResponse.status}`)
    const graphqlText = await graphqlResponse.text()
    console.log(`GraphQL Response: ${graphqlText.substring(0, 500)}...`)
    
    // Test 4: Try basic endpoint
    console.log('\n🌐 Test 4: Basic Endpoint Test')
    const basicResponse = await fetch(`${GOMANAGE_URL}/gomanage`, {
      method: 'GET',
      headers: {
        'Cookie': jsessionid,
        'User-Agent': 'Mozilla/5.0 (Test Bot)'
      }
    })
    
    console.log(`Basic Status: ${basicResponse.status}`)
    const basicText = await basicResponse.text()
    console.log(`Basic Response: ${basicText.substring(0, 200)}...`)
    
    // Return comprehensive test results
    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        login: {
          status: loginResponse.status,
          success: !!jsessionid,
          jsessionid: jsessionid ? 'OBTAINED' : 'MISSING'
        },
        rest_api: {
          status: restResponse.status,
          success: restResponse.ok,
          preview: restText.substring(0, 200)
        },
        graphql: {
          status: graphqlResponse.status,
          success: graphqlResponse.ok,
          preview: graphqlText.substring(0, 200)
        },
        basic_endpoint: {
          status: basicResponse.status,
          success: basicResponse.ok,
          preview: basicText.substring(0, 100)
        }
      }
    }
    
    console.log('\n📊 FINAL TEST RESULTS:')
    console.log(JSON.stringify(results, null, 2))
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('🔥 Test Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})