'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

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

interface BlogContextType {
  // State
  blogs: BlogPost[];
  userBlogs: BlogPost[];
  currentBlog: BlogPost | null;
  categories: string[];
  tags: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createBlog: (blogData: {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    images?: string[];
    tags?: string[];
    category?: string;
    status?: 'draft' | 'published';
    isPublic?: boolean;
  }) => Promise<BlogPost | null>;
  
  updateBlog: (blogId: string, updates: Partial<BlogPost>) => Promise<BlogPost | null>;
  deleteBlog: (blogId: string) => Promise<boolean>;
  getBlog: (blogId: string, incrementView?: boolean) => Promise<BlogPost | null>;
  toggleLike: (blogId: string) => Promise<{ liked: boolean; likes: number } | null>;
  
  // Data fetching
  loadPublicBlogs: (category?: string, tags?: string[], limit?: number, skip?: number) => Promise<void>;
  loadUserBlogs: () => Promise<void>;
  searchBlogs: (query: string, limit?: number, skip?: number) => Promise<BlogPost[]>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  
  // Utilities
  setCurrentBlog: (blog: BlogPost | null) => void;
  clearError: () => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider = ({ children }: { children: ReactNode }) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [userBlogs, setUserBlogs] = useState<BlogPost[]>([]);
  const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create a new blog post
  const createBlog = useCallback(async (blogData: {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    images?: string[];
    tags?: string[];
    category?: string;
    status?: 'draft' | 'published';
    isPublic?: boolean;
  }): Promise<BlogPost | null> => {
    if (!currentUser) {
      setError('You must be logged in to create a blog post');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Creating blog with data:', {
        ...blogData,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
      });

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blogData,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
        }),
      });

      console.log('Blog creation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const newBlog = data.blog;
        
        console.log('Blog created successfully:', newBlog);
        
        // Add to user blogs
        setUserBlogs(prev => [newBlog, ...prev]);
        
        // If published, add to public blogs
        if (newBlog.status === 'published' && newBlog.isPublic) {
          setBlogs(prev => [newBlog, ...prev]);
        }
        
        toast({
          title: "Blog Created!",
          description: `"${newBlog.title}" has been ${newBlog.status === 'published' ? 'published' : 'saved as draft'}`,
        });
        
        return newBlog;
      } else {
        const errorData = await response.json();
        console.error('Blog creation error response:', errorData);
        throw new Error(errorData.error || 'Failed to create blog post');
      }
    } catch (error) {
      console.error('Blog creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create blog post';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  // Update blog post
  const updateBlog = useCallback(async (
    blogId: string, 
    updates: Partial<BlogPost>
  ): Promise<BlogPost | null> => {
    if (!currentUser) {
      setError('You must be logged in to update a blog post');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId: currentUser.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedBlog = data.blog;
        
        // Update in user blogs
        setUserBlogs(prev => prev.map(blog => blog.id === blogId ? updatedBlog : blog));
        
        // Update in public blogs if applicable
        setBlogs(prev => prev.map(blog => blog.id === blogId ? updatedBlog : blog));
        
        // Update current blog if it's the one being edited
        if (currentBlog?.id === blogId) {
          setCurrentBlog(updatedBlog);
        }
        
        toast({
          title: "Blog Updated!",
          description: `"${updatedBlog.title}" has been updated`,
        });
        
        return updatedBlog;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update blog post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update blog post';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentBlog, toast]);

  // Delete blog post
  const deleteBlog = useCallback(async (blogId: string): Promise<boolean> => {
    if (!currentUser) {
      setError('You must be logged in to delete a blog post');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blogs/${blogId}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from all lists
        setUserBlogs(prev => prev.filter(blog => blog.id !== blogId));
        setBlogs(prev => prev.filter(blog => blog.id !== blogId));
        
        // Clear current blog if it's the one being deleted
        if (currentBlog?.id === blogId) {
          setCurrentBlog(null);
        }
        
        toast({
          title: "Blog Deleted",
          description: "Blog post has been deleted successfully",
        });
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete blog post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete blog post';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentBlog, toast]);

  // Get blog by ID
  const getBlog = useCallback(async (
    blogId: string, 
    incrementView: boolean = false
  ): Promise<BlogPost | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blogs/${blogId}${incrementView ? '?view=true' : ''}`);

      if (response.ok) {
        const data = await response.json();
        return data.blog;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get blog post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get blog post';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle like on blog
  const toggleLike = useCallback(async (
    blogId: string
  ): Promise<{ liked: boolean; likes: number } | null> => {
    if (!currentUser) {
      setError('You must be logged in to like a blog post');
      return null;
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-like', userId: currentUser.id }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the blog in all lists
        const updateBlogInList = (blog: BlogPost) => {
          if (blog.id === blogId) {
            return {
              ...blog,
              likes: data.likes,
              likedBy: data.liked 
                ? [...blog.likedBy.filter(id => id !== currentUser.id), currentUser.id]
                : blog.likedBy.filter(id => id !== currentUser.id)
            };
          }
          return blog;
        };
        
        setBlogs(prev => prev.map(updateBlogInList));
        setUserBlogs(prev => prev.map(updateBlogInList));
        
        if (currentBlog?.id === blogId) {
          setCurrentBlog(prev => prev ? updateBlogInList(prev) : null);
        }
        
        return { liked: data.liked, likes: data.likes };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle like');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle like';
      setError(errorMessage);
      return null;
    }
  }, [currentUser, currentBlog]);

  // Load public blogs
  const loadPublicBlogs = useCallback(async (
    category?: string,
    tags?: string[],
    limit: number = 20,
    skip: number = 0
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tags && tags.length > 0) params.append('tags', tags.join(','));
      params.append('limit', limit.toString());
      params.append('skip', skip.toString());

      const response = await fetch(`/api/blogs?${params}`);

      if (response.ok) {
        const data = await response.json();
        if (skip === 0) {
          setBlogs(data.blogs);
        } else {
          setBlogs(prev => [...prev, ...data.blogs]);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load blogs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load blogs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user's blogs
  const loadUserBlogs = useCallback(async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blogs?action=user-blogs&userId=${currentUser.id}`);

      if (response.ok) {
        const data = await response.json();
        setUserBlogs(data.blogs);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load user blogs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user blogs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Search blogs
  const searchBlogs = useCallback(async (
    query: string,
    limit: number = 20,
    skip: number = 0
  ): Promise<BlogPost[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('action', 'search');
      params.append('search', query);
      params.append('limit', limit.toString());
      params.append('skip', skip.toString());

      const response = await fetch(`/api/blogs?${params}`);

      if (response.ok) {
        const data = await response.json();
        return data.blogs;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search blogs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search blogs';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/blogs?action=categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      const response = await fetch('/api/blogs?action=tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  return (
    <BlogContext.Provider
      value={{
        // State
        blogs,
        userBlogs,
        currentBlog,
        categories,
        tags,
        isLoading,
        error,
        
        // Actions
        createBlog,
        updateBlog,
        deleteBlog,
        getBlog,
        toggleLike,
        
        // Data fetching
        loadPublicBlogs,
        loadUserBlogs,
        searchBlogs,
        loadCategories,
        loadTags,
        
        // Utilities
        setCurrentBlog,
        clearError,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = (): BlogContextType => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}; 