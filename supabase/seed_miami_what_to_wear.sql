-- Miami What to Wear — uses jsonb_build_object() to avoid line-wrapping issues

-- The Setai
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Loro Piana', 'Kiton', 'Rolex', 'Vilebrequin'),
    'outfit', jsonb_build_object(
      'top', 'Unstructured linen or silk-linen blazer in ivory or stone, open-collar linen shirt underneath',
      'bottom', 'Slim linen trousers in white or bone, perfectly pressed',
      'shoes', 'White leather loafers or tan suede drivers — no socks, obviously',
      'bag', 'Nothing, or a slim leather card holder slipped into a pocket',
      'accessories', 'Rolex Submariner or Daytona, light tan from actual sun'
    ),
    'color_palette', 'Ivory, stone, white, pale sand — the palette of someone who irons their linen and means it',
    'budget_dupe', 'Uniqlo linen trousers + H&M linen shirt in white. Key is fit and pressing. One pair of clean leather loafers does the rest. The Setai is dark enough at night that nobody checks the label.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('The Row', 'Zimmermann', 'Loro Piana', 'Aquazzura'),
    'outfit', jsonb_build_object(
      'top', 'Silk slip top or a fine-rib knit in ivory — nothing fussy, nothing with embellishment',
      'bottom', 'Wide-leg white linen trousers or a silk bias-cut midi skirt',
      'shoes', 'Strappy flat sandal in nude leather or a clean pointed-toe mule',
      'bag', 'Loro Piana bucket bag or The Row bourse — something that costs more than it looks',
      'accessories', 'Small gold hoops, one thin gold chain, a light tan that is clearly not from a bottle'
    ),
    'color_palette', 'White, ivory, pale gold, warm sand — resort wear executed with the precision of ready-to-wear',
    'budget_dupe', 'Massimo Dutti linen trousers, a clean slip top from COS, a single good sandal. The trick is all-white or all-ivory — anything mixed breaks the Setai spell.'
  )
)
WHERE name = 'The Setai' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Faena Hotel
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Saint Laurent', 'Tom Ford', 'Cartier', 'Christian Louboutin'),
    'outfit', jsonb_build_object(
      'top', 'A well-cut dark blazer over a white or black silk shirt — the Tom Ford approach, entirely intentional',
      'bottom', 'Black slim trousers or very dark navy. No wrinkles, no excuses.',
      'shoes', 'Black leather Chelsea boots or a sleek patent loafer — Louboutin if you have them',
      'bag', 'Black leather tote or nothing',
      'accessories', 'Something gold and significant on the wrist, a single ring, black sunglasses past sundown'
    ),
    'color_palette', 'Black, white, deep gold — the palette of a place that has a gilded mammoth and thinks it''s normal',
    'budget_dupe', 'All-black ZARA tailoring done seriously. One gold watch, real or not, changes everything at the Faena. The room is about commitment, not labels.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Versace', 'Johanna Ortiz', 'Bottega Veneta', 'Bulgari'),
    'outfit', jsonb_build_object(
      'top', 'A draped silk top or a statement blouse — something with movement, something that photographs well',
      'bottom', 'Wide-leg silk trousers or a floor-length skirt in a rich colour — emerald, cobalt, deep coral',
      'shoes', 'Heeled mule or strappy sandal in gold, nude, or matching the outfit',
      'bag', 'Something sculptural — Bottega Veneta Sardine or a vintage beaded clutch',
      'accessories', 'Statement earrings, layered gold chains, one bold ring — the Faena rewards jewellery'
    ),
    'color_palette', 'Deep coral, emerald, cobalt, gold — the colour palette of the hotel itself. You''re part of the installation.',
    'budget_dupe', 'ZARA and Mango do excellent versions of the draped silk moment. One statement earring from a good costume jewellery brand reads fine. The colours matter more than the labels here.'
  )
)
WHERE name = 'Faena Hotel' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Vizcaya Museum & Gardens
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Brunello Cucinelli', 'Loro Piana', 'Patek Philippe', 'Tod''s'),
    'outfit', jsonb_build_object(
      'top', 'Lightweight linen or seersucker blazer in pale blue or stone, open-collar shirt',
      'bottom', 'Cream or sand chino, no break, no crease — this is outdoors but it''s Vizcaya',
      'shoes', 'Tan or white leather loafers, no socks — Tod''s Gommino if possible',
      'bag', 'Nothing, or a slim woven tote in natural fibre',
      'accessories', 'Patek Philippe or a vintage dress watch on a leather strap, Panama hat strongly encouraged'
    ),
    'color_palette', 'Sand, pale blue, cream, warm stone — someone who summers in Positano and doesn''t feel the need to mention it',
    'budget_dupe', 'Linen blazer from H&M Premium or Massimo Dutti. Clean chino from Uniqlo. The Panama hat costs $30 and raises the entire outfit.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Zimmermann', 'Ulla Johnson', 'Cartier', 'Ancient Greek Sandals'),
    'outfit', jsonb_build_object(
      'top', 'A floral or broderie anglaise midi dress by Zimmermann or Ulla Johnson — or a well-chosen vintage equivalent',
      'bottom', 'Part of the dress',
      'shoes', 'Leather flat sandal or a kitten-heel mule in tan — the cobblestones will settle the heels debate',
      'bag', 'Woven straw or raffia bag in natural, tan, or cream — practical and correct for the setting',
      'accessories', 'Gold hoop earrings, a thin gold bracelet or two, tortoiseshell sunglasses'
    ),
    'color_palette', 'Floral, ivory, botanical green, warm gold — the gardens are the backdrop; dress to be part of them',
    'budget_dupe', 'Free People and & Other Stories both do the garden-party dress well at a third of Zimmermann''s price. A good straw bag from any market completes it.'
  )
)
WHERE name = 'Vizcaya Museum & Gardens' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Pérez Art Museum Miami
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('A.P.C.', 'Norse Projects', 'Common Projects', 'New Balance'),
    'outfit', jsonb_build_object(
      'top', 'Clean crewneck in white, off-white, or stone — or a soft shirt in chambray or pale olive',
      'bottom', 'Dark slim chino or well-cut dark jeans, no distressing',
      'shoes', 'White leather sneakers — Common Projects or a clean dupe — the PAMM is a sneaker institution',
      'bag', 'Canvas tote with something in it, or a slim leather backpack',
      'accessories', 'Minimal — thin watch, no visible branding, small gold ring optional'
    ),
    'color_palette', 'White, stone, pale olive, dark navy — the palette of someone who knows which floor to start on',
    'budget_dupe', 'COS does the clean intellectual-casual thing extremely well. White New Balance 550. A good canvas tote. The PAMM is genuinely casual — the only flex is the knowledge.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Toteme', 'A.P.C.', 'Celine', 'Veja'),
    'outfit', jsonb_build_object(
      'top', 'A clean white or ivory linen shirt or soft crew-neck tee — nothing fussy',
      'bottom', 'Wide-leg jeans or linen trousers in ecru or dark navy',
      'shoes', 'Clean white sneakers or leather sandals — Veja or equivalent',
      'bag', 'Canvas or leather tote, something that can carry the catalogue you''ll buy',
      'accessories', 'Small gold hoops, thin bracelets, nothing that competes with the art'
    ),
    'color_palette', 'White, ivory, ecru, denim — clean, editorial, Miami-casual with Parisian discipline',
    'budget_dupe', 'Uniqlo linen + a clean sneaker + a good tote. The PAMM is a great equaliser — what you know matters far more than what you wear.'
  )
)
WHERE name = 'Pérez Art Museum Miami' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Bal Harbour Shops
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Hermès', 'Loro Piana', 'Brunello Cucinelli', 'Rolex'),
    'outfit', jsonb_build_object(
      'top', 'Loro Piana silk-linen polo in pale blue or ivory — the Bal Harbour polo is its own category',
      'bottom', 'White or cream linen trousers, loose but not sloppy',
      'shoes', 'Driving loafer in tan or white leather — Hermès if you''re going the full route',
      'bag', 'An Hermès shopping bag you already have, or nothing at all',
      'accessories', 'Rolex Daytona or GMT-Master — the clothes do the work, the watch confirms it'
    ),
    'color_palette', 'White, ivory, pale blue, tan — the palette of someone who has no reason to try hard and does anyway',
    'budget_dupe', 'Uniqlo linen in white, clean loafers from Massimo Dutti, a light tan. The point is to look like you belong among the gardenia trees. You do.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Chanel', 'Hermès', 'The Row', 'Manolo Blahnik'),
    'outfit', jsonb_build_object(
      'top', 'Chanel tweed jacket (if you have it) or a well-structured linen blazer in cream or pale pink',
      'bottom', 'White linen wide-leg trousers or a pleated midi skirt in champagne',
      'shoes', 'Pointed-toe kitten heel or a clean flat sandal in nude leather',
      'bag', 'This is the correct location for a Birkin or Kelly. If not, a clean structured bag in tan or white.',
      'accessories', 'Gold chain necklace, small earrings, sunglasses that cost more than your last haircut'
    ),
    'color_palette', 'Cream, champagne, pale pink, white — expensive pastels in sunlight',
    'budget_dupe', 'A well-cut linen set from Zara in white + one good bag (real or secondhand) + a great sunglasses frame. The walk outside is where you''re seen.'
  )
)
WHERE name = 'Bal Harbour Shops' AND city_id = '11111111-0000-0000-0000-000000000003';

