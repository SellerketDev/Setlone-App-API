/**
 * Authentication Middleware
 * JWT 토큰을 검증하여 로그인 상태를 확인합니다.
 */

export async function authenticate(request, reply) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // JWT 토큰 검증
    const decoded = await request.jwtVerify();
    
    // request에 사용자 정보 추가
    request.user = decoded;
    
    return;
  } catch (error) {
    return reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 */
export async function optionalAuthenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await request.jwtVerify();
      request.user = decoded;
    }
    
    return;
  } catch (error) {
    // 토큰이 유효하지 않아도 통과 (선택적 인증)
    return;
  }
}

