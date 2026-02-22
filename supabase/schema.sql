-- Library Management System Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    ai_detected_category TEXT, -- AI-suggested category
    rack_letter TEXT NOT NULL, -- Auto-generated uppercase first letter of title
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    download_count INTEGER DEFAULT 0,
    qr_code_url TEXT, -- QR code for sharing
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0, -- For reading progress
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id) -- One entry per user per book
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, user_id) -- One review per user per book
);

-- Create reading_progress table
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, book_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id, page_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_rack_letter ON books(rack_letter);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_author ON books USING gin(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_approval_status ON books(approval_status);
CREATE INDEX IF NOT EXISTS idx_books_average_rating ON books(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_book_id ON downloads(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks(book_id);

-- Function to automatically set rack_letter based on title
CREATE OR REPLACE FUNCTION set_rack_letter()
RETURNS TRIGGER AS $$
BEGIN
    NEW.rack_letter := UPPER(SUBSTRING(NEW.title FROM 1 FOR 1));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update average rating when a review is added/updated/removed
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE books 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM reviews 
                WHERE book_id = NEW.book_id
            ),
            rating_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE book_id = NEW.book_id
            ),
            updated_at = NOW()
        WHERE id = NEW.book_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE books 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM reviews 
                WHERE book_id = OLD.book_id
            ),
            rating_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE book_id = OLD.book_id
            ),
            updated_at = NOW()
        WHERE id = OLD.book_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update reading progress percentage
CREATE OR REPLACE FUNCTION update_reading_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_pages > 0 THEN
        NEW.progress_percentage = (NEW.current_page::DECIMAL / NEW.total_pages::DECIMAL) * 100;
        
        -- Mark as completed if progress is 100% or more
        IF NEW.current_page >= NEW.total_pages AND NOT NEW.is_completed THEN
            NEW.is_completed = TRUE;
            NEW.completed_at = NOW();
        END IF;
    END IF;
    
    NEW.last_read_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers
CREATE TRIGGER trg_set_rack_letter
    BEFORE INSERT OR UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION set_rack_letter();

CREATE TRIGGER trg_update_book_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_book_rating();

CREATE TRIGGER trg_update_reading_progress
    BEFORE INSERT OR UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_progress();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Fiction', 'Fictional literature including novels, short stories, and poetry'),
('Non-Fiction', 'Non-fictional works including biographies, history, and science'),
('Academic', 'Educational materials and textbooks'),
('Technology', 'Books about technology, programming, and computer science'),
('Business', 'Business, management, and entrepreneurship books'),
('Self-Help', 'Personal development and self-improvement books'),
('Other', 'Books that don''t fit in other categories')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for books table (updated for approval system)
CREATE POLICY "Anyone can view approved books" ON books
    FOR SELECT USING (approval_status = 'approved');

CREATE POLICY "Users can view their own pending books" ON books
    FOR SELECT USING (uploaded_by = auth.uid() AND approval_status = 'pending');

CREATE POLICY "Admins can view all books" ON books
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Students can upload books (pending approval)" ON books
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own pending books" ON books
    FOR UPDATE USING (uploaded_by = auth.uid() AND approval_status = 'pending');

CREATE POLICY "Admins can approve/reject books" ON books
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete any book" ON books
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can delete their own pending books" ON books
    FOR DELETE USING (uploaded_by = auth.uid() AND approval_status = 'pending');

-- RLS Policies for reviews table
CREATE POLICY "Anyone can view approved book reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = reviews.book_id 
            AND books.approval_status = 'approved'
        )
    );

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for reading_progress table
CREATE POLICY "Users can manage their own reading progress" ON reading_progress
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for bookmarks table
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for downloads table
CREATE POLICY "Users can view their own downloads" ON downloads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own downloads" ON downloads
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own downloads" ON downloads
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own downloads" ON downloads
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for categories table
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Storage bucket for book files
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view book files" ON storage.objects
    FOR SELECT USING (bucket_id = 'books');

CREATE POLICY "Authenticated users can upload book files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'books' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own book files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'books' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can delete any book file" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'books' AND 
        auth.jwt() ->> 'role' = 'admin'
    );
