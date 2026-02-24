import { supabase } from '../supabaseClient';

export const sliceOfLifeApi = {
  // ===== EVENTS API =====
  
  // Get all events
  async getEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          created_by_user:user_profiles!events_created_by_fkey(full_name, email)
        `)
        .order('event_date', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Get event by ID
  async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          created_by_user:user_profiles!events_created_by_fkey(full_name, email),
          images:event_images(*)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Create event
  async createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          created_by: (await supabase.auth.getUser()).data.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update event
  async updateEvent(eventId, eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event
  async deleteEvent(eventId) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // ===== MEMORIES API =====
  
  // Get all memories
  async getMemories() {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          created_by_user:user_profiles!memories_created_by_fkey(full_name, email),
          attendees:memory_attendees(*),
          images:event_images(*)
        `)
        .order('memory_date', { ascending: false });

      if (error) {
        console.error('Error fetching memories:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching memories:', error);
      return [];
    }
  },

  // Get memory by ID
  async getMemoryById(memoryId) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          created_by_user:user_profiles!memories_created_by_fkey(full_name, email),
          attendees:memory_attendees(*),
          images:event_images(*)
        `)
        .eq('id', memoryId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching memory:', error);
      throw error;
    }
  },

  // Create memory
  async createMemory(memoryData) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .insert([{
          ...memoryData,
          created_by: (await supabase.auth.getUser()).data.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  },

  // Update memory
  async updateMemory(memoryId, memoryData) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .update({
          ...memoryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  },

  // Delete memory
  async deleteMemory(memoryId) {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  },

  // Toggle memory favorite
  async toggleMemoryFavorite(memoryId) {
    try {
      const { data: memory, error: fetchError } = await supabase
        .from('memories')
        .select('is_favorite')
        .eq('id', memoryId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('memories')
        .update({ is_favorite: !memory.is_favorite })
        .eq('id', memoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling memory favorite:', error);
      throw error;
    }
  },

  // ===== IMAGE UPLOAD API =====
  
  // Upload image to Supabase Storage
  async uploadImage(file, type = 'event') {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Determine bucket based on type
      const bucket = type === 'event' ? 'event-images' : 'memory-images';

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        path: uploadData.path,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Save image metadata to database
  async saveImageMetadata(imageData, eventId = null, memoryId = null, pictureCategory = 'normal') {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_images')
        .insert([{
          event_id: eventId,
          memory_id: memoryId,
          image_url: imageData.publicUrl,
          image_name: imageData.fileName,
          image_size: imageData.fileSize,
          file_type: imageData.fileType,
          storage_path: imageData.path,
          uploaded_by: user.id,
          is_primary: false,
          picture_category: pictureCategory
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving image metadata:', error);
      throw error;
    }
  },

  // Get images for event or memory
  async getImages(eventId = null, memoryId = null) {
    try {
      let query = supabase
        .from('event_images')
        .select(`
          *,
          uploaded_by_user:user_profiles!event_images_uploaded_by_fkey(full_name, email),
          likes:image_likes(*),
          favorites:image_favorites(*)
        `);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      if (memoryId) {
        query = query.eq('memory_id', memoryId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching images:', error);
        // Return empty array instead of throwing error for better UX
        return [];
      }
      
      // Return empty array if no data
      return data || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      // Return empty array instead of throwing error
      return [];
    }
  },

  // Delete image
  async deleteImage(imageId) {
    try {
      // Get image data first
      const { data: image, error: fetchError } = await supabase
        .from('event_images')
        .select('storage_path, event_id, memory_id')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Determine bucket based on whether it's associated with event or memory
      const bucket = image.event_id ? 'event-images' : 'memory-images';

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('event_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Like/Unlike image
  async toggleImageLike(imageId) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('image_likes')
        .select('id')
        .eq('image_id', imageId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('image_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        return { liked: false };
      } else {
        // Like
        const { error } = await supabase
          .from('image_likes')
          .insert([{
            image_id: imageId,
            user_id: user.id
          }]);

        if (error) throw error;
        return { liked: true };
      }
    } catch (error) {
      console.error('Error toggling image like:', error);
      throw error;
    }
  },

  // Favorite/Unfavorite image
  async toggleImageFavorite(imageId) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Check if already favorited
      const { data: existingFavorite, error: checkError } = await supabase
        .from('image_favorites')
        .select('id')
        .eq('image_id', imageId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingFavorite) {
        // Unfavorite
        const { error } = await supabase
          .from('image_favorites')
          .delete()
          .eq('id', existingFavorite.id);

        if (error) throw error;
        return { favorited: false };
      } else {
        // Favorite
        const { error } = await supabase
          .from('image_favorites')
          .insert([{
            image_id: imageId,
            user_id: user.id
          }]);

        if (error) throw error;
        return { favorited: true };
      }
    } catch (error) {
      console.error('Error toggling image favorite:', error);
      throw error;
    }
  },

  // ===== STATISTICS API =====
  
  // Get event statistics
  async getEventStatistics() {
    try {
      const { data, error } = await supabase.rpc('get_event_statistics');
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error fetching event statistics:', error);
      throw error;
    }
  },

  // Get memory statistics
  async getMemoryStatistics() {
    try {
      const { data, error } = await supabase.rpc('get_memory_statistics');
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error fetching memory statistics:', error);
      throw error;
    }
  },

  // ===== IPHONE-LIKE PHOTO ORGANIZATION =====
  
  // Get monthly photos (iPhone-like organization)
  async getMonthlyPhotos() {
    try {
      const { data, error } = await supabase
        .from('monthly_photos')
        .select('*')
        .order('month_year', { ascending: false });

      if (error) {
        console.error('Error fetching monthly photos:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching monthly photos:', error);
      return [];
    }
  },

  // Get photos by category and month
  async getPhotosByCategoryAndMonth(categoryFilter = null, monthFilter = null) {
    try {
      const { data, error } = await supabase.rpc('get_photos_by_category_and_month', {
        category_filter: categoryFilter,
        month_filter: monthFilter
      });

      if (error) {
        console.error('Error fetching photos by category and month:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching photos by category and month:', error);
      return [];
    }
  },

  // Get monthly photo statistics
  async getMonthlyPhotoStats() {
    try {
      const { data, error } = await supabase.rpc('get_monthly_photo_stats');

      if (error) {
        console.error('Error fetching monthly photo stats:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching monthly photo stats:', error);
      return [];
    }
  },

  // Get photos for memories (normal + event category)
  async getPhotosForMemories() {
    try {
      const { data, error } = await supabase
        .from('event_images')
        .select(`
          *,
          uploaded_by_user:user_profiles!event_images_uploaded_by_fkey(full_name, email),
          likes:image_likes(*),
          favorites:image_favorites(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos for memories:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching photos for memories:', error);
      return [];
    }
  },

  // Get photos for events (event category only)
  async getPhotosForEvents() {
    try {
      const { data, error } = await supabase
        .from('event_images')
        .select(`
          *,
          uploaded_by_user:user_profiles!event_images_uploaded_by_fkey(full_name, email),
          likes:image_likes(*),
          favorites:image_favorites(*)
        `)
        .eq('picture_category', 'event')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos for events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching photos for events:', error);
      return [];
    }
  },

  // Update picture category
  async updatePictureCategory(imageId, newCategory) {
    try {
      const { data, error } = await supabase
        .from('event_images')
        .update({ picture_category: newCategory })
        .eq('id', imageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating picture category:', error);
      throw error;
    }
  }
};