-- The Surf Club Restaurant
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Kiton', 'Brioni', 'Patek Philippe', 'John Lobb'),
    'outfit', jsonb_build_object(
      'top', 'A proper sport coat — navy or mid-grey — over a fine-cotton open-collar shirt. Do not wear a guayabera.',
      'bottom', 'Pressed trousers in charcoal or tan — full break acceptable, this is an older room',
      'shoes', 'Cap-toe Oxford or a serious loafer in cognac or black leather, polished',
      'bag', 'Nothing',
      'accessories', 'Patek Philippe Calatrava or vintage Nautilus — nothing sportier than this room'
    ),
    'color_palette', 'Navy, charcoal, white, cognac — the palette of someone who dresses for dinner and means it, even in Miami',
    'budget_dupe', 'A good secondhand sport coat from SuitSupply or a thrifted Canali, pressed chinos, Church''s shoes from The RealReal. The Surf Club notices when you try.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Carolina Herrera', 'Oscar de la Renta', 'Van Cleef & Arpels', 'Aquazzura'),
    'outfit', jsonb_build_object(
      'top', 'A silk blouse in ivory or pale champagne, or a structured crepe top with subtle ruching',
      'bottom', 'Wide-leg silk or crepe trousers in champagne or deep navy, or a silk midi skirt',
      'shoes', 'Block-heel slingback or a pointed-toe heel — the room expects it',
      'bag', 'Structured top-handle bag in tan, black, or white leather — nothing casual, nothing with chain',
      'accessories', 'Pearl earrings or something gold and classical, a thin bracelet or wrist cuff'
    ),
    'color_palette', 'Champagne, ivory, deep navy, pale gold — cocktail-hour elegance in a room that has been elegant since Eisenhower',
    'budget_dupe', 'A well-chosen vintage silk blouse, Banana Republic wide-leg trousers pressed carefully, and a serious shoe. The Surf Club is the correct place in Miami to dress up.'
  )
)
WHERE name = 'The Surf Club Restaurant' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Soho Beach House
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Frescobol Carioca', 'Vilebrequin', 'Oliver Peoples', 'Birkenstock'),
    'outfit', jsonb_build_object(
      'top', 'A linen shirt in a muted stripe or plain ecru, worn open over swim trunks by the pool',
      'bottom', 'Quality swim shorts — Vilebrequin or Frescobol — not board shorts, never board shorts',
      'shoes', 'Rubber sandal or canvas espadrille by day, clean loafer by evening',
      'bag', 'A canvas or mesh tote — something that can hold sunscreen and a book',
      'accessories', 'Oliver Peoples sunglasses, a simple sports watch or no watch, lightly tanned'
    ),
    'color_palette', 'Ecru, navy stripe, faded coral — the palette of someone who packed for a weekend but stays for the week',
    'budget_dupe', 'H&M Premium linen shirt in ecru, Uniqlo seersucker swim shorts, Birkenstock Arizonas. Soho Beach House is the most forgiving destination — the pool equalises everyone.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Zimmermann', 'Hunza G', 'Ulla Johnson', 'Loewe'),
    'outfit', jsonb_build_object(
      'top', 'A Hunza G one-piece or a well-chosen bikini top covered by a crochet or linen cover-up — nothing synthetic',
      'bottom', 'The cover-up is the outfit by the pool; for the restaurant, a midi dress in botanical print or solid linen',
      'shoes', 'Leather flat sandal or a woven espadrille wedge',
      'bag', 'Woven raffia or canvas tote with actual things in it — book, sunscreen, one nice thing',
      'accessories', 'Gold anklet, hair up, Oliver Peoples sunglasses worn all day'
    ),
    'color_palette', 'Botanical print, ivory, warm coral, natural sand — resort dressing that happened to have good taste',
    'budget_dupe', 'ASOS does perfectly adequate versions of the crochet cover-up and linen dress. The Soho Beach House doesn''t inspect your swimwear label — it inspects whether you look relaxed.'
  )
)
WHERE name = 'Soho Beach House' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Swan Miami
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Amiri', 'Fear of God Essentials', 'Chrome Hearts', 'Audemars Piguet'),
    'outfit', jsonb_build_object(
      'top', 'An excellent white T-shirt — the Fear of God kind, not the Hanes kind — under a relaxed blazer',
      'bottom', 'Dark straight-leg jeans or light-wash Japanese selvedge — no distressing',
      'shoes', 'Clean white leather sneakers or a suede loafer — nothing with a logo on the side',
      'bag', 'No bag or a very slim leather card holder',
      'accessories', 'AP Royal Oak or Nautilus, a chain necklace if you''re doing the aesthetic, rings optional'
    ),
    'color_palette', 'White, dark indigo, sand, black — the palette of someone who gets mentioned in style coverage without trying',
    'budget_dupe', 'An excellent white T-shirt from COS or MUJI under a secondhand blazer. Dark Uniqlo jeans. A clean leather strap on a vintage watch reads fine from across the room.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Bottega Veneta', 'Jacquemus', 'The Row', 'Jennifer Fisher'),
    'outfit', jsonb_build_object(
      'top', 'A structured blazer worn as a top over wide-leg trousers, or a Jacquemus-style minimal dress in ivory or stone',
      'bottom', 'Part of the co-ord or a silk wide-leg trouser in champagne or camel',
      'shoes', 'Pointed-toe flat mule in camel or a simple strappy heel',
      'bag', 'Bottega Veneta Jodie or a small sculptural top-handle — something considered',
      'accessories', 'Jennifer Fisher chain earrings or gold hoops, a simple chain necklace, one good ring'
    ),
    'color_palette', 'Ivory, camel, champagne, warm stone — the palette of someone for whom the tomato salad is not the point but will appreciate it',
    'budget_dupe', 'Zara does the blazer-as-top moment very well. COS for the trousers. One secondhand Bottega or a well-chosen resale bag. Swan rewards aesthetic commitment over labels.'
  )
)
WHERE name = 'Swan Miami' AND city_id = '11111111-0000-0000-0000-000000000003';

