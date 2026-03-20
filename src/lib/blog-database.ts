import { connectToDatabase } from './mongodb';
import Blog, { IBlog } from './models/Blog';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  featuredImage?: string;
  images: string[];
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  views: number;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Create a new blog post
export async function createBlogPost(
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  authorEmail: string,
  options: {
    excerpt?: string;
    featuredImage?: string;
    images?: string[];
    tags?: string[];
    category?: string;
    status?: 'draft' | 'published';
    isPublic?: boolean;
  } = {}
): Promise<BlogPost | null> {
  try {
    await connectToDatabase();

    const blog = new Blog({
      title,
      content,
      excerpt: options.excerpt || content.substring(0, 150) + '...',
      authorId,
      authorName,
      authorEmail,
      featuredImage: options.featuredImage || '',
      images: options.images || [],
      tags: options.tags || [],
      category: options.category || 'general',
      status: options.status || 'draft',
      isPublic: options.isPublic !== undefined ? options.isPublic : true,
    });

    const savedBlog = await blog.save();
    console.log(`Blog post created: ${savedBlog.title} by ${authorName}`);

    return {
      id: savedBlog._id.toString(),
      title: savedBlog.title,
      content: savedBlog.content,
      excerpt: savedBlog.excerpt,
      authorId: savedBlog.authorId,
      authorName: savedBlog.authorName,
      authorEmail: savedBlog.authorEmail,
      featuredImage: savedBlog.featuredImage,
      images: savedBlog.images,
      tags: savedBlog.tags,
      category: savedBlog.category,
      status: savedBlog.status,
      isPublic: savedBlog.isPublic,
      views: savedBlog.views,
      likes: savedBlog.likes,
      likedBy: savedBlog.likedBy,
      createdAt: savedBlog.createdAt.toISOString(),
      updatedAt: savedBlog.updatedAt.toISOString(),
      publishedAt: savedBlog.publishedAt?.toISOString(),
    };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return null;
  }
}

