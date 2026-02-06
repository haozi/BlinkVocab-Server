import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/hello
 * 返回问候消息，并从数据库读取用户列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || 'World'

    // 从数据库读取所有用户
    const users = await prisma.user.findMany({
      include: {
        posts: true,
      },
    })

    return NextResponse.json(
      {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
        database: {
          totalUsers: users.length,
          users: users,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      {
        error: '数据库查询失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/hello
 * 创建新用户
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!email) {
      return NextResponse.json(
        { error: '缺少必要字段: email' },
        { status: 400 },
      )
    }

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
      },
      include: {
        posts: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `用户 ${name || email} 创建成功!`,
        user: user,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Database error:', error)

    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json({ error: '该 email 已存在' }, { status: 409 })
    }

    return NextResponse.json(
      {
        error: '创建用户失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 },
    )
  }
}
