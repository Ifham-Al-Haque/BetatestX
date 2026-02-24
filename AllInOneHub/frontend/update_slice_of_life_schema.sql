-- Update Slice of Life Schema for Picture Categories and Monthly Organization
-- This script adds picture categories and improves the schema for iPhone-like organization

-- 1. Add picture_category column to event_images table
ALTER TABLE event_images 
ADD COLUMN IF NOT EXISTS picture_category VARCHAR(50) DEFAULT 'normal' 
CHECK (picture_category IN ('normal', 'event'));

-- 2. Add month_year column for easier monthly grouping
ALTER TABLE event_images 
ADD COLUMN IF NOT EXISTS month_year VARCHAR(7); -- Format: YYYY-MM

-- 3. Create a function to automatically set month_year
CREATE OR REPLACE FUNCTION set_month_year()
RETURNS TRIGGER AS $$
BEGIN
    NEW.month_year = TO_CHAR(NEW.created_at, 'YYYY-MM');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically set month_year
DROP TRIGGER IF EXISTS trigger_set_month_year ON event_images;
CREATE TRIGGER trigger_set_month_year
    BEFORE INSERT OR UPDATE ON event_images
    FOR EACH ROW
    EXECUTE FUNCTION set_month_year();

-- 5. Update existing records to have month_year
UPDATE event_images 
SET month_year = TO_CHAR(created_at, 'YYYY-MM')
WHERE month_year IS NULL;

-- 6. Create a view for monthly photo organization (iPhone-like)
CREATE OR REPLACE VIEW monthly_photos AS
SELECT 
    month_year,
    COUNT(*) as photo_count,
    MIN(created_at) as first_photo_date,
    MAX(created_at) as last_photo_date,
    ARRAY_AGG(DISTINCT picture_category) as categories,
    ARRAY_AGG(
        json_build_object(
            'id', id,
            'image_url', image_url,
            'image_name', image_name,
            'created_at', created_at,
            'picture_category', picture_category,
            'is_favorite', COALESCE(
                (SELECT COUNT(*) > 0 FROM image_favorites WHERE image_id = event_images.id), 
                false
            ),
            'likes_count', COALESCE(
                (SELECT COUNT(*) FROM image_likes WHERE image_id = event_images.id), 
                0
            )
        ) ORDER BY created_at DESC
    ) as photos
FROM event_images
GROUP BY month_year
ORDER BY month_year DESC;

-- 7. Create a view for categorized photos
CREATE OR REPLACE VIEW categorized_photos AS
SELECT 
    picture_category,
    month_year,
    COUNT(*) as photo_count,
    ARRAY_AGG(
        json_build_object(
            'id', id,
            'image_url', image_url,
            'image_name', image_name,
            'created_at', created_at,
            'is_favorite', COALESCE(
                (SELECT COUNT(*) > 0 FROM image_favorites WHERE image_id = event_images.id), 
                false
            ),
            'likes_count', COALESCE(
                (SELECT COUNT(*) FROM image_likes WHERE image_id = event_images.id), 
                0
            )
        ) ORDER BY created_at DESC
    ) as photos
FROM event_images
GROUP BY picture_category, month_year
ORDER BY month_year DESC, picture_category;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_images_picture_category ON event_images(picture_category);
CREATE INDEX IF NOT EXISTS idx_event_images_month_year ON event_images(month_year);
CREATE INDEX IF NOT EXISTS idx_event_images_category_month ON event_images(picture_category, month_year);

-- 9. Create a function to get photos by category and month
CREATE OR REPLACE FUNCTION get_photos_by_category_and_month(
    category_filter VARCHAR(50) DEFAULT NULL,
    month_filter VARCHAR(7) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    image_url TEXT,
    image_name VARCHAR(255),
    picture_category VARCHAR(50),
    month_year VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN,
    likes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ei.id,
        ei.image_url,
        ei.image_name,
        ei.picture_category,
        ei.month_year,
        ei.created_at,
        COALESCE(
            (SELECT COUNT(*) > 0 FROM image_favorites WHERE image_id = ei.id), 
            false
        ) as is_favorite,
        COALESCE(
            (SELECT COUNT(*) FROM image_likes WHERE image_id = ei.id), 
            0
        ) as likes_count
    FROM event_images ei
    WHERE 
        (category_filter IS NULL OR ei.picture_category = category_filter)
        AND (month_filter IS NULL OR ei.month_year = month_filter)
    ORDER BY ei.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create a function to get monthly photo statistics
CREATE OR REPLACE FUNCTION get_monthly_photo_stats()
RETURNS TABLE (
    month_year VARCHAR(7),
    total_photos BIGINT,
    normal_photos BIGINT,
    event_photos BIGINT,
    favorite_photos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ei.month_year,
        COUNT(*) as total_photos,
        COUNT(*) FILTER (WHERE ei.picture_category = 'normal') as normal_photos,
        COUNT(*) FILTER (WHERE ei.picture_category = 'event') as event_photos,
        COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM image_favorites WHERE image_id = ei.id
        )) as favorite_photos
    FROM event_images ei
    GROUP BY ei.month_year
    ORDER BY ei.month_year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant permissions
GRANT SELECT ON monthly_photos TO authenticated;
GRANT SELECT ON categorized_photos TO authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_category_and_month(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_photo_stats() TO authenticated;

-- 12. Add comments
COMMENT ON COLUMN event_images.picture_category IS 'Category of the picture: normal (shows in memories only) or event (shows in both events and memories)';
COMMENT ON COLUMN event_images.month_year IS 'Month and year for iPhone-like organization (YYYY-MM format)';
COMMENT ON VIEW monthly_photos IS 'iPhone-like monthly photo organization view';
COMMENT ON VIEW categorized_photos IS 'Photos organized by category and month';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Slice of Life schema updated successfully!';
    RAISE NOTICE 'Added picture categories: normal and event';
    RAISE NOTICE 'Added monthly organization (iPhone-like)';
    RAISE NOTICE 'Created views: monthly_photos, categorized_photos';
    RAISE NOTICE 'Created functions: get_photos_by_category_and_month, get_monthly_photo_stats';
END $$;
