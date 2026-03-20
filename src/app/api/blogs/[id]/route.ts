import { NextRequest, NextResponse } from 'next/server';
import { 
  getBlogById, 
  updateBlogPost, 
  deleteBlogPost, 
  toggleBlogLike 
} from '@/lib/blog-database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const incrementView = searchParams.get('view') === 'true';

    const blog = await getBlogById(blogId, incrementView);
    
    if (!blog) {
      return NextResponse.json({ 
        error: 'Blog post not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blog
    });

  } catch (error) {
    console.error('Get blog API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const body = await request.json();
    const { 
      title, 
      content, 
      excerpt,
      featuredImage,
      images,
      tags,
      category,
      status,
      isPublic,
      userId // For authorization
    } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID required for authorization' 
      }, { status: 401 });
    }

    // Get the blog first to check ownership
    const existingBlog = await getBlogById(blogId);
    if (!existingBlog) {
      return NextResponse.json({ 
        error: 'Blog post not found' 
      }, { status: 404 });
    }

    if (existingBlog.authorId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only edit your own blog posts' 
      }, { status: 403 });
    }

    console.log(`Updating blog post: ${blogId} by user ${userId}`);

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (images !== undefined) updates.images = images;
    if (tags !== undefined) updates.tags = tags;
    if (category !== undefined) updates.category = category;
    if (status !== undefined) updates.status = status;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const updatedBlog = await updateBlogPost(blogId, updates);

    if (!updatedBlog) {
      return NextResponse.json({ 
        error: 'Failed to update blog post' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blog: updatedBlog,
      message: 'Blog post updated successfully'
    });

  } catch (error) {
    console.error('Update blog API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID required for authorization' 
      }, { status: 401 });
    }

    console.log(`Deleting blog post: ${blogId} by user ${userId}`);

    const success = await deleteBlogPost(blogId, userId);

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to delete blog post or unauthorized' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID required' 
      }, { status: 401 });
    }

    if (action === 'toggle-like') {
      const result = await toggleBlogLike(blogId, userId);
      
      if (!result) {
        return NextResponse.json({ 
          error: 'Blog post not found' 
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        liked: result.liked,
        likes: result.likes,
        message: result.liked ? 'Blog liked' : 'Blog unliked'
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Blog action API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 