/*populate taxon list - this is for initial setup when moving databases 
  (e.g. between development and production)
*/


insert into
  taxon (
    taxon_id,
    genus,
    species,
    common,
    color_id
  )
values
  (1, null, null, null, 1),
  (2, 'Quercus', 'alba','White oak',1),
  (3, 'Platanus', 'x acerifolia','London planetree',1),
  (4, 'Tilia', 'cordata','Littleleaf linden',1),
  (5, 'Acer', 'platanoides','Norway maple',1),
  (6, 'Fraxinus', 'pennsylvanica','Green ash',1),
  (7, 'Pyrus', 'calleryana','Callery pear',1),
  (8, 'Gleditsia', 'triacanthos','Honeylocust',1),
  (9, 'Acer', 'saccharinum','Silver maple',1),
  (10, 'Quercus', 'palustris','Pin oak',1),
  (11, 'Ginkgo', 'biloba','Ginkgo',1),
  (12, 'Ulmus', 'procera','English elm',1)
;