import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Cache global de sesiones mejorado
const sessionCache = new Map<string, { jsessionid: string; timestamp: number }>()

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const endpoint = url.searchParams.get('endpoint')
    const username = url.searchParams.get('username') || 'distri'
    const password = url.searchParams.get('password') || 'GOtmt%'
    const sessionId = url.searchParams.get('sessionId')

    const GOMANAGE_URL = 'http://buyled.clonico.es:8181'
    
    console.log(`🔄 Gomanage Proxy - Action: ${action}, SessionId: ${sessionId}`)

    // 🔐 LOGIN - Autenticación con Gomanage
    if (action === 'login') {
      console.log(`🔑 Intentando login para usuario: ${username}`)
      
      const loginData = `j_username=${encodeURIComponent(username)}&j_password=${encodeURIComponent(password)}`
      
      try {
        const loginResponse = await fetch(`${GOMANAGE_URL}/gomanage/static/auth/j_spring_security_check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: loginData,
          redirect: 'manual'
        })

        const setCookieHeaders = loginResponse.headers.get('set-cookie')
        let jsessionid = null
        
        if (setCookieHeaders) {
          const sessionMatch = setCookieHeaders.match(/JSESSIONID=([^;]+)/)
          if (sessionMatch) {
            jsessionid = `JSESSIONID=${sessionMatch[1]}`
          }
        }

        const isLoginSuccess = (loginResponse.status === 302 || loginResponse.status === 200) && jsessionid

        if (isLoginSuccess) {
          // Guardar sesión en cache
          sessionCache.set(username, {
            jsessionid: jsessionid,
            timestamp: Date.now()
          })
          
          console.log(`✅ Login exitoso para ${username}`)
          console.log(`💾 Sesión guardada. Cache size: ${sessionCache.size}`)
          console.log(`🔑 JSESSIONID obtenido: ${jsessionid}`)
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Login exitoso',
            sessionId: username,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          console.log(`❌ Login fallido para ${username}`)
          console.log(`📄 Status: ${loginResponse.status}`)
          console.log(`🍪 Set-Cookie: ${setCookieHeaders}`)
          
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Credenciales inválidas',
            status: loginResponse.status
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (error) {
        console.error('🔥 Error en login:', error)
        return new Response(JSON.stringify({ 
          success: false,
          error: `Error de conexión: ${error.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 🔄 PROXY - Reenviar peticiones autenticadas con soporte para parámetros
    if (action === 'proxy') {
      console.log(`🔍 Proxy - SessionId recibido: ${sessionId}`)
      console.log(`💾 Sessions en cache: ${Array.from(sessionCache.keys())}`)
      
      if (!sessionId) {
        console.log(`❌ No se proporcionó sessionId`)
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Se requiere sessionId' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!sessionCache.has(sessionId)) {
        console.log(`❌ SessionId ${sessionId} no encontrado en cache`)
        console.log(`💾 Cache actual contiene: ${Array.from(sessionCache.keys())}`)
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Sesión no válida o expirada. Haz login primero.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const sessionData = sessionCache.get(sessionId)!
      const jsessionid = sessionData.jsessionid
      let targetUrl = `${GOMANAGE_URL}${endpoint || '/gomanage'}`

      // Agregar parámetros para obtener TODOS los registros
      if (endpoint && endpoint.includes('apitmt-customers/List')) {
        const urlParams = new URLSearchParams({
          start: '0',
          limit: '2000', // Obtener todos los registros (más que los 1,478 conocidos)
          sort: 'id',
          dir: 'ASC'
        })
        targetUrl += `?${urlParams.toString()}`
        console.log(`📋 Solicitando TODOS los clientes con parámetros: start=0, limit=2000`)
      }

      console.log(`📡 Proxy request a: ${targetUrl}`)
      console.log(`🔑 Usando JSESSIONID: ${jsessionid}`)

      try {
        const gomanageResponse = await fetch(targetUrl, {
          method: req.method,
          headers: {
            'Cookie': jsessionid,
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        const responseText = await gomanageResponse.text()
        let jsonData

        try {
          jsonData = JSON.parse(responseText)
        } catch {
          jsonData = { 
            data: responseText, 
            raw: true,
            contentType: gomanageResponse.headers.get('content-type')
          }
        }

        console.log(`✅ Proxy response: ${gomanageResponse.status}`)
        if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
          console.log(`📋 🎉 ÉXITO: ${jsonData.data.length} clientes obtenidos`)
          console.log(`📊 Total count reportado: ${jsonData.totalCount || 'no disponible'}`)
          if (jsonData.data.length > 0) {
            console.log(`📝 Primer cliente:`, JSON.stringify(jsonData.data[0]).substring(0, 200))
          }
        }
        console.log(`📋 Data preview:`, JSON.stringify(jsonData).substring(0, 300))

        return new Response(JSON.stringify({
          success: gomanageResponse.ok,
          data: jsonData,
          timestamp: new Date().toISOString()
        }), {
          status: gomanageResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('🔥 Error en proxy:', error)
        return new Response(JSON.stringify({
          success: false,
          error: `Error de proxy: ${error.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 📊 STATUS - Estado del proxy
    if (action === 'status') {
      try {
        const healthCheck = await fetch(`${GOMANAGE_URL}/gomanage`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })

        return new Response(JSON.stringify({
          proxyStatus: 'online',
          gomanageStatus: healthCheck.ok ? 'online' : 'offline',
          gomanageUrl: GOMANAGE_URL,
          activeSessions: sessionCache.size,
          sessionKeys: Array.from(sessionCache.keys()),
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

    // 🚪 LOGOUT - Cerrar sesión
    if (action === 'logout') {
      if (sessionId && sessionCache.has(sessionId)) {
        sessionCache.delete(sessionId)
        console.log(`👋 Logout para ${sessionId}`)
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
      error: 'Acción no válida. Usa: login, proxy, status, logout',
      availableActions: ['login', 'proxy', 'status', 'logout']
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('🔥 Error general en proxy:', error)
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