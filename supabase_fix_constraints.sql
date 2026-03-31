-- This allows the webhook to identify a unique client by their email per practitioner
ALTER TABLE clients 
ADD CONSTRAINT clients_user_id_email_key UNIQUE (user_id, email);