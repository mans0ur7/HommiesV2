-- ============================================================
-- Hommies demo seed: 8 roomies + 4 landlords + 8 properties
-- For app store screenshots. Run ONCE in Supabase SQL Editor.
--
-- All emails end with @demo.hommies.dk so they're easy to clean up:
--   DELETE FROM auth.users WHERE email LIKE '%@demo.hommies.dk';
-- (this cascades and deletes the profiles + properties too)
-- ============================================================

DO $$
DECLARE
  -- Landlords (must come first because properties reference them)
  l_andreas UUID := gen_random_uuid();
  l_camilla UUID := gen_random_uuid();
  l_jonas   UUID := gen_random_uuid();
  l_henrik  UUID := gen_random_uuid();

  -- Roomies
  u_sofia    UUID := gen_random_uuid();
  u_lukas    UUID := gen_random_uuid();
  u_maja     UUID := gen_random_uuid();
  u_emil     UUID := gen_random_uuid();
  u_freja    UUID := gen_random_uuid();
  u_oliver   UUID := gen_random_uuid();
  u_clara    UUID := gen_random_uuid();
  u_magnus   UUID := gen_random_uuid();

  hashed_pw TEXT := crypt('demo123!', gen_salt('bf'));
BEGIN
  -- ============================================================
  -- 1. AUTH USERS
  -- ============================================================
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
                          created_at, updated_at, instance_id, aud, role,
                          raw_app_meta_data, raw_user_meta_data)
  VALUES
    -- Landlords
    (l_andreas, 'andreas@demo.hommies.dk', hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (l_camilla, 'camilla@demo.hommies.dk', hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (l_jonas,   'jonas@demo.hommies.dk',   hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (l_henrik,  'henrik@demo.hommies.dk',  hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    -- Roomies
    (u_sofia,  'sofia@demo.hommies.dk',  hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_lukas,  'lukas@demo.hommies.dk',  hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_maja,   'maja@demo.hommies.dk',   hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_emil,   'emil@demo.hommies.dk',   hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_freja,  'freja@demo.hommies.dk',  hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_oliver, 'oliver@demo.hommies.dk', hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_clara,  'clara@demo.hommies.dk',  hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (u_magnus, 'magnus@demo.hommies.dk', hashed_pw, now(), now(), now(),
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

  -- ============================================================
  -- 2. PROFILES
  -- Avatar URLs from Unsplash (free, no auth required)
  -- ============================================================
  INSERT INTO public.profiles (user_id, name, age, gender, study, work, work_other,
                                nationality, bio, avatar_url, images, personality,
                                lifestyle, languages, monthly_budget, rental_period,
                                user_type)
  VALUES
    -- LANDLORDS
    (l_andreas, 'Andreas', 32, 'male', NULL, 'employed', 'Arkitekt hos Bjarke Ingels Group',
     'Dansk', 'Ejer en lyst lejlighed på Vesterbro. Søger en stille og ren roomie der kan værdsætte et godt designet hjem.',
     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
     ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
     ARRAY['Analytisk','Rolig','Kreativ'], ARRAY['Renlighed','Ikke-ryger','Morgenfugl'],
     ARRAY['Dansk','Engelsk','Tysk'], NULL, NULL, 'landlord'),

    (l_camilla, 'Camilla', 29, 'female', NULL, 'self-employed', 'Indretningsdesigner med eget studio',
     'Dansk', 'Min lejlighed på Frederiksberg har plads til én ekstra. Jeg er meget hjemme om aftenen og elsker hyggelige middage.',
     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
     ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
     ARRAY['Venlig','Omsorgsfuld','Social'], ARRAY['Hjemme-hygge','Vegetar','Drikker ikke'],
     ARRAY['Dansk','Engelsk','Spansk'], NULL, NULL, 'landlord'),

    (l_jonas, 'Jonas', 35, 'male', NULL, 'employed', 'Softwareudvikler hos Maersk',
     'Dansk', 'Udlejer min studio i Aarhus C mens jeg er udstationeret. Søger en ansvarlig studerende.',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
     ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
     ARRAY['Rolig','Tålmodig','Analytisk'], ARRAY['Ikke-ryger','Drikker ikke','Renlighed'],
     ARRAY['Dansk','Engelsk'], NULL, NULL, 'landlord'),

    (l_henrik, 'Henrik', 41, 'male', NULL, 'employed', 'Læge på Rigshospitalet',
     'Dansk', 'Stort hus i Odense med ledigt værelse og adgang til have. Familievenligt område.',
     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
     ARRAY['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
     ARRAY['Venlig','Tålmodig','Omsorgsfuld'], ARRAY['Ikke-ryger','Morgenfugl','Dyreelsker'],
     ARRAY['Dansk','Engelsk'], NULL, NULL, 'landlord'),

    -- ROOMIES
    (u_sofia, 'Sofia', 22, 'female', 'Medicin på Københavns Universitet', 'student', NULL,
     'Dansk', 'Andetårs medicinstuderende. Læser meget, men elsker en god film-aften i weekenden. Søger et roligt sted at bo.',
     'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
     ARRAY['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
     ARRAY['Rolig','Analytisk','Venlig'], ARRAY['Bogorm','Morgenfugl','Ikke-ryger'],
     ARRAY['Dansk','Engelsk','Fransk'], 6500, '12+', 'roomie'),

    (u_lukas, 'Lukas', 24, 'male', 'Datalogi på DTU', 'student', NULL,
     'Dansk', 'Datalog der bor og ånder kode. Søger en flatmate der respekterer min headphone-tid men også er klar på spil og pizza.',
     'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400',
     ARRAY['https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400'],
     ARRAY['Analytisk','Introvert','Kreativ'], ARRAY['Natugel','Studerende','Drikker ikke'],
     ARRAY['Dansk','Engelsk'], 5800, '6-12', 'roomie'),

    (u_maja, 'Maja', 25, 'female', 'Erhvervsøkonomi på CBS', 'student', NULL,
     'Dansk', 'CBS-studerende der elsker yoga og brunch. Søger nogle hyggelige roomies vi kan se Netflix og lave aftensmad sammen med.',
     'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
     ARRAY['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
     ARRAY['Social','Optimistisk','Eventyrlysten'], ARRAY['Fitness','Morgenfugl','Hjemme-hygge'],
     ARRAY['Dansk','Engelsk','Italiensk'], 7000, '12+', 'roomie'),

    (u_emil, 'Emil', 27, 'male', NULL, 'employed', 'Junior konsulent hos Deloitte',
     'Dansk', 'Lige flyttet til København for et nyt job. Søger et godt sted at bo og nogle nye venner.',
     'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
     ARRAY['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'],
     ARRAY['Venlig','Social','Optimistisk'], ARRAY['Fitness','Eventyrer','Ikke-ryger'],
     ARRAY['Dansk','Engelsk'], 8500, '6-12', 'roomie'),

    (u_freja, 'Freja', 21, 'female', 'Psykologi på Aarhus Universitet', 'student', NULL,
     'Dansk', 'Førsteårs psykolog der elsker bøger og en god kop te. Tager hensyn til andre og forventer det samme.',
     'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
     ARRAY['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
     ARRAY['Tålmodig','Omsorgsfuld','Introvert'], ARRAY['Bogorm','Veganer','Hjemme-hygge'],
     ARRAY['Dansk','Engelsk','Tysk'], 5200, '12+', 'roomie'),

    (u_oliver, 'Oliver', 26, 'male', NULL, 'self-employed', 'Freelance fotograf',
     'Tysk', 'Tysker der har boet i Danmark i 3 år. Rejser meget med arbejdet, søger et stabilt hjem mellem rejser.',
     'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
     ARRAY['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'],
     ARRAY['Kreativ','Eventyrlysten','Åben'], ARRAY['Eventyrer','Natugel','Ikke-ryger'],
     ARRAY['Tysk','Engelsk','Dansk'], 7500, '6-12', 'roomie'),

    (u_clara, 'Clara', 23, 'female', 'Arkitektur på KADK', 'student', NULL,
     'Dansk', 'Arkitektstuderende på 3. semester. Bygger modeller i fritiden og elsker når mit hjem ser pænt ud.',
     'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
     ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
     ARRAY['Kreativ','Tålmodig','Analytisk'], ARRAY['Renlighed','Studerende','Morgenfugl'],
     ARRAY['Dansk','Engelsk','Fransk'], 6800, '12+', 'roomie'),

    (u_magnus, 'Magnus', 28, 'male', NULL, 'employed', 'Personlig træner',
     'Dansk', 'Træner andre og elsker selv at træne. Tidlig op, tidlig i seng. Spiser sundt og laver mad fra bunden.',
     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
     ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
     ARRAY['Optimistisk','Social','Tålmodig'], ARRAY['Fitness','Atlet','Morgenfugl'],
     ARRAY['Dansk','Engelsk'], 9000, '12+', 'roomie');

  -- ============================================================
  -- 3. PROPERTIES (8 listings from the 4 landlords)
  -- ============================================================
  INSERT INTO public.properties (user_id, title, address, city, postal_code, monthly_rent,
                                  deposit, aconto, size_sqm, room_count, bathroom_count,
                                  living_area_count, description, images, amenities,
                                  is_furnished, is_published, property_type,
                                  gender_composition, max_occupants, has_kitchen,
                                  has_private_bathroom, available_from, min_stay)
  VALUES
    -- Andreas — Vesterbro studio
    (l_andreas, 'Lyst værelse i designet lejlighed på Vesterbro',
     'Vesterbrogade 142, 3. tv', 'København', '1620', 6800, 13600, 800,
     18, 2, 1, 1,
     'Stort, lyst værelse i en lejlighed der er gennemtænkt af en arkitekt. Højt til loftet, store vinduer mod gården. Fælles stue og køkken med plads til middage. 5 min til Hovedbanegården.',
     ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
           'https://images.unsplash.com/photo-1494203484021-3c454daf695d?w=1200',
           'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200'],
     ARRAY['Vaskemaskine','WiFi','Opvaskemaskine','Cykelparkering'],
     true, true, 'apartment', 'mixed', 2, true, false,
     CURRENT_DATE + INTERVAL '14 days', '12 months'),

    (l_andreas, 'Stort dobbeltværelse i delelejlighed nær Enghave Plads',
     'Sønder Boulevard 28, 2. th', 'København', '1720', 7400, 14800, 950,
     22, 3, 1, 1,
     'Møbleret værelse med plads til dobbeltseng og skrivebord. Fælles vask, opvaskemaskine, balkon mod baggården. Nær cafe, supermarked og metro.',
     ARRAY['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200',
           'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200'],
     ARRAY['Vaskemaskine','WiFi','Altan','Møbleret'],
     true, true, 'room', 'female', 3, true, false,
     CURRENT_DATE + INTERVAL '7 days', '6 months'),

    -- Camilla — Frederiksberg
    (l_camilla, 'Hyggeligt værelse på Frederiksberg med have',
     'Falkoner Allé 92, st. tv', 'Frederiksberg', '2000', 7200, 14400, 1100,
     20, 2, 1, 1,
     'Stueetagelejlighed med adgang til lille fælleshave. Roligt område med masser af træer. Min lejlighed er indrettet med planter og lyse farver — kemi vigtigere end alder.',
     ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200',
           'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200'],
     ARRAY['Have','Vaskemaskine','WiFi','Cykelparkering'],
     false, true, 'apartment', 'female', 2, true, false,
     CURRENT_DATE + INTERVAL '21 days', '12 months'),

    -- Jonas — Aarhus C
    (l_jonas, 'Studio i hjertet af Aarhus C — perfekt til studerende',
     'Mejlgade 51, 2.', 'Aarhus', '8000', 5400, 10800, 600,
     35, 1, 1, 0,
     'Hele studio til dig. Møbleret, klar til indflytning. 3 min til Strøget, 8 min cykel til AU. Perfekt til én studerende eller et roligt par.',
     ARRAY['https://images.unsplash.com/photo-1522444690501-83fc04d68f3a?w=1200',
           'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'],
     ARRAY['Møbleret','WiFi','Opvaskemaskine','Tørretumbler'],
     true, true, 'studio', 'mixed', 1, true, true,
     CURRENT_DATE + INTERVAL '10 days', '6 months'),

    (l_jonas, 'Værelse i klassisk Aarhus-andelslejlighed',
     'Mejlgade 51, 4. tv', 'Aarhus', '8000', 4900, 9800, 700,
     16, 3, 1, 1,
     'Klassisk andelslejlighed med højt til loftet og originale paneler. Du får dit eget værelse og del af fælles stue + køkken.',
     ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200'],
     ARRAY['Vaskemaskine','WiFi'],
     false, true, 'room', 'mixed', 3, true, false,
     CURRENT_DATE + INTERVAL '14 days', '12 months'),

    -- Henrik — Odense
    (l_henrik, 'Stort lyst værelse i hus med have i Odense',
     'Skovbrynet 18', 'Odense', '5230', 4200, 8400, 600,
     24, 4, 2, 2,
     'Roligt villakvarter, 12 min cykel fra SDU. Eget badeværelse, fælles stort køkken og to stuer. Have med terrasse og grill om sommeren.',
     ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
           'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
           'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'],
     ARRAY['Have','Have-terrasse','Vaskemaskine','Tørretumbler','WiFi','Parkering'],
     false, true, 'room', 'mixed', 4, true, true,
     CURRENT_DATE + INTERVAL '30 days', '12 months'),

    (l_henrik, 'Møbleret kælderværelse med egen indgang',
     'Skovbrynet 18, k.', 'Odense', '5230', 3500, 7000, 500,
     14, 1, 1, 0,
     'Kælderværelse med eget badeværelse og lille tekøkken. Privat indgang. Perfekt til en studerende der vil have ro og selvstændighed.',
     ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200',
           'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200'],
     ARRAY['Møbleret','WiFi','Tørretumbler','Have'],
     true, true, 'room', 'mixed', 1, true, true,
     CURRENT_DATE + INTERVAL '7 days', '6 months'),

    -- Andreas — extra Aalborg listing for variety
    (l_andreas, 'Værelse i ny-renoveret lejlighed i Aalborg C',
     'Vesterbro 71, 2. th', 'Aalborg', '9000', 4500, 9000, 600,
     19, 3, 1, 1,
     'Ny-renoveret lejlighed nær AAU. Lyse værelser, fælles stue med sofa og TV, opvaskemaskine i køkkenet.',
     ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200',
           'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200'],
     ARRAY['Opvaskemaskine','Vaskemaskine','WiFi','Møbleret'],
     true, true, 'apartment', 'mixed', 3, true, false,
     CURRENT_DATE + INTERVAL '14 days', '6 months');

  RAISE NOTICE 'Demo seed completed: 4 landlords + 8 roomies + 8 properties inserted.';
END $$;
