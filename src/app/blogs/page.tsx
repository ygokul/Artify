'use client';

import React, { useState, useEffect } from 'react';
import { useBlog } from '@/context/blog-context';
import { useAuth } from '@/context/auth-context';
import { useArtworks } from '@/context/artworks-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  PenTool, 
  Search, 
  Heart, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  Folder,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Save,
  Send
} from 'lucide-react';

export default function BlogsPage() {
  const { currentUser } = useAuth();
  const { artworks } = useArtworks();
  const {
    blogs,
    userBlogs,
    categories,
    tags,
    isLoading,
    loadPublicBlogs,
    loadUserBlogs,
    loadCategories,
    loadTags,
    createBlog,
    updateBlog,
    deleteBlog,
    toggleLike,
    searchBlogs,
    getBlog
  } = useBlog();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Blog creation/editing state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    tags: [] as string[],
    featuredImage: '',
    images: [] as string[],
    status: 'draft' as 'draft' | 'published',
    isPublic: true
  });
  const [newTag, setNewTag] = useState('');
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Blog viewing state
  const [viewingBlog, setViewingBlog] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadPublicBlogs();
    loadCategories();
    loadTags();
    if (currentUser) {
      loadUserBlogs();
    }
  }, [currentUser]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const results = await searchBlogs(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Handle category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    loadPublicBlogs(category === 'all' ? undefined : category);
  };

  // Reset blog form
  const resetBlogForm = () => {
    setBlogForm({
      title: '',
      content: '',
      excerpt: '',
      category: 'general',
      tags: [],
      featuredImage: '',
      images: [],
      status: 'draft',
      isPublic: true
    });
    setEditingBlog(null);
  };

  // Handle blog creation/update
  const handleSaveBlog = async () => {
    if (!blogForm.title || !blogForm.content) {
      console.error('Missing required fields:', { title: blogForm.title, content: blogForm.content });
      return;
    }

    console.log('Saving blog with form data:', blogForm);

    let result;
    if (editingBlog) {
      console.log('Updating existing blog:', editingBlog.id);
      result = await updateBlog(editingBlog.id, blogForm);
    } else {
      console.log('Creating new blog');
      result = await createBlog(blogForm);
    }

    console.log('Blog save result:', result);

    if (result) {
      resetBlogForm();
      setIsCreateDialogOpen(false);
      if (currentUser) {
        loadUserBlogs();
      }
      if (blogForm.status === 'published') {
        loadPublicBlogs();
      }
    } else {
      console.error('Failed to save blog - no result returned');
    }
  };

  // Handle edit blog
  const handleEditBlog = (blog: any) => {
    setBlogForm({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: blog.tags,
      featuredImage: blog.featuredImage || '',
      images: blog.images,
      status: blog.status,
      isPublic: blog.isPublic
    });
    setEditingBlog(blog);
    setIsCreateDialogOpen(true);
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !blogForm.tags.includes(newTag.trim().toLowerCase())) {
      setBlogForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setBlogForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Add image from gallery
  const addImageToContent = (imageUrl: string) => {
    setBlogForm(prev => ({
      ...prev,
      content: prev.content + `\n\n![Image](${imageUrl})\n\n`,
      images: [...prev.images.filter(img => img !== imageUrl), imageUrl]
    }));
    setShowImageGallery(false);
  };

  // Set featured image
  const setFeaturedImage = (imageUrl: string) => {
    setBlogForm(prev => ({
      ...prev,
      featuredImage: imageUrl
    }));
    setShowImageGallery(false);
  };

  // View full blog
  const handleViewBlog = async (blog: any) => {
    const fullBlog = await getBlog(blog.id, true); // Increment view count
    if (fullBlog) {
      setViewingBlog(fullBlog);
      setIsViewDialogOpen(true);
    }
  };

  // Render blog content with images
  const renderBlogContent = (content: string) => {
    // Split content by markdown image syntax ![alt](url)
    const parts = content.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
    const elements = [];
    
    for (let i = 0; i < parts.length; i += 3) {
      // Add text content
      if (parts[i]) {
        elements.push(
          <div key={`text-${i}`} className="whitespace-pre-wrap mb-4">
            {parts[i]}
          </div>
        );
      }
      
      // Add image if exists
      if (parts[i + 1] !== undefined && parts[i + 2]) {
        elements.push(
          <div key={`image-${i}`} className="mb-4">
            <img 
              src={parts[i + 2]} 
              alt={parts[i + 1] || 'Blog image'}
              className="w-full max-w-2xl mx-auto rounded-md shadow-sm"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            {parts[i + 1] && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {parts[i + 1]}
              </p>
            )}
          </div>
        );
      }
    }
    
    return elements.length > 0 ? elements : (
      <div className="whitespace-pre-wrap">{content}</div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Blog card component
  const BlogCard = ({ blog, isUserBlog = false }: { blog: any, isUserBlog?: boolean }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{blog.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {blog.authorName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(blog.publishedAt || blog.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {blog.views}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {blog.likes}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{blog.category}</Badge>
              <Badge variant={blog.status === 'published' ? 'default' : 'outline'}>
                {blog.status}
              </Badge>
            </div>
          </div>
          {isUserBlog && currentUser?.id === blog.authorId && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEditBlog(blog)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => deleteBlog(blog.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {blog.featuredImage && (
          <img 
            src={blog.featuredImage} 
            alt={blog.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <p className="text-muted-foreground mb-4">{blog.excerpt}</p>
        
        {/* Show content preview with images if no excerpt */}
        {!blog.excerpt && blog.content && (
          <div className="text-muted-foreground mb-4">
            <div 
              className="overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis'
              }}
            >
              {blog.content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[Image: $1]').substring(0, 200)}
              {blog.content.length > 200 && '...'}
            </div>
          </div>
        )}
        
        {/* Show image count if blog has images */}
        {blog.images && blog.images.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <ImageIcon className="h-3 w-3" />
            {blog.images.length} image{blog.images.length !== 1 ? 's' : ''}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mb-4">
          {blog.tags.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-2 w-2 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => handleViewBlog(blog)}>
            Read More
          </Button>
          {currentUser && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toggleLike(blog.id)}
              className={blog.likedBy.includes(currentUser.id) ? 'text-red-500' : ''}
            >
              <Heart className="h-4 w-4 mr-1" />
              {blog.likes}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        {currentUser && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetBlogForm}>
                <PenTool className="h-4 w-4 mr-2" />
                Write Blog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Title */}
                <Input
                  placeholder="Blog title..."
                  value={blogForm.title}
                  onChange={(e) => setBlogForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold"
                />

                {/* Category and Status */}
                <div className="flex gap-4">
                  <Select 
                    value={blogForm.category} 
                    onValueChange={(value) => setBlogForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="inspiration">Inspiration</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={blogForm.status} 
                    onValueChange={(value: 'draft' | 'published') => setBlogForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Publish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1"
                    />
                    <Button onClick={addTag} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {blogForm.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Featured Image</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Featured image URL..."
                      value={blogForm.featuredImage}
                      onChange={(e) => setBlogForm(prev => ({ ...prev, featuredImage: e.target.value }))}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowImageGallery(true)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Gallery
                    </Button>
                  </div>
                  {blogForm.featuredImage && (
                    <img 
                      src={blogForm.featuredImage} 
                      alt="Featured" 
                      className="w-full h-32 object-cover rounded-md mt-2"
                    />
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Content</label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowImageGallery(true)}
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Add Image
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Write your blog content here..."
                    value={blogForm.content}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[300px]"
                  />
                </div>

                {/* Excerpt */}
                <Textarea
                  placeholder="Brief excerpt (optional)..."
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="h-20"
                />

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBlog} disabled={!blogForm.title || !blogForm.content}>
                    {blogForm.status === 'published' ? (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Publish
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Image Gallery Dialog */}
      {showImageGallery && (
        <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Select Image from Gallery</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="grid grid-cols-3 gap-4">
                {artworks.map(artwork => (
                  <div key={artwork.id} className="relative group">
                    <img 
                      src={artwork.imageUrl} 
                      alt={artwork.title}
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-75"
                      onClick={() => addImageToContent(artwork.imageUrl)}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                      <Button 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => addImageToContent(artwork.imageUrl)}
                      >
                        Insert
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="flex-1 text-xs"
                        onClick={() => setFeaturedImage(artwork.imageUrl)}
                      >
                        Feature
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Full Blog View Dialog */}
      {viewingBlog && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-4">{viewingBlog.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {viewingBlog.authorName}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(viewingBlog.publishedAt || viewingBlog.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {viewingBlog.views} views
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {viewingBlog.likes} likes
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{viewingBlog.category}</Badge>
                {viewingBlog.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Featured Image */}
              {viewingBlog.featuredImage && (
                <div className="mb-6">
                  <img 
                    src={viewingBlog.featuredImage} 
                    alt={viewingBlog.title}
                    className="w-full max-h-96 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}
              
              {/* Blog Content with Images */}
              <div className="prose prose-lg max-w-none">
                {renderBlogContent(viewingBlog.content)}
              </div>
              
              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex gap-2">
                  {currentUser && (
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleLike(viewingBlog.id)}
                      className={viewingBlog.likedBy.includes(currentUser.id) ? 'text-red-500' : ''}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {viewingBlog.likes}
                    </Button>
                  )}
                </div>
                
                {currentUser?.id === viewingBlog.authorId && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        handleEditBlog(viewingBlog);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        deleteBlog(viewingBlog.id);
                        setIsViewDialogOpen(false);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Content */}
      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="public">Public Blogs</TabsTrigger>
          {currentUser && <TabsTrigger value="my-blogs">My Blogs</TabsTrigger>}
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Public Blogs Tab */}
        <TabsContent value="public" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    <Folder className="h-3 w-3 mr-2 inline" />
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Blog List */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading blogs...</div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No blogs found. Be the first to write one!
              </div>
            ) : (
              blogs.map(blog => (
                <BlogCard key={blog.id} blog={blog} />
              ))
            )}
          </div>
        </TabsContent>

        {/* My Blogs Tab */}
        {currentUser && (
          <TabsContent value="my-blogs" className="space-y-4">
            <div className="grid gap-4">
              {userBlogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't written any blogs yet. Start writing!
                </div>
              ) : (
                userBlogs.map(blog => (
                  <BlogCard key={blog.id} blog={blog} isUserBlog={true} />
                ))
              )}
            </div>
          </TabsContent>
        )}

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-4">
              {searchResults.map(blog => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 