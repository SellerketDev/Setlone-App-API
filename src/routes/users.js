/**
 * User Routes
 */
import {
  getUserById,
  getUserByUID,
  getUserByEmail,
  updateUser,
  updateUserUID
} from '../models/User.js';
import { query } from '../config/database.js';
import { saveFile, fileToBase64, deleteFile, isValidImage } from '../utils/fileUpload.js';

export default async function userRoutes(fastify) {
  /**
   * @route GET /api/v1/users/:userId
   * @description Get user by ID
   * @tags users
   * @param {number} userId - User ID
   * @response 200 - User information
   * @response 404 - User not found
   */
  fastify.get('/users/:userId', {
    schema: {
      description: 'Get user information by user ID. Requires authentication.',
      tags: ['users'],
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'number' }
        },
        required: ['userId']
      },
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
        },
        404: {
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
    const { userId } = request.params;
    const user = await getUserById(parseInt(userId, 10));

    if (!user) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Remove sensitive information
    const { password_hash, ...userData } = user;

    return reply.send({
      success: true,
      data: userData
    });
  });

  /**
   * @route GET /api/v1/users/uid/:uid
   * @description Get user by UID
   * @tags users
   * @param {string} uid - User UID (7 digits)
   * @response 200 - User information
   * @response 404 - User not found
   */
  fastify.get('/users/uid/:uid', {
    schema: {
      description: 'Get user information by UID',
      tags: ['users'],
      params: {
        type: 'object',
        properties: {
          uid: { type: 'string', pattern: '^\\d{7}$' }
        },
        required: ['uid']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object'
            }
          }
        },
        404: {
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
    const { uid } = request.params;
    const user = await getUserByUID(uid);

    if (!user) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Remove sensitive information
    const { password_hash, ...userData } = user;

    return reply.send({
      success: true,
      data: userData
    });
  });

  /**
   * @route GET /api/v1/users/email/:email
   * @description Get user by email
   * @tags users
   * @param {string} email - User email
   * @response 200 - User information
   * @response 404 - User not found
   */
  fastify.get('/users/email/:email', {
    schema: {
      description: 'Get user information by email',
      tags: ['users'],
      params: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object'
            }
          }
        },
        404: {
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
    const { email } = request.params;
    const user = await getUserByEmail(email);

    if (!user) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Remove sensitive information
    const { password_hash, ...userData } = user;

    return reply.send({
      success: true,
      data: userData
    });
  });

  /**
   * @route PUT /api/v1/users/:userId/uid
   * @description Update user UID
   * @tags users
   * @param {number} userId - User ID
   * @body {string} uid - New UID (7 digits)
   * @response 200 - UID updated successfully
   * @response 400 - Invalid UID format or UID already exists
   * @response 404 - User not found
   */
  fastify.put('/users/:userId/uid', {
    schema: {
      description: 'Update user UID. UID must be exactly 7 digits and unique.',
      tags: ['users'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'number' }
        },
        required: ['userId']
      },
      body: {
        type: 'object',
        required: ['uid'],
        properties: {
          uid: {
            type: 'string',
            pattern: '^\\d{7}$',
            description: '7-digit unique user ID'
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
                uid: { type: 'string' }
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
        },
        404: {
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
    const { userId } = request.params;
    const { uid } = request.body;

    try {
      const user = await updateUserUID(parseInt(userId, 10), uid);
      
      return reply.send({
        success: true,
        message: 'UID updated successfully',
        data: {
          uid: user.uid
        }
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message
        });
      }
      
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message
      });
    }
  });

  /**
   * @route PUT /api/v1/users/:userId/profile
   * @description Update user profile (profile image, bio)
   * @tags users
   * @param {number} userId - User ID
   * @body {string} profile_image - Profile image URL or base64 string
   * @body {string} bio - Bio/status message
   * @response 200 - Profile updated successfully
   * @response 404 - User not found
   */
  fastify.put('/users/:userId/profile', {
    schema: {
      description: 'Update user profile information (profile image and bio). Requires authentication. Users can only update their own profile.',
      tags: ['users'],
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'number' }
        },
        required: ['userId']
      },
      body: {
        type: 'object',
        properties: {
          profile_image: {
            type: 'string',
            description: 'Profile image URL or base64 encoded string (data:image/...;base64,...)'
          },
          bio: {
            type: 'string',
            description: 'Bio/status message'
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
              type: 'object'
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
        },
        403: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
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
    const { userId } = request.params;
    const { profile_image, bio } = request.body;

    // 본인 프로필만 수정 가능
    if (request.user.id !== parseInt(userId, 10)) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    const updateData = {};
    
    // Handle profile image
    if (profile_image !== undefined) {
      // Check if it's base64 or URL
      if (profile_image.startsWith('data:image')) {
        // Base64 string - save directly to DB
        updateData.profile_image = profile_image;
      } else if (profile_image.startsWith('http://') || profile_image.startsWith('https://') || profile_image.startsWith('/uploads/')) {
        // URL - save as is
        updateData.profile_image = profile_image;
      } else {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid profile_image format. Use URL or base64 string.'
        });
      }
    }
    
    if (bio !== undefined) updateData.bio = bio;

    try {
      const user = await updateUser(parseInt(userId, 10), updateData);

      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile_image: user.profile_image || null,
          bio: user.bio || null
        }
      });
    } catch (error) {
      fastify.log.error('Error updating profile:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || 'Failed to update profile'
      });
    }
  });

  /**
   * @route POST /api/v1/users/:userId/profile/image
   * @description Upload profile image file
   * @tags users
   * @param {number} userId - User ID
   * @consumes multipart/form-data
   * @param {file} image - Image file
   * @response 200 - Image uploaded successfully
   * @response 400 - Invalid file or file too large
   * @response 404 - User not found
   */
  fastify.post('/users/:userId/profile/image', {
    schema: {
      description: 'Upload profile image file. Requires authentication. Users can only upload their own profile image.',
      tags: ['users'],
      security: [{ BearerAuth: [] }],
      consumes: ['multipart/form-data'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'number' }
        },
        required: ['userId']
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
                profile_image: { type: 'string' }
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
        },
        401: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
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
    const { userId } = request.params;

    // 본인 프로필만 수정 가능
    if (request.user.id !== parseInt(userId, 10)) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You can only upload your own profile image'
      });
    }

    // Check if user exists
    const user = await getUserById(parseInt(userId, 10));
    if (!user) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Validate image
      if (!isValidImage(data)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid image file. Allowed types: JPEG, PNG, GIF, WebP'
        });
      }

      // Delete old image if exists (if it's a local file)
      if (user.profile_image && user.profile_image.startsWith('/uploads/')) {
        await deleteFile(user.profile_image);
      }

      // Save file to disk
      const fileUrl = await saveFile(data, 'profiles');

      // Update user profile
      const updatedUser = await updateUser(parseInt(userId, 10), {
        profile_image: fileUrl
      });

      return reply.send({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          profile_image: updatedUser.profile_image
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to upload image'
      });
    }
  });

  /**
   * @route GET /api/v1/users/:userId/posts
   * @description Get posts by user ID
   * @tags users
   * @param {number} userId - User ID
   * @response 200 - User posts
   */
  fastify.get('/users/:userId/posts', {
    schema: {
      description: 'Get all posts created by a specific user',
      tags: ['users'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'number' }
        },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  user_id: { type: 'number' },
                  content: { type: 'string' },
                  image_url: { type: 'string' },
                  created_at: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { userId } = request.params;

    const sql = `
      SELECT 
        id, user_id, content, image_url, image_urls,
        location, created_at, updated_at
      FROM posts
      WHERE user_id = ? AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;

    const posts = await query(sql, [parseInt(userId, 10)]);

    return reply.send({
      success: true,
      data: posts
    });
  });
}

