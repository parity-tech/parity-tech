-- ============================================
-- COMPLIANCE MODULE - Apenas Storage Bucket
-- ============================================

-- Storage bucket para learning content
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-content', 'learning-content', false)
ON CONFLICT (id) DO NOTHING;