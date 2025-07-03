import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Cache de sesiones mejorado
const sessionCache = new Map<string, { 
  jsessionid: string; 
  timestamp: number; 
  expires: number;
  lastUsed: number;
}>()

// Configuración del servidor Gomanage
const GOMANAGE_CONFIG = {
  baseUrl: 'http://buyled.clonico.es:8181',
  timeout: 15000,
  retries: 3,
  credentials: {
    username: 'distri',
    password: 'GOtmt%'
  }
}

// Utilidad para logs con timestamp
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

// Limpiar sesiones expiradas
function cleanExpiredSessions() {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, session] of sessionCache.entries()) {
    if (now > session.expires || (now - session.lastUsed) > 1800000) { // 30 min sin uso
      sessionCache.delete(key)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    log(`🧹 Limpiadas ${cleaned} sesiones expiradas`)
  }
}

// Hacer petición con reintentos
async function fetchWithRetry(url: string, options: RequestInit, retries = GOMANAGE_CONFIG.retries): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), GOMANAGE_CONFIG.timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      log(`❌ Intento ${i + 1}/${retries} falló:`, error.message)
      
      if (i === retries - 1) throw error
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  throw new Error('Todos los intentos fallaron')
}

// Realizar login y obtener JSESSIONID
async function performLogin(username: string = GOMANAGE_CONFIG.credentials.username): Promise<string> {
  log(`🔑 Realizando login para: ${username}`)
  
  const loginData = `j_username=${encodeURIComponent(username)}&j_password=${encodeURIComponent(GOMANAGE_CONFIG.credentials.password)}`
  
  const response = await fetchWithRetry(`${GOMANAGE_CONFIG.baseUrl}/gomanage/static/auth/j_spring_security_check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    body: loginData,
    redirect: 'manual'
  })

  const setCookieHeaders = response.headers.get('set-cookie')
  
  if (!setCookieHeaders) {
    throw new Error(`Login falló - No se recibieron cookies. Status: ${response.status}`)
  }

  const sessionMatch = setCookieHeaders.match(/JSESSIONID=([^;]+)/)
  if (!sessionMatch) {
    throw new Error(`Login falló - No se encontró JSESSIONID en cookies: ${setCookieHeaders}`)
  }

  const jsessionid = `JSESSIONID=${sessionMatch[1]}`
  log(`✅ Login exitoso, JSESSIONID obtenido: ${jsessionid.substring(0, 30)}...`)
  
  return jsessionid
}

// Obtener o crear sesión válida
async function getValidSession(sessionId: string): Promise<string> {
  cleanExpiredSessions()
  
  const now = Date.now()
  const cached = sessionCache.get(sessionId)
  
  // Verificar si la sesión en cache es válida
  if (cached && now < cached.expires && (now - cached.lastUsed) < 1800000) {
    cached.lastUsed = now
    log(`♻️ Usando sesión en cache para: ${sessionId}`)
    return cached.jsessionid
  }

  // Crear nueva sesión
  log(`🔄 Creando nueva sesión para: ${sessionId}`)
  const jsessionid = await performLogin(sessionId)
  
  // Guardar en cache
  sessionCache.set(sessionId, {
    jsessionid,
    timestamp: now,
    expires: now + (30 * 60 * 1000), // 30 minutos
    lastUsed: now
  })
  
  log(`💾 Sesión guardada en cache. Total sesiones: ${sessionCache.size}`)
  return jsessionid
}

// Ejecutar consulta GraphQL
async function executeGraphQL(query: any, jsessionid: string): Promise<any> {
  log(`📊 Ejecutando consulta GraphQL`)
  
  const response = await fetchWithRetry(`${GOMANAGE_CONFIG.baseUrl}/gomanage/web/data/graphql`, {
    method: 'POST',
    headers: {
      'Cookie': jsessionid,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify(query)
  })

  if (!response.ok) {
    throw new Error(`GraphQL falló: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
  }

  return data
}

