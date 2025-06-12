const Blog = require('../models/Blog');
const User = require('../models/User');
const slugify = require('slugify');

// Create new blog post
exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags } = req.body;
    const author = req.user.id;

    // Create slug from title
    const slug = slugify(title, { lower: true, strict: true });

    const post = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author,
      tags
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar post.'
    });
  }
};

// Get all published posts
exports.getPublishedPosts = async (req, res) => {
  try {
    const posts = await Blog.find({ status: 'published' })
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching published posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar posts.'
    });
  }
};

// Get all posts (admin only)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Blog.find()
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar posts.'
    });
  }
};

// Get single post by slug
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Blog.findOne({ slug })
      .populate('author', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar post.'
    });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, coverImage, tags, status } = req.body;

    // Create new slug if title changed
    const updateData = {
      ...req.body,
      ...(title && { slug: slugify(title, { lower: true, strict: true }) })
    };

    const post = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar post.'
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Blog.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir post.'
    });
  }
}; 