// Get all published blogs (public feed)
export async function getPublishedBlogs(
  limit: number = 20,
  skip: number = 0,
  category?: string,
  tags?: string[]
): Promise<BlogPost[]> {
  try {
    await connectToDatabase();

    const query: any = {
      status: 'published',
      isPublic: true
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return blogs.map(blog => ({
      id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      authorId: blog.authorId,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      featuredImage: blog.featuredImage,
      images: blog.images,
      tags: blog.tags,
      category: blog.category,
      status: blog.status,
      isPublic: blog.isPublic,
      views: blog.views,
      likes: blog.likes,
      likedBy: blog.likedBy,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Error getting published blogs:', error);
    return [];
  }
}

// Get user's blogs (all statuses)
export async function getUserBlogs(userId: string): Promise<BlogPost[]> {
  try {
    await connectToDatabase();

    const blogs = await Blog.find({ authorId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    return blogs.map(blog => ({
      id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      authorId: blog.authorId,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      featuredImage: blog.featuredImage,
      images: blog.images,
      tags: blog.tags,
      category: blog.category,
      status: blog.status,
      isPublic: blog.isPublic,
      views: blog.views,
      likes: blog.likes,
      likedBy: blog.likedBy,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Error getting user blogs:', error);
    return [];
  }
}

// Get blog by ID
export async function getBlogById(blogId: string, incrementView: boolean = false): Promise<BlogPost | null> {
  try {
    await connectToDatabase();

    const blog = await Blog.findById(blogId).lean();
    if (!blog) return null;

    // Increment view count if requested
    if (incrementView) {
      await Blog.findByIdAndUpdate(blogId, { $inc: { views: 1 } });
    }

    return {
      id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      authorId: blog.authorId,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      featuredImage: blog.featuredImage,
      images: blog.images,
      tags: blog.tags,
      category: blog.category,
      status: blog.status,
      isPublic: blog.isPublic,
      views: incrementView ? blog.views + 1 : blog.views,
      likes: blog.likes,
      likedBy: blog.likedBy,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    };
  } catch (error) {
    console.error('Error getting blog by ID:', error);
    return null;
  }
}

// Update blog post
export async function updateBlogPost(
  blogId: string,
  updates: Partial<{
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    images: string[];
    tags: string[];
    category: string;
    status: 'draft' | 'published' | 'archived';
    isPublic: boolean;
  }>
): Promise<BlogPost | null> {
  try {
    await connectToDatabase();

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (!updatedBlog) return null;

    return {
      id: updatedBlog._id.toString(),
      title: updatedBlog.title,
      content: updatedBlog.content,
      excerpt: updatedBlog.excerpt,
      authorId: updatedBlog.authorId,
      authorName: updatedBlog.authorName,
      authorEmail: updatedBlog.authorEmail,
      featuredImage: updatedBlog.featuredImage,
      images: updatedBlog.images,
      tags: updatedBlog.tags,
      category: updatedBlog.category,
      status: updatedBlog.status,
      isPublic: updatedBlog.isPublic,
      views: updatedBlog.views,
      likes: updatedBlog.likes,
      likedBy: updatedBlog.likedBy,
      createdAt: updatedBlog.createdAt.toISOString(),
      updatedAt: updatedBlog.updatedAt.toISOString(),
      publishedAt: updatedBlog.publishedAt?.toISOString(),
    };
  } catch (error) {
    console.error('Error updating blog post:', error);
    return null;
  }
}

// Delete blog post
export async function deleteBlogPost(blogId: string, userId: string): Promise<boolean> {
  try {
    await connectToDatabase();

    const result = await Blog.findOneAndDelete({
      _id: blogId,
      authorId: userId // Only allow author to delete
    });

    return !!result;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
}

// Toggle like on blog post
export async function toggleBlogLike(blogId: string, userId: string): Promise<{ liked: boolean; likes: number } | null> {
  try {
    await connectToDatabase();

    const blog = await Blog.findById(blogId);
    if (!blog) return null;

    const isLiked = blog.likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      blog.likedBy = blog.likedBy.filter(id => id !== userId);
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      // Like
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();

    return {
      liked: !isLiked,
      likes: blog.likes
    };
  } catch (error) {
    console.error('Error toggling blog like:', error);
    return null;
  }
}

// Search blogs
export async function searchBlogs(
  query: string,
  limit: number = 20,
  skip: number = 0
): Promise<BlogPost[]> {
  try {
    await connectToDatabase();

    const blogs = await Blog.find({
      $text: { $search: query },
      status: 'published',
      isPublic: true
    })
    .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    return blogs.map(blog => ({
      id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      authorId: blog.authorId,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      featuredImage: blog.featuredImage,
      images: blog.images,
      tags: blog.tags,
      category: blog.category,
      status: blog.status,
      isPublic: blog.isPublic,
      views: blog.views,
      likes: blog.likes,
      likedBy: blog.likedBy,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Error searching blogs:', error);
    return [];
  }
}

// Get blog categories
export async function getBlogCategories(): Promise<string[]> {
  try {
    await connectToDatabase();

    const categories = await Blog.distinct('category', {
      status: 'published',
      isPublic: true
    });

    return categories.filter(cat => cat && cat.trim() !== '');
  } catch (error) {
    console.error('Error getting blog categories:', error);
    return [];
  }
}

// Get popular tags
export async function getPopularTags(limit: number = 20): Promise<string[]> {
  try {
    await connectToDatabase();

    const pipeline = [
      { $match: { status: 'published', isPublic: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', _id: 0 } }
    ];

    const result = await Blog.aggregate(pipeline);
    return result.map(item => item.tag).filter(tag => tag && tag.trim() !== '');
  } catch (error) {
    console.error('Error getting popular tags:', error);
    return [];
  }
} 