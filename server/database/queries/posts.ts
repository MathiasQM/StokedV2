import type { InsertPost, Post } from '@@/types/database'
import { and, eq, desc } from 'drizzle-orm'
import { H3Error } from 'h3'

export const getAllPosts = async (portfolioId: string) => {
  try {
    const posts = await useDB().query.posts.findMany({
      where: and(eq(tables.posts.portfolioId, portfolioId)),
      orderBy: [desc(tables.posts.createdAt)],
      with: {
        userId: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })
    return posts
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get all posts',
    })
  }
}

export const createPost = async (post: InsertPost) => {
  try {
    const [newPost] = await useDB()
      .insert(tables.posts)
      .values(post)
      .returning()
    return newPost
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create post',
    })
  }
}

export const getPostById = async (
  id: string,
  portfolioId?: string,
  userId: string,
) => {
  try {
    const post = await useDB().query.posts.findFirst({
      where: and(eq(tables.posts.id, id), eq(tables.posts.userId, userId)),
    })
    return post
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get post by ID',
    })
  }
}

export const updatePost = async (
  id: string,
  userId: string,
  post: Partial<Post>,
) => {
  try {
    const result = await useDB()
      .update(tables.posts)
      .set(post)
      .where(and(eq(tables.posts.id, id), eq(tables.posts.userId, userId)))
      .returning()

    if (!result.length) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'You are not authorized to update this post or it does not exist',
      })
    }

    return result[0]
  } catch (error) {
    if (error instanceof H3Error && error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update post',
    })
  }
}

export const deletePost = async (id: string, userId: string) => {
  try {
    const result = await useDB()
      .delete(tables.posts)
      .where(and(eq(tables.posts.id, id), eq(tables.posts.userId, userId)))
      .returning()

    if (!result.length) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'You are not authorized to delete this post or it does not exist',
      })
    }

    return result[0]
  } catch (error) {
    if (error instanceof H3Error && error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete post',
    })
  }
}