-- Wynwood Walls
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('Stüssy', 'Carhartt WIP', 'New Balance', 'Supreme'),
    'outfit', jsonb_build_object(
      'top', 'A graphic tee from an artist you actually follow, or a clean Stüssy crewneck — something with a reference',
      'bottom', 'Vintage Levi''s 501 or dark Carhartt WIP trousers',
      'shoes', 'New Balance 2002R or 550 in a considered colourway, clean',
      'bag', 'Canvas tote with something in it — a magazine, a sketchbook, a camera',
      'accessories', 'A vintage watch, nothing expensive, small hoops or a single stud'
    ),
    'color_palette', 'Washed indigo, off-white, faded olive — the palette of someone who goes to openings but doesn''t only go to openings',
    'budget_dupe', 'The Wynwood look is deliberately non-aspirational — the flex is cultural, not financial. A $30 vintage tee from a good thrift store beats anything new. The sneakers are the one investment.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('Ganni', 'Jacquemus', 'New Balance', 'Nanushka'),
    'outfit', jsonb_build_object(
      'top', 'A vintage band tee tucked in or a Ganni floral blouse — something that looks considered but casual',
      'bottom', 'Vintage Levi''s cut-offs or wide-leg linen trousers in ecru',
      'shoes', 'New Balance 550 in clean white or a leather sandal flat',
      'bag', 'A small crossbody or a canvas tote — nothing precious for walking the walls',
      'accessories', 'Thin gold chain, small hoops or mismatched earrings, minimal'
    ),
    'color_palette', 'Vintage washes, botanical, ecru, pops of primary — the walls provide all the colour you need',
    'budget_dupe', 'Wynwood is the least judgemental space on this list. Good vintage Levi''s, a clean sneaker, a tote. The only flex is the tan and the pace at which you look at things.'
  )
)
WHERE name = 'Wynwood Walls' AND city_id = '11111111-0000-0000-0000-000000000003';

