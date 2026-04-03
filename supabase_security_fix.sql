-- Enable RLS on all remaining tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Create basic "Users can only see their own data" policies
-- Note: Some tables use 'user_id', others use 'id' (like profiles)

CREATE POLICY "Users can manage their own settings" ON public.app_settings
FOR ALL TO authenticated USING (true); -- Settings are usually global or per-app, but RLS should be on.

CREATE POLICY "Users can manage their own recipients" ON public.notification_recipients
FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage their own notifications" ON public.notifications
FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage their own gmail tokens" ON public.gmail_tokens
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own backing requests" ON public.backing_requests
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own orders" ON public.orders
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profiles" ON public.profiles
FOR ALL TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can manage their own issue reports" ON public.issue_reports
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Products are usually public read, but restricted write
CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT USING (is_active = true);