// Consultas GraphQL predefinidas
const GRAPHQL_QUERIES = {
  customers: {
    query: `
      query GetAllCustomers($first: Int!, $offset: Int!) {
        master_files {
          customers(
            where: { key: { customer_ambit: { equals: 0 } } }
            first: $first
            offset: $offset
            order: { customer_id: ASC }
          ) {
            totalCount
            nodes {
              customer_id
              name
              business_name
              vat_number
              street_name
              street_number
              postal_code
              city
              province_id
              country_id
              unique_id
              creation_date
              last_modified_date
              customer_branches {
                company_id
                branch_id
                email
                phone
                fax
                web
                notes
              }
            }
          }
        }
      }
    `,
    variables: { first: 2000, offset: 0 }
  },
  
  products: {
    query: `
      query GetAllProducts($first: Int!, $offset: Int!) {
        master_files {
          products(
            first: $first
            offset: $offset
            order: { product_id: ASC }
          ) {
            totalCount
            nodes {
              product_id
              brand_name
              reference
              description_short
              description_long
              base_price
              stock_real
              stock_reserved
              category_id
              creation_date
              last_modified_date
            }
          }
        }
      }
    `,
    variables: { first: 2000, offset: 0 }
  },
  
  orders: {
    query: `
      query GetAllOrders($first: Int!, $offset: Int!) {
        commercial_documents {
          orders(
            first: $first
            offset: $offset
            order: { order_id: DESC }
          ) {
            totalCount
            nodes {
              order_id
              order_number
              reference
              order_date
              status
              customer_name
              total_amount
              tax_amount
              shipping_cost
              creation_date
              last_modified_date
            }
          }
        }
      }
    `,
    variables: { first: 1000, offset: 0 }
  }
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const endpoint = url.searchParams.get('endpoint')
    const sessionId = url.searchParams.get('sessionId') || 'default'

    log(`🔄 Proxy request - Action: ${action}, Endpoint: ${endpoint}`)

    // 📊 STATUS - Estado del proxy y Gomanage
    if (action === 'status') {
      try {
        const healthResponse = await fetchWithRetry(`${GOMANAGE_CONFIG.baseUrl}/gomanage`, {
          method: 'GET'
        })

        return new Response(JSON.stringify({
          proxyStatus: 'online',
          gomanageStatus: healthResponse.ok ? 'online' : 'offline',
          gomanageUrl: GOMANAGE_CONFIG.baseUrl,
          activeSessions: sessionCache.size,
          config: {
            timeout: GOMANAGE_CONFIG.timeout,
            retries: GOMANAGE_CONFIG.retries
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({
          proxyStatus: 'online',
          gomanageStatus: 'offline',
          error: error.message,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 🔐 LOGIN - Crear sesión
    if (action === 'login') {
      try {
        const jsessionid = await performLogin(sessionId)
        
        // Guardar en cache
        const now = Date.now()
        sessionCache.set(sessionId, {
          jsessionid,
          timestamp: now,
          expires: now + (30 * 60 * 1000),
          lastUsed: now
        })
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Login exitoso',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        log(`❌ Error en login:`, error.message)
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 🔄 PROXY - Ejecutar consultas
    if (action === 'proxy') {
      if (!sessionId) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Se requiere sessionId' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      try {
        const jsessionid = await getValidSession(sessionId)
        
        // Detectar tipo de consulta por endpoint
        let queryType = null
        let graphqlQuery = null
        
        if (endpoint?.includes('customers')) {
          queryType = 'customers'
          graphqlQuery = GRAPHQL_QUERIES.customers
        } else if (endpoint?.includes('products')) {
          queryType = 'products'
          graphqlQuery = GRAPHQL_QUERIES.products
        } else if (endpoint?.includes('orders')) {
          queryType = 'orders'
          graphqlQuery = GRAPHQL_QUERIES.orders
        }

        if (graphqlQuery) {
          log(`📊 Ejecutando consulta GraphQL para: ${queryType}`)
          const data = await executeGraphQL(graphqlQuery, jsessionid)
          
          // Log de resultados
          if (data.data) {
            const entityData = queryType === 'orders' 
              ? data.data.commercial_documents?.[queryType]
              : data.data.master_files?.[queryType]
              
            if (entityData) {
              log(`✅ ${queryType} obtenidos: ${entityData.nodes?.length || 0} de ${entityData.totalCount || 0}`)
            }
          }

          return new Response(JSON.stringify({
            success: true,
            data: data,
            queryType: queryType,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Fallback para otros endpoints
          const targetUrl = `${GOMANAGE_CONFIG.baseUrl}${endpoint || '/gomanage'}`
          log(`📡 REST request a: ${targetUrl}`)

          const response = await fetchWithRetry(targetUrl, {
            method: 'GET',
            headers: {
              'Cookie': jsessionid,
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const responseText = await response.text()
          let jsonData

          try {
            jsonData = JSON.parse(responseText)
          } catch {
            jsonData = { 
              data: responseText, 
              raw: true,
              contentType: response.headers.get('content-type')
            }
          }

          return new Response(JSON.stringify({
            success: response.ok,
            data: jsonData,
            timestamp: new Date().toISOString()
          }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (error) {
        log(`❌ Error en proxy:`, error.message)
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          needsReauth: error.message.includes('401') || error.message.includes('unauthorized')
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 🚪 LOGOUT - Cerrar sesión
    if (action === 'logout') {
      if (sessionCache.has(sessionId)) {
        sessionCache.delete(sessionId)
        log(`👋 Logout para: ${sessionId}`)
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Sesión cerrada correctamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Acción no reconocida
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Acción no válida',
      availableActions: ['login', 'proxy', 'status', 'logout'],
      usage: {
        status: '?action=status',
        login: '?action=login&sessionId=username',
        proxy: '?action=proxy&sessionId=username&endpoint=/path',
        logout: '?action=logout&sessionId=username'
      }
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    log(`🔥 Error general:`, error.message)
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error interno del proxy',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})