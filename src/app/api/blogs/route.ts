import { NextRequest, NextResponse } from 'next/server';
import { 
  createBlogPost, 
  getPublishedBlogs, 
  getUserBlogs,
  searchBlogs,
  getBlogCategories,
  getPopularTags 
} from '@/lib/blog-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(tag => tag.trim());
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const action = searchParams.get('action');

    // Handle different actions
    switch (action) {
      case 'categories':
        const categories = await getBlogCategories();
        return NextResponse.json({ success: true, categories });

      case 'tags':
        const popularTags = await getPopularTags();
        return NextResponse.json({ success: true, tags: popularTags });

      case 'user-blogs':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required for user blogs' }, { status: 400 });
        }
        const userBlogs = await getUserBlogs(userId);
        return NextResponse.json({ success: true, blogs: userBlogs });

      case 'search':
        if (!search) {
          return NextResponse.json({ error: 'Search query required' }, { status: 400 });
        }
        const searchResults = await searchBlogs(search, limit, skip);
        return NextResponse.json({ success: true, blogs: searchResults });

      default:
        // Get published blogs (public feed)
        const blogs = await getPublishedBlogs(limit, skip, category, tags);
        return NextResponse.json({ 
          success: true, 
          blogs,
          pagination: {
            limit,
            skip,
            hasMore: blogs.length === limit
          }
        });
    }
  } catch (error) {
    console.error('Blogs API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      content, 
      authorId, 
      authorName, 
      authorEmail,
      excerpt,
      featuredImage,
      images,
      tags,
      category,
      status,
      isPublic
    } = body;

    if (!title || !content || !authorId || !authorName || !authorEmail) {
      return NextResponse.json({ 
        error: 'Title, content, author ID, name, and email are required' 
      }, { status: 400 });
    }

    console.log(`Creating blog post: ${title} by ${authorName}`);

    const blog = await createBlogPost(
      title,
      content,
      authorId,
      authorName,
      authorEmail,
      {
        excerpt,
        featuredImage,
        images: images || [],
        tags: tags || [],
        category,
        status: status || 'draft',
        isPublic: isPublic !== undefined ? isPublic : true
      }
    );

    if (!blog) {
      return NextResponse.json({ 
        error: 'Failed to create blog post' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blog,
      message: 'Blog post created successfully'
    });

  } catch (error) {
    console.error('Create blog API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 