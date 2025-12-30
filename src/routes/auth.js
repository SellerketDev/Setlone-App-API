/**
 * Authentication Routes
 */
import bcrypt from 'bcryptjs';
import {
  createUser,
  emailExists,
  usernameExists,
  phoneNumberExists,
  setEmailVerificationCode,
  verifyEmailCode,
  getUserByEmail
} from '../models/User.js';

export default async function authRoutes(fastify) {
  /**
   * @route POST /api/v1/auth/login
   * @description Login user with email and password
   * @tags auth
   * @body {string} email - User email (used as login ID)
   * @body {string} password - User password
   * @response 200 - Login successful, returns user data
   * @response 401 - Invalid credentials
   * @response 400 - Validation error
   */
  fastify.post('/auth/login', {
    schema: {
      description: 'Login user with email and password. Returns user information on success.',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { 
            type: 'string',
            format: 'email'
          },
          password: { 
            type: 'string',
            minLength: 6
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                username: { type: 'string' },
                uid: { type: 'string' },
                profile_image: { type: 'string' },
                bio: { type: 'string' },
                real_name: { type: 'string' },
                email_verified: { type: 'boolean' },
                created_at: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    // 입력 검증
    if (!email || !password) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    try {
      // 이메일로 사용자 조회
      const user = await getUserByEmail(email);

      if (!user) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // 비밀번호 확인 (user 객체에 password_hash가 포함되어 있음)
      if (!user.password_hash) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // 이메일 인증 확인 (선택사항 - 필요시 주석 해제)
      // if (!user.email_verified) {
      //   return reply.code(403).send({
      //     statusCode: 403,
      //     error: 'Forbidden',
      //     message: 'Email not verified. Please verify your email first.'
      //   });
      // }

      // JWT 토큰 생성
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username
      }, {
        expiresIn: '7d' // 7일간 유효
      });

      // 로그인 성공 - 사용자 정보와 토큰 반환 (비밀번호 제외)
      return reply.send({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          uid: user.uid,
          profile_image: user.profile_image,
          bio: user.bio,
          real_name: user.real_name,
          email_verified: user.email_verified,
          created_at: user.created_at
        },
        token: token
      });
    } catch (error) {
      fastify.log.error('Login error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during login'
      });
    }
  });

  /**
   * @route GET /api/v1/auth/me
   * @description Get current logged in user information
   * @tags auth
   * @security BearerAuth
   * @response 200 - Current user information
   * @response 401 - Unauthorized
   */
  fastify.get('/auth/me', {
    schema: {
      description: 'Get current logged in user information. Requires authentication token.',
      tags: ['auth'],
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                username: { type: 'string' },
                uid: { type: 'string' },
                profile_image: { type: 'string' },
                bio: { type: 'string' },
                real_name: { type: 'string' },
                email_verified: { type: 'boolean' },
                created_at: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // JWT에서 사용자 정보 가져오기
      const userId = request.user.id;
      
      // 사용자 정보 조회
      const user = await getUserByEmail(request.user.email);

      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // 사용자 정보 반환 (비밀번호 제외)
      return reply.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          uid: user.uid,
          profile_image: user.profile_image,
          bio: user.bio,
          real_name: user.real_name,
          email_verified: user.email_verified,
          created_at: user.created_at
        }
      });
    } catch (error) {
      fastify.log.error('Get current user error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred while fetching user information'
      });
    }
  });

  /**
   * @route POST /api/v1/auth/logout
   * @description Logout user (clears session/token on client side)
   * @tags auth
   * @response 200 - Logout successful
   */
  fastify.post('/auth/logout', {
    schema: {
      description: 'Logout user. This endpoint clears server-side session if any. Client should clear local storage and tokens.',
      tags: ['auth'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    // 로그아웃 처리 (현재는 클라이언트 측에서 토큰/세션을 제거)
    // 향후 JWT 토큰 블랙리스트나 세션 관리가 필요하면 여기에 추가
    
    return reply.send({
      success: true,
      message: 'Logout successful'
    });
  });
  /**
   * @route POST /api/v1/auth/register
   * @description Register a new user with email verification
   * @tags auth
   * @body {string} email - User email (used as login ID)
   * @body {string} username - Username (nickname for display)
   * @body {string} password - Password (minimum 6 characters)
   * @body {string} realName - Real name (user's actual name)
   * @body {string} birthDate - Birth date (format: YYYY-MM-DD)
   * @body {string} phoneNumber - Phone number (international format starting with +, e.g., +82010-1234-5678)
   * @response 201 - User registered successfully. Email verification required.
   * @response 400 - Validation error (email/username/phone already exists or invalid format)
   */
  fastify.post('/auth/register', {
      schema: {
      description: 'Register a new user. After registration, email verification is required using the code sent to the email address.',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'username', 'password', 'realName', 'birthDate', 'phoneNumber'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'Username (nickname) for display purposes'
          },
          password: {
            type: 'string',
            minLength: 6
          },
          realName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User\'s real name'
          },
          birthDate: {
            type: 'string',
            format: 'date'
          },
          phoneNumber: {
            type: 'string',
            pattern: '^\\+[0-9-]+$',
            description: 'Phone number in international format (must start with +, e.g., +82010-1234-5678)'
          }
        }
      },
      response: {
        201: {
          type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'number' },
                  email: { type: 'string' },
                  username: { type: 'string' }
                }
              }
            }
        },
        400: {
          type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
        }
      }
    }
  }, async (request, reply) => {
    const { email, username, password, realName, birthDate, phoneNumber } = request.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Check if email already exists
    if (await emailExists(email)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Email already exists'
      });
    }

    // Check if username already exists
    if (await usernameExists(username)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Username already exists'
      });
    }

    // Check if phone number already exists
    if (await phoneNumberExists(phoneNumber)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Phone number already exists'
      });
    }

    // Validate birth date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid birth date format. Use YYYY-MM-DD'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    try {
      const user = await createUser({
        email,
        username,
        passwordHash,
        realName,
        birthDate,
        phoneNumber
      });

      // Send verification code (fixed to 123456 for now)
      const verificationCode = '123456';
      await setEmailVerificationCode(email, verificationCode);

      return reply.code(201).send({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          userId: user.id,
          email: user.email,
          username: user.username
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create user'
      });
    }
  });

  /**
   * @route POST /api/v1/auth/send-verification
   * @description Resend email verification code to user's email address
   * @tags auth
   * @body {string} email - User email address
   * @response 200 - Verification code sent successfully
   * @response 400 - User not found with the provided email
   */
  fastify.post('/auth/send-verification', {
      schema: {
      description: 'Resend email verification code. The verification code is fixed to "123456" for development purposes.',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          }
        }
      },
      response: {
        200: {
          type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email } = request.body;

    // Check if email exists
    if (!(await emailExists(email))) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'User not found'
      });
    }

    // Send verification code (fixed to 123456 for now)
    const verificationCode = '123456';
    await setEmailVerificationCode(email, verificationCode);

    return reply.send({
      success: true,
      message: 'Verification code sent'
    });
  });

  /**
   * @route POST /api/v1/auth/verify-email
   * @description Verify user email address with verification code
   * @tags auth
   * @body {string} email - User email address
   * @body {string} code - Verification code (currently fixed to "123456" for development)
   * @response 200 - Email verified successfully. User account is now active.
   * @response 400 - Invalid verification code or code mismatch
   */
  fastify.post('/auth/verify-email', {
      schema: {
      description: 'Verify email address using the verification code. The code is currently fixed to "123456" for development purposes.',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          code: {
            type: 'string'
          }
        }
      },
      response: {
        200: {
          type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, code } = request.body;

    // Verify code
    const verified = await verifyEmailCode(email, code);

    if (!verified) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid verification code'
      });
    }

    return reply.send({
      success: true,
      message: 'Email verified successfully'
    });
  });
}