-- The Bass Museum of Art
UPDATE locations SET what_to_wear = jsonb_build_object(
  'men', jsonb_build_object(
    'brands', jsonb_build_array('A.P.C.', 'COS', 'Veja', 'Arket'),
    'outfit', jsonb_build_object(
      'top', 'A clean Oxford shirt in white or chambray, or a fine-knit crewneck — something that says you came here on purpose',
      'bottom', 'Dark slim chino or well-cut dark jeans',
      'shoes', 'White leather sneakers or clean leather loafers',
      'bag', 'Slim backpack or a canvas tote',
      'accessories', 'A simple watch, minimal — the Bass is about the work, not the wrist'
    ),
    'color_palette', 'White, chambray blue, dark navy — the palette of someone who reads the wall text',
    'budget_dupe', 'COS or Uniqlo does the intellectual-casual thing well. The sneakers are the one place to put any money.'
  ),
  'women', jsonb_build_object(
    'brands', jsonb_build_array('A.P.C.', 'Sézane', 'Veja', 'Arket'),
    'outfit', jsonb_build_object(
      'top', 'A simple linen or cotton shirt dress in white or pale blue, or a fine-knit top with linen trousers',
      'bottom', 'Part of the dress or wide-leg linen',
      'shoes', 'White leather sneakers or simple leather sandals',
      'bag', 'Canvas tote or a small leather crossbody — something hands-free for the galleries',
      'accessories', 'Small gold hoops, a thin bracelet, a light scarf if the AC is ambitious'
    ),
    'color_palette', 'White, pale blue, ecru — clean, editorial, museum-correct',
    'budget_dupe', 'The Bass is fully accessible on any budget. Clean, considered, unhurried. Any version of the white linen palette done with good posture works.'
  )
)
WHERE name = 'The Bass Museum of Art' AND city_id = '11111111-0000-0000-0000-000000000003';
