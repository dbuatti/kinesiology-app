UPDATE clients
SET email = regexp_replace(email, '\+dup-[a-f0-9]+', '')
WHERE email LIKE '%+dup-